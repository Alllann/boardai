import type { Glossary, GlossaryEntry } from "./schemas";

export function mergeGlossaryEntries(
  existing: GlossaryEntry[],
  incoming: GlossaryEntry[],
): GlossaryEntry[] {
  const byMatch = new Map<string, GlossaryEntry>();
  for (const entry of existing) {
    byMatch.set(entry.match.toLowerCase(), entry);
  }
  for (const entry of incoming) {
    byMatch.set(entry.match.toLowerCase(), entry);
  }
  return Array.from(byMatch.values());
}

export function mergeGlossaries(a: Glossary | null | undefined, b: Glossary): Glossary {
  return {
    entries: mergeGlossaryEntries(a?.entries ?? [], b.entries),
  };
}
