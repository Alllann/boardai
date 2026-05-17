import { z } from "zod";

import type { ExplainRequest } from "./schemas";

export const EXPLAIN_EVAL_JUDGE_MIN_DIMENSION = 3;
export const EXPLAIN_EVAL_JUDGE_MIN_OVERALL = 3.5;

const judgeScoresSchema = z.object({
  beginner_clarity: z.number().min(1).max(5),
  brevity: z.number().min(1).max(5),
  meeting_relevance: z.number().min(1).max(5),
  rule_compliance: z.number().min(1).max(5),
  structure: z.number().min(1).max(5),
});

export const explainEvalJudgeResultSchema = z.object({
  scores: judgeScoresSchema,
  overall: z.number().min(1).max(5),
  failures: z.array(z.string()),
  summary: z.string().optional(),
});

export type ExplainEvalJudgeResult = z.infer<typeof explainEvalJudgeResultSchema>;

export type ExplainEvalCaseMeta = {
  id: string;
  description: string;
};

export function explainEvalJudgePrompt(
  meta: ExplainEvalCaseMeta,
  request: ExplainRequest,
  explanation: string,
): string {
  const contextParts: string[] = [];
  if (request.meetingGoal) {
    contextParts.push(`Meeting goal: ${request.meetingGoal}`);
  }
  if (request.transcriptSnippet) {
    contextParts.push(`Transcript snippet:\n${request.transcriptSnippet}`);
  }
  if (request.briefingSnippet) {
    contextParts.push(`Briefing snippet:\n${request.briefingSnippet}`);
  }

  return `You are an evaluation judge for on-demand "Explain" text shown in a small UI popover to a beginner reader.

Score the EXPLANATION (not the selection) on five dimensions from 1 (poor) to 5 (excellent):

1. beginner_clarity — Plain language; domain jargon defined before use; teachable for a non-expert.
2. brevity — Short enough for a small popover; no lecture or wall of text.
3. meeting_relevance — Tied to this advisory session, not generic textbook content.
4. rule_compliance — Does NOT speak as the expert or Chair; does NOT rewrite or extensively quote the selected wording.
5. structure — Defines key terms first, then what the selection means in this meeting (matches the product intent).

Case: ${meta.id}
Case note: ${meta.description}

User brief (audience calibration only):
---
${request.userBrief.slice(0, 800)}${request.userBrief.length > 800 ? "\n…" : ""}
---

Session context:
${contextParts.length > 0 ? contextParts.join("\n\n") : "(minimal)"}

Surrounding paragraph:
---
${request.surroundingParagraph?.trim() || "(none)"}
---

Selected text:
---
${request.selection.trim()}
---

Explanation to score:
---
${explanation.trim()}
---

Output ONLY valid JSON (no markdown fences) with this shape:
{
  "scores": {
    "beginner_clarity": number,
    "brevity": number,
    "meeting_relevance": number,
    "rule_compliance": number,
    "structure": number
  },
  "overall": number,
  "failures": ["string"],
  "summary": "one sentence"
}

Rules for scoring:
- overall should reflect the weakest important dimension (not a simple average).
- Add a failure string for each serious issue (e.g. too long, expert voice, undefined jargon).
- Be strict on brevity: scores above 3 require fitting a ~350 character popover mentally.`;
}

export function parseExplainEvalJudgeResult(text: string): ExplainEvalJudgeResult {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const raw = jsonMatch ? jsonMatch[0] : trimmed;
  return explainEvalJudgeResultSchema.parse(JSON.parse(raw));
}

export function judgeResultPasses(result: ExplainEvalJudgeResult): boolean {
  if (result.overall < EXPLAIN_EVAL_JUDGE_MIN_OVERALL) return false;
  const scores = result.scores;
  if (scores.beginner_clarity < EXPLAIN_EVAL_JUDGE_MIN_DIMENSION) return false;
  if (scores.brevity < EXPLAIN_EVAL_JUDGE_MIN_DIMENSION) return false;
  if (scores.meeting_relevance < EXPLAIN_EVAL_JUDGE_MIN_DIMENSION) return false;
  if (scores.rule_compliance < EXPLAIN_EVAL_JUDGE_MIN_DIMENSION) return false;
  if (scores.structure < EXPLAIN_EVAL_JUDGE_MIN_DIMENSION) return false;
  return true;
}
