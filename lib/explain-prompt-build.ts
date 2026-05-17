import type { ExplainRequest } from "./schemas";

export function buildExplainPromptContext(req: ExplainRequest): {
  audienceBlock: string;
  sessionBlock: string;
  surroundingBlock: string;
  selectionBlock: string;
} {
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

  return {
    audienceBlock: `Audience hint from the user's brief (calibrate depth only; do not quote verbatim):
---
${req.userBrief.slice(0, 1200)}${req.userBrief.length > 1200 ? "\n…(truncated)" : ""}
---`,
    sessionBlock: `Session context (${location}):
${contextParts.length > 0 ? contextParts.join("\n\n") : "(minimal context)"}`,
    surroundingBlock: `Surrounding paragraph (for disambiguation):
---
${req.surroundingParagraph?.trim() || "(none provided)"}
---`,
    selectionBlock: `Selected text to explain:
---
${req.selection.trim()}
---`,
  };
}

export function assembleExplainPrompt(
  intro: string,
  ctx: ReturnType<typeof buildExplainPromptContext>,
  rules: string,
): string {
  return `${intro}

${ctx.audienceBlock}

${ctx.sessionBlock}

${ctx.surroundingBlock}

${ctx.selectionBlock}

Rules:
${rules}`;
}
