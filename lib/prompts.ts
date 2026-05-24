import { BOARD_AUDIENCE_INSTRUCTIONS } from "./board-audience";
import {
  MAX_ROLES,
  MAX_TURNS,
  MIN_ROLES,
  TARGET_TURNS_MAX,
  TARGET_TURNS_MIN,
} from "./board-constants";

export function chairMeetingPlanPrompt(userBrief: string): string {
  return `You are the Chair of an advisory board. Your job in THIS message only is to DESIGN the meeting: pick the minimal expert roster and a turn-by-turn speaking schedule for the brief below.

User brief:
---
${userBrief}
---

Rules:
- Pick between ${MIN_ROLES} and ${MAX_ROLES} experts. Each expert has a unique machine id \`id\`: lowercase_snake_case (letters, digits, underscore), starting with a letter.
- \`title\` is the expert's board seat / expert title — how you would introduce them. Use a recognizable role name, NOT a topic label (avoid "Unit economics", "Regulatory AI" as titles).
- \`mandate\` is their detailed, non-overlapping scope task based on their expertise. Put functional/topic detail in mandate, not in title. Mandates should steer experts to stress-test in language a non-specialist board member can follow.
- Create \`turnSchedule\`: an ordered array of length between ${TARGET_TURNS_MIN} and ${TARGET_TURNS_MAX} (inclusive) of \`roleId\` strings. Repeat ids where a real meeting would bring someone back (objections, follow-ups). Order should create cross-talk and tension—not a rigid "everyone speaks once" go-around.
- Include \`meetingGoal\`: one sentence on what this session must decide or stress-test based on user brief. Do not create a goal that is not directly implied by user brief.
- Optional \`chairNotesForFacilitator\`: short private notes for the facilitator. Include: require accessible language and visible reasoning chains (claim → because → implication); push for at least one sustained disagreement before the last third of turns.

Output ONLY valid JSON (no markdown, no commentary) matching this shape:
{
  "roles": [{ "id": "string", "title": "string", "mandate": "string" }],
  "turnSchedule": ["role_id", "..."],
  "meetingGoal": "string",
  "chairNotesForFacilitator": "optional string"
}

Hard limits enforced downstream: at most ${MAX_ROLES} roles, at most ${MAX_TURNS} total scheduled turns (your schedule must stay within ${TARGET_TURNS_MIN}-${TARGET_TURNS_MAX} as requested).`;
}

export function chairMeetingPlanRetryPrompt(
  userBrief: string,
  validationError: string,
): string {
  return `${chairMeetingPlanPrompt(userBrief)}

IMPORTANT: Your previous JSON failed validation: ${validationError}
Return corrected JSON ONLY.`;
}

export function expertTurnPrompt(params: {
  expertTitle: string;
  mandate: string;
  otherExperts: { title: string }[];
  transcriptLines: string;
  chairNotes?: string;
}): string {
  const others =
    params.otherExperts.length > 0
      ? params.otherExperts.map((e) => e.title).join(", ")
      : "(none yet)";
  const notes = params.chairNotes
    ? `\nChair guidance for this meeting (internal): ${params.chairNotes}\n`
    : "";
  return `You are ONLY the expert: "${params.expertTitle}".
Your mandate: ${params.mandate}
${notes}
${BOARD_AUDIENCE_INSTRUCTIONS}

Other participants in this board (reference them by TITLE when relevant): ${others}

Discussion so far:
---
${params.transcriptLines}
---

Write ONE message (3 to 7 sentences). React to the most relevant points; you may disagree, qualify, or build on others. Reference others by shorterned name.

How to structure your message (in flowing prose, could involve labeled bullets if it helps make your point clearer):
- When relevant, selectively anchor to one of the previous speakers' point before stating your own.
- State your position clearly.
- Explicitly state your reasoning chain where it makes your position convincing and sensible.
- Close with what your point implies for the decision the board is making.

Do NOT speak for other roles or narrate the meeting meta.`;
}

export function chairBriefingPrompt(params: {
  userBrief: string;
  meetingPlanJson: string;
  transcriptText: string;
}): string {
  return `You are the Chair. The board session has finished. Using the user's original brief, the meeting plan you designed, and the full transcript, produce the owner's insight memo — not a transcript recap.

${BOARD_AUDIENCE_INSTRUCTIONS}

Original brief:
---
${params.userBrief}
---

Meeting plan (JSON):
${params.meetingPlanJson}

Transcript:
---
${params.transcriptText}
---

Output ONLY valid JSON (no markdown, no commentary) with this exact shape:
{
  "headline": "string — one plain-language line: the board's recommendation (go / no-go / pivot / investigate) and immediate next move",
  "keyTakeaways": ["string — 2 to 5 insight bullets, plain language, each scannable on its own"],
  "thesis": "string — the board's synthesized conclusion after debate; tradeoffs and framing in plain language",
  "keyRisks": ["string"],
  "experiments": ["string — each item should imply how to validate"],
  "sevenDayPlan": ["string — ordered steps or day-scoped actions"],
  "openQuestions": ["string"],
  "dissentOrUnresolved": "optional string — what the board still disagrees on and what would resolve it"
}

Field guidance:
- headline: Outcome-first for a busy owner. No jargon; do not repeat the 7-day plan verbatim.
- keyTakeaways: Cross-cutting insights from the debate — not a chronological walkthrough. Each bullet: short lead, then why it matters. Do not reference "as discussed above" without restating the point.
- thesis: Synthesize the board's position — may be more nuanced than headline/takeaways. Plain language throughout.
- keyRisks, experiments, openQuestions: Each array item scannable — short lead clause, then why it matters (e.g. "Cash runway: ~4 months at current burn — limits how aggressive the launch can be.").
- dissentOrUnresolved: Plain-language summary of unresolved debate and what evidence or decision would settle it.

Anti-patterns: no transcript walkthrough, no undefined acronyms, no specialist jargon without a plain-language gloss.

If experts disagreed, use dissentOrUnresolved. Arrays must be non-empty except openQuestions may be empty only if truly none. keyTakeaways must have 2–5 items.`;
}

export function chairBriefingRetryPrompt(params: {
  userBrief: string;
  meetingPlanJson: string;
  transcriptText: string;
  validationError: string;
}): string {
  return `${chairBriefingPrompt(params)}

IMPORTANT: Previous JSON failed validation: ${params.validationError}
Return corrected JSON ONLY.`;
}
