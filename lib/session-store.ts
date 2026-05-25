import type {
  ChairBriefing,
  Glossary,
  MeetingPlan,
  MeetingProposal,
  SessionPhase,
  SessionTimelineEvent,
  ThreadItem,
  TranscriptTurn,
} from "./schemas";

export type SessionStatus =
  | "idle"
  | "running"
  | "awaiting_user"
  | "complete"
  | "error";

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
  phase: SessionPhase;
  roundCount: number;
  meetingPlan: MeetingPlan | null;
  turns: TranscriptTurn[];
  briefing: ChairBriefing | null;
  glossary: Glossary | null;
  error: string | null;
  timeline: SessionTimelineEvent[];
  thread: ThreadItem[];
  pendingProposal: MeetingProposal | null;
  /** Follow-up user messages not yet tied to thread (legacy compat) */
  userMessages: { id: string; content: string; timestamp: number; roundId: number }[];
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
      o.status === "awaiting_user" ||
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

/** Normalize legacy sessions missing new fields. */
export function migrateSession(raw: Record<string, unknown>): BoardSession {
  const status = raw.status as BoardSession["status"];
  const turns = (raw.turns as TranscriptTurn[]) ?? [];
  const briefing = (raw.briefing as ChairBriefing | null) ?? null;
  const glossary = (raw.glossary as Glossary | null) ?? null;

  let phase = (raw.phase as SessionPhase | undefined) ?? "kickstart";
  if (!raw.phase) {
    if (glossary) phase = "idle";
    else if (turns.length > 0 || briefing) phase = "discussion";
    else if (status === "awaiting_user") phase = "kickstart";
  }

  const thread = (raw.thread as ThreadItem[] | undefined) ?? [];
  const timeline = (raw.timeline as SessionTimelineEvent[] | undefined) ?? [];

  let migratedThread = thread;
  if (thread.length === 0 && turns.length > 0) {
    migratedThread = [];
    if (raw.brief) {
      migratedThread.push({
        kind: "user",
        id: "initial-brief",
        content: raw.brief as string,
        timestamp: (raw.createdAt as number) ?? Date.now(),
        roundId: 1,
      });
    }
    for (const t of turns) {
      migratedThread.push({ kind: "expert", roundId: 1, ...t });
    }
    if (briefing) {
      migratedThread.push({ kind: "briefing", roundId: 1, payload: briefing });
    }
  }

  return {
    id: raw.id as string,
    title: raw.title as string,
    brief: raw.brief as string,
    createdAt: raw.createdAt as number,
    updatedAt: raw.updatedAt as number,
    status:
      status === "complete"
        ? "idle"
        : (status ?? "idle"),
    phase,
    roundCount: (raw.roundCount as number | undefined) ?? (turns.length > 0 ? 1 : 0),
    meetingPlan: (raw.meetingPlan as MeetingPlan | null) ?? null,
    turns,
    briefing,
    glossary,
    error: (raw.error as string | null) ?? null,
    timeline,
    thread: migratedThread,
    pendingProposal: (raw.pendingProposal as MeetingProposal | null) ?? null,
    userMessages:
      (raw.userMessages as BoardSession["userMessages"] | undefined) ??
      migratedThread
        .filter((t): t is Extract<ThreadItem, { kind: "user" }> => t.kind === "user")
        .filter((t) => t.roundId > 1)
        .map((t) => ({
          id: t.id,
          content: t.content,
          timestamp: t.timestamp,
          roundId: t.roundId,
        })),
  };
}

export function loadSession(id: string): BoardSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return migrateSession(parsed);
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
    phase: "kickstart",
    roundCount: 0,
    meetingPlan: null,
    turns: [],
    briefing: null,
    glossary: null,
    error: null,
    timeline: [],
    thread: [
      {
        kind: "user",
        id: "initial-brief",
        content: trimmed,
        timestamp: now,
        roundId: 1,
      },
    ],
    pendingProposal: null,
    userMessages: [],
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

export function appendTimelineEvent(
  id: string,
  event: Omit<SessionTimelineEvent, "id"> & { id?: string },
): BoardSession | null {
  const session = loadSession(id);
  if (!session) return null;

  const entry: SessionTimelineEvent = {
    id: event.id ?? crypto.randomUUID(),
    message: event.message,
    timestamp: event.timestamp,
    afterTurnCount: event.afterTurnCount,
  };

  const exists = session.timeline.some(
    (e) => e.message === entry.message && e.afterTurnCount === entry.afterTurnCount,
  );
  if (exists) return session;

  const statusItem: ThreadItem = { kind: "status", ...entry };
  return patchSession(id, {
    timeline: [...session.timeline, entry],
    thread: [...session.thread, statusItem],
  });
}

export function appendThreadItem(id: string, item: ThreadItem): BoardSession | null {
  const session = loadSession(id);
  if (!session) return null;
  return patchSession(id, { thread: [...session.thread, item] });
}

export function syncTurnToThread(
  id: string,
  turn: TranscriptTurn,
  roundId: number,
): BoardSession | null {
  const session = loadSession(id);
  if (!session) return null;

  const expertItem: ThreadItem = { kind: "expert", roundId, ...turn };
  const turns = session.turns.some((t) => t.id === turn.id)
    ? session.turns
    : [...session.turns, turn];

  return patchSession(id, {
    turns,
    thread: [...session.thread, expertItem],
  });
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

export function getMentionCandidates(session: BoardSession): {
  id: string;
  label: string;
  type: "chair" | "expert";
}[] {
  const chair = { id: "chair", label: "Chair", type: "chair" as const };
  const experts =
    session.meetingPlan?.roles.map((r) => ({
      id: r.id,
      label: r.title,
      type: "expert" as const,
    })) ?? [];
  return [chair, ...experts];
}
