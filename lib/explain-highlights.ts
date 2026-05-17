const STORAGE_PREFIX = "boardai-explain-highlights:";

export type ExplainHighlight = {
  id: string;
  start: number;
  end: number;
  selection: string;
  explanation: string;
};

function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

export function explainHighlightsKey(
  parts: Record<string, string | number | undefined>,
): string {
  return `${STORAGE_PREFIX}${hashString(JSON.stringify(parts))}`;
}

export function getStoredExplainHighlights(key: string): ExplainHighlight[] {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isExplainHighlight);
  } catch {
    return [];
  }
}

export function setStoredExplainHighlights(
  key: string,
  highlights: ExplainHighlight[],
): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(highlights));
  } catch {
    /* quota or private mode */
  }
}

function isExplainHighlight(v: unknown): v is ExplainHighlight {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.start === "number" &&
    typeof o.end === "number" &&
    typeof o.selection === "string" &&
    typeof o.explanation === "string" &&
    o.start >= 0 &&
    o.end > o.start
  );
}

export function mergeExplainHighlight(
  existing: ExplainHighlight[],
  next: Omit<ExplainHighlight, "id"> & { id?: string },
): ExplainHighlight[] {
  const id = next.id ?? crypto.randomUUID();
  const highlight: ExplainHighlight = { ...next, id };
  const withoutOverlap = existing.filter(
    (h) => h.end <= highlight.start || h.start >= highlight.end,
  );
  return [...withoutOverlap, highlight].sort((a, b) => a.start - b.start);
}
