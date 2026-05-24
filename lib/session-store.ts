import type {
  ChairBriefing,
  Glossary,
  MeetingPlan,
  TranscriptTurn,
} from "./schemas";

export type SessionStatus = "idle" | "running" | "complete" | "error";

export type SessionSummary = {
  id: string;
  title: string;
  updatedAt: number;
  status: SessionStatus;
};

export type BoardSession = {
  id: string;
  title: string;
  brief: string;
  createdAt: number;
  updatedAt: number;
  status: SessionStatus;
  meetingPlan: MeetingPlan | null;
  turns: TranscriptTurn[];
  briefing: ChairBriefing | null;
  glossary: Glossary | null;
  error: string | null;
};

const INDEX_KEY = "boardai:sessions";
const SESSION_KEY_PREFIX = "boardai:session:";
export const AUTOSTART_KEY_PREFIX = "boardai:autostart:";
export const SIDEBAR_COLLAPSED_KEY = "boardai:sidebar-collapsed";
export const SESSIONS_CHANGED_EVENT = "boardai:sessions-changed";

const MAX_SESSIONS = 30;
const TITLE_MAX = 48;

function sessionKey(id: string): string {
  return `${SESSION_KEY_PREFIX}${id}`;
}

export function truncateTitle(text: string): string {
  const t = text.trim();
  if (t.length <= TITLE_MAX) return t;
  return `${t.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

export function createSessionId(): string {
  return crypto.randomUUID();
}

function isSummary(v: unknown): v is SessionSummary {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.updatedAt === "number" &&
    (o.status === "idle" ||
      o.status === "running" ||
      o.status === "complete" ||
      o.status === "error")
  );
}

function toSummary(session: BoardSession): SessionSummary {
  return {
    id: session.id,
    title: session.title,
    updatedAt: session.updatedAt,
    status: session.status,
  };
}

function readIndex(): SessionSummary[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSummary);
  } catch {
    return [];
  }
}

function writeIndex(summaries: SessionSummary[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(summaries));
}

export function notifySessionsChanged(): void {
  window.dispatchEvent(new Event(SESSIONS_CHANGED_EVENT));
}

export function listSessionSummaries(): SessionSummary[] {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadSession(id: string): BoardSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as BoardSession;
  } catch {
    return null;
  }
}

export function saveSession(session: BoardSession): void {
  localStorage.setItem(sessionKey(session.id), JSON.stringify(session));
  const summaries = readIndex().filter((s) => s.id !== session.id);
  summaries.unshift(toSummary(session));
  summaries.sort((a, b) => b.updatedAt - a.updatedAt);

  while (summaries.length > MAX_SESSIONS) {
    const removed = summaries.pop();
    if (removed) localStorage.removeItem(sessionKey(removed.id));
  }

  writeIndex(summaries);
  notifySessionsChanged();
}

export function createSession(brief: string): BoardSession {
  const now = Date.now();
  const trimmed = brief.trim();
  const session: BoardSession = {
    id: createSessionId(),
    title: truncateTitle(trimmed),
    brief: trimmed,
    createdAt: now,
    updatedAt: now,
    status: "running",
    meetingPlan: null,
    turns: [],
    briefing: null,
    glossary: null,
    error: null,
  };
  saveSession(session);
  sessionStorage.setItem(`${AUTOSTART_KEY_PREFIX}${session.id}`, "1");
  return session;
}

export function patchSession(
  id: string,
  patch: Partial<Omit<BoardSession, "id" | "createdAt">>,
): BoardSession | null {
  const existing = loadSession(id);
  if (!existing) return null;

  const updated: BoardSession = {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  };

  if (patch.briefing?.headline) {
    updated.title = truncateTitle(patch.briefing.headline);
  } else if (patch.title) {
    updated.title = truncateTitle(patch.title);
  }

  saveSession(updated);
  return updated;
}

export function markAutostart(id: string): boolean {
  const key = `${AUTOSTART_KEY_PREFIX}${id}`;
  if (sessionStorage.getItem(key) !== "1") return false;
  sessionStorage.removeItem(key);
  return true;
}

export function groupSessionsByDate(
  sessions: SessionSummary[],
): { label: string; items: SessionSummary[] }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfWeek = startOfToday - 6 * 86_400_000;

  const groups: { label: string; items: SessionSummary[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const s of sessions) {
    if (s.updatedAt >= startOfToday) groups[0]!.items.push(s);
    else if (s.updatedAt >= startOfYesterday) groups[1]!.items.push(s);
    else if (s.updatedAt >= startOfWeek) groups[2]!.items.push(s);
    else groups[3]!.items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}
