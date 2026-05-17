import {
  MAX_READER_EXPLANATION_CHARS,
  MAX_READER_THREAD_FRAMING_CHARS,
} from "./board-constants";
import type { ChairBriefing, MeetingPlan, TranscriptTurn } from "./schemas";

export function buildReaderBundle(
  userBrief: string,
  plan: MeetingPlan,
  turns: TranscriptTurn[],
  briefing?: ChairBriefing,
): string {
  const transcriptBlock = turns
    .map((t) => `[turnId=${t.id}] ${t.roleName}: ${t.content}`)
    .join("\n\n");

  const planBlock = `Meeting goal: ${plan.meetingGoal}\nRoles:\n${plan.roles.map((r) => `- ${r.title} (id=${r.id}): ${r.mandate}`).join("\n")}`;

  let bundle = `USER BRIEF (calibrate explanation depth — do not quote back verbatim):\n${userBrief}\n\n---\nMEETING PLAN:\n${planBlock}\n\n---\nTRANSCRIPT (read-only; do NOT rewrite or replace expert wording):\n${transcriptBlock}`;

  if (briefing) {
    const briefingBlock = [
      `[section=executiveSummary] ${briefing.executiveSummary}`,
      `[section=thesis] ${briefing.thesis}`,
      ...briefing.keyRisks.map(
        (r, i) => `[section=keyRisks index=${i}] ${r}`,
      ),
      ...briefing.experiments.map(
        (e, i) => `[section=experiments index=${i}] ${e}`,
      ),
      ...briefing.sevenDayPlan.map(
        (s, i) => `[section=sevenDayPlan index=${i}] ${s}`,
      ),
      ...briefing.openQuestions.map(
        (q, i) => `[section=openQuestions index=${i}] ${q}`,
      ),
      briefing.dissentOrUnresolved
        ? `[section=dissentOrUnresolved] ${briefing.dissentOrUnresolved}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    bundle += `\n\n---\nCHAIR BRIEFING (read-only; explain each section for a non-expert reader):\n${briefingBlock}`;
  }

  return bundle;
}

export function readerGuidePrompt(
  userBrief: string,
  bundle: string,
  includeBriefing: boolean,
): string {
  const briefingRules = includeBriefing
    ? `
- For EVERY Chair briefing block in the material (each [section=…] line), add one entry in \`briefingExplanations\` with matching \`section\` and \`index\` when the block has index=N (omit index for executiveSummary, thesis, dissentOrUnresolved).
- Briefing explanations: thorough plain-language notes on what the Chair is telling the owner and why it follows from the debate. Do NOT rewrite the Chair's wording.`
    : "";

  const briefingJson = includeBriefing
    ? ',"briefingExplanations":[{"section":"thesis","explanation":"string"},{"section":"keyRisks","index":0,"explanation":"string"}]'
    : "";

  return `You are a reader guide for an advisory board transcript. Your ONLY job is to help a smart reader who is NOT trained in this domain understand what each expert meant and why it mattered in the debate${includeBriefing ? ", and what each part of the Chair's briefing means" : ""}.

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
- For EVERY transcript turn (each [turnId=N] block), add one entry in \`turnExplanations\` with matching \`turnId\` and a thorough plain-language \`explanation\`.
- Write EXPLANATIONS, not summaries: clarify intent, stakes, how the point responds to prior speakers, and plain-language meaning of jargon. Use as many sentences as needed; do not truncate for brevity.
- Do NOT quote or paraphrase the experts' exact sentences; do NOT rewrite their dialogue; do NOT change their tone.
- Each \`explanation\` may be up to ${MAX_READER_EXPLANATION_CHARS} characters; prefer completeness over length limits.
- Optional \`threadFraming\`: ≤ ${MAX_READER_THREAD_FRAMING_CHARS} characters on what the meeting is wrestling with (only if helpful).${briefingRules}

JSON shape:
{"turnExplanations":[{"turnId":1,"explanation":"string"}]${briefingJson},"threadFraming":"optional string"}`;
}
