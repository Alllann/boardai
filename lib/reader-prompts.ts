import {
  MAX_READER_EXPLANATION_CHARS,
  MAX_READER_THREAD_FRAMING_CHARS,
} from "./board-constants";
import type { MeetingPlan, TranscriptTurn } from "./schemas";

export function buildReaderBundle(
  userBrief: string,
  plan: MeetingPlan,
  turns: TranscriptTurn[],
): string {
  const transcriptBlock = turns
    .map((t) => `[turnId=${t.id}] ${t.roleName}: ${t.content}`)
    .join("\n\n");

  const planBlock = `Meeting goal: ${plan.meetingGoal}\nRoles:\n${plan.roles.map((r) => `- ${r.name} (id=${r.id}): ${r.mandate}`).join("\n")}`;

  return `USER BRIEF (calibrate explanation depth — do not quote back verbatim):\n${userBrief}\n\n---\nMEETING PLAN:\n${planBlock}\n\n---\nTRANSCRIPT (read-only; do NOT rewrite or replace expert wording):\n${transcriptBlock}`;
}

export function readerGuidePrompt(userBrief: string, bundle: string): string {
  return `You are a reader guide for an advisory board transcript. Your ONLY job is to help a smart reader who is NOT trained in this domain understand what each expert meant and why it mattered in the debate.

Audience hint from the user's brief (use only to calibrate depth):
---
${userBrief.slice(0, 1500)}${userBrief.length > 1500 ? "\n…(truncated)" : ""}
---

Material to explain (read-only):
---
${bundle}
---

Rules:
- Output ONLY valid JSON, no markdown fences.
- For EVERY transcript turn (each [turnId=N] block), add one entry in \`turnExplanations\` with matching \`turnId\` and an \`explanation\` of 2–4 sentences.
- Write EXPLANATIONS, not summaries: clarify intent, stakes, how the point responds to prior speakers, and plain-language meaning of jargon. Do NOT compress into one short line.
- Do NOT quote or paraphrase the experts' exact sentences; do NOT rewrite their dialogue; do NOT change their tone.
- HARD LIMIT: each \`explanation\` must be ≤ ${MAX_READER_EXPLANATION_CHARS} characters (count before output). Prefer concise plain language over length.
- Optional \`threadFraming\`: ≤ ${MAX_READER_THREAD_FRAMING_CHARS} characters on what the meeting is wrestling with (only if helpful).

JSON shape:
{"turnExplanations":[{"turnId":1,"explanation":"string"}],"threadFraming":"optional string"}`;
}
