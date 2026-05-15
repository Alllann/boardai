/**
 * Pull a single JSON object from model output (handles ```json fences and trailing prose).
 */
export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/i;
  const m = trimmed.match(fence);
  const candidate = m ? m[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return candidate.slice(start, end + 1);
}
