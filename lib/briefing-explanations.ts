import type { BriefingExplanation, BriefingSection } from "./schemas";

export function briefingExplanationKey(
  section: BriefingSection,
  index?: number,
): string {
  return index !== undefined ? `${section}:${index}` : section;
}

export function indexBriefingExplanations(
  entries: BriefingExplanation[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!entries) return map;
  for (const e of entries) {
    map.set(briefingExplanationKey(e.section, e.index), e.explanation);
  }
  return map;
}
