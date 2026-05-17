import { MAX_ON_DEMAND_EXPLAIN_CHARS } from "./board-constants";
import type { ExplainRequest } from "./schemas";

export function onDemandExplainPrompt(req: ExplainRequest): string {
  const contextParts: string[] = [];
  if (req.meetingGoal) {
    contextParts.push(`Meeting goal: ${req.meetingGoal}`);
  }
  if (req.transcriptSnippet) {
    contextParts.push(`Recent transcript:\n${req.transcriptSnippet}`);
  }
  if (req.briefingSnippet) {
    contextParts.push(`Chair briefing excerpt:\n${req.briefingSnippet}`);
  }

  const location =
    req.source === "transcript"
      ? `transcript turn id=${req.turnId ?? "unknown"}`
      : `Chair briefing section=${req.section ?? "unknown"}${req.sectionIndex !== undefined ? ` index=${req.sectionIndex}` : ""}`;

  return `You explain selected text from an advisory board session for a smart reader who is NOT trained in this domain.

Audience hint from the user's brief (calibrate depth only; do not quote verbatim):
---
${req.userBrief.slice(0, 1200)}${req.userBrief.length > 1200 ? "\n…(truncated)" : ""}
---

Session context (${location}):
${contextParts.length > 0 ? contextParts.join("\n\n") : "(minimal context)"}

Surrounding paragraph (for disambiguation):
---
${req.surroundingParagraph?.trim() || "(none provided)"}
---

Selected text to explain:
---
${req.selection.trim()}
---

Rules:
- Output plain prose only (no JSON, no markdown headings). Maximum ${MAX_ON_DEMAND_EXPLAIN_CHARS} characters.
- Explain keywords in the selection, then what the selection means in this meeting in plain language.
- Do NOT rewrite, quote, or replace the selected wording. Do NOT speak as the expert or Chair.
- If the selection is ambiguous, say what is ambiguous and give the most likely reading.
- If the selection is too vague (e.g. a single common word), say so briefly and explain the nearest meaningful phrase from context.
- Optional: name 1–2 related terms the reader might look up, without defining the whole domain.`;
}
