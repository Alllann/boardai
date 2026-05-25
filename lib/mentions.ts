/** Parse @mentions from user message text against known labels. */
export function parseMentions(
  message: string,
  candidates: { id: string; label: string }[],
): { id: string; label: string; start: number; end: number }[] {
  const found: { id: string; label: string; start: number; end: number }[] = [];
  const sorted = [...candidates].sort((a, b) => b.label.length - a.label.length);

  for (const c of sorted) {
    const pattern = new RegExp(
      `@${escapeRegex(c.label)}(?=\\s|$|[.,!?;:])`,
      "gi",
    );
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(message)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      const overlaps = found.some((f) => start < f.end && end > f.start);
      if (!overlaps) {
        found.push({ id: c.id, label: c.label, start, end });
      }
    }
  }

  return found.sort((a, b) => a.start - b.start);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renderMessageWithMentions(
  message: string,
  mentions: { start: number; end: number; label: string }[],
): { type: "text" | "mention"; value: string }[] {
  if (mentions.length === 0) return [{ type: "text", value: message }];

  const parts: { type: "text" | "mention"; value: string }[] = [];
  let cursor = 0;
  for (const m of mentions) {
    if (m.start > cursor) {
      parts.push({ type: "text", value: message.slice(cursor, m.start) });
    }
    parts.push({ type: "mention", value: `@${m.label}` });
    cursor = m.end;
  }
  if (cursor < message.length) {
    parts.push({ type: "text", value: message.slice(cursor) });
  }
  return parts;
}
