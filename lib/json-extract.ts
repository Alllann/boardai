/**
 * Pull a single JSON object from model output (handles ```json fences and trailing prose).
 */
export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/i;
  const m = trimmed.match(fence);
  const candidate = m ? m[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  if (start === -1) {
    throw new Error("No JSON object found in model output");
  }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return candidate.slice(start, i + 1);
      }
    }
  }

  throw new Error("Unclosed JSON object in model output");
}
