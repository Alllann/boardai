import { GLOSSARY_MAX_ENTRIES } from "./board-constants";
import type { ChairBriefing, MeetingPlan, TranscriptTurn } from "./schemas";

export function buildGlossaryBundle(
  userBrief: string,
  plan: MeetingPlan,
  turns: TranscriptTurn[],
  briefing: ChairBriefing,
): string {
  const transcriptBlock = turns
    .map((t) => `${t.roleName}: ${t.content}`)
    .join("\n\n");

  const briefingBlock = [
    `Headline: ${briefing.headline}`,
    `Key takeaways: ${briefing.keyTakeaways.join(" | ")}`,
    `Thesis: ${briefing.thesis}`,
    `Key risks: ${briefing.keyRisks.join(" | ")}`,
    `Experiments: ${briefing.experiments.join(" | ")}`,
    `7-day plan: ${briefing.sevenDayPlan.join(" | ")}`,
    `Open questions: ${briefing.openQuestions.join(" | ")}`,
    briefing.dissentOrUnresolved
      ? `Dissent / unresolved: ${briefing.dissentOrUnresolved}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const planBlock = `Meeting goal: ${plan.meetingGoal}\nRoles: ${plan.roles.map((r) => `${r.title} (${r.mandate})`).join("\n")}`;

  return `USER BRIEF (for audience context only — do not rewrite the dialogue):\n${userBrief}\n\n---\nMEETING PLAN:\n${planBlock}\n\n---\nTRANSCRIPT:\n${transcriptBlock}\n\n---\nCHAIR BRIEFING (same session):\n${briefingBlock}`;
}

export function glossaryPrompt(userBrief: string, bundle: string): string {
  return `You are a glossary assistant. Your ONLY job is to extract jargon, acronyms, and domain-specific multi-word phrases from the material below that a non-expert reader might not know.

Audience hint from the user's brief (do not quote it back; use only to calibrate explanation depth):
---
${userBrief.slice(0, 1500)}${userBrief.length > 1500 ? "\n…(truncated)" : ""}
---

Full material to mine for terms (read-only; do NOT rewrite, summarize, or reproduce long passages):
---
${bundle}
---

Rules:
- Output ONLY valid JSON, no markdown fences.
- Return at most ${GLOSSARY_MAX_ENTRIES} entries. Prefer high-signal phrases that actually appear verbatim (or clear acronym expansions tied to text) in the transcript or briefing.
- Each entry: "phrase" (short label), "match" (exact substring to locate in the original text for highlighting — must match character-for-character including case/spaces as it appears in the TRANSCRIPT or BRIEFING sections above), "explanation" (one clear sentence, plain language).
- "match" must be a contiguous substring from the provided material so a UI can search for it.
- Do NOT simplify or replace the experts' dialogue; do NOT add commentary outside the JSON.
- If nothing is unclear, return { "entries": [] }.

JSON shape:
{"entries":[{"phrase":"string","match":"string","explanation":"string"}]}`;
}
