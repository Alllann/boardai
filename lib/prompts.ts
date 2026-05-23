import {
  BOARD_AUDIENCE_INSTRUCTIONS,
  BOARD_POINT_STRUCTURE,
  BOARD_SESSION_PURPOSE,
  CHAIR_PYRAMID_RULES,
} from "./board-audience";
import {
  MAX_ROLES,
  MAX_TURNS,
  MIN_ROLES,
  TARGET_TURNS_MAX,
  TARGET_TURNS_MIN,
} from "./board-constants";

export function chairMeetingPlanPrompt(userBrief: string): string {
  return `You are the Chair of a deliberative advisory board. Your job in THIS message only is to DESIGN a directed session: pick the minimal expert roster and a turn-by-turn speaking schedule for the submitter's brief below.

${BOARD_SESSION_PURPOSE}

Submitter brief:
---
${userBrief}
---

Rules:
- Pick between ${MIN_ROLES} and ${MAX_ROLES} experts. Each expert has a unique machine id \`id\`: lowercase_snake_case (letters, digits, underscore), starting with a letter.
- Infer the topic domain from the brief (policy, research, product, ethics, education, personal tradeoff, creative direction, business, etc.) — pick experts suited to THIS brief, not a default startup roster.
- \`title\` is the expert's board seat / expert title — how you would introduce them. Use a recognizable role name, NOT a topic label (avoid "Unit economics", "Regulatory AI" as titles).
- \`mandate\` is their detailed, non-overlapping scope for THIS brief (what they must stress-test or advise on). Put functional/topic detail in mandate, not in title. Mandates should steer experts to contribute in language a non-specialist board member can follow. Each mandate should expect at least one specific recommendation or objection when that expert speaks.
- Example mandate (non-business): "Evaluate whether the proposed zoning exception respects procedural fairness and precedent; flag alternatives the council could adopt instead."
- Create \`turnSchedule\`: an ordered array of length between ${TARGET_TURNS_MIN} and ${TARGET_TURNS_MAX} (inclusive) of \`roleId\` strings. Repeat ids where a real meeting would bring someone back (objections, follow-ups). Order should create cross-talk and tension—not a rigid "everyone speaks once" go-around.
- \`meetingGoal\`: one sentence — a decidable or resolvable question for this brief (e.g. "Which of these three approaches should we adopt?" / "Is this study design strong enough to run?" / "What are the top two risks of publishing now?"). Not a vague "stress-test X" without a clear endpoint the briefing can answer.
- \`chairNotesForFacilitator\`: short private notes for the facilitator. Include: enforce PREP+C on substantive points (Point → Because → Proof → So what); require accessible language; push for named options, tradeoff disagreement, and at least one argued proof bar (metric, criterion, or evidence standard); sustain at least one disagreement before the last third of turns.

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
  meetingGoal: string;
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
Session goal (meetingGoal): ${params.meetingGoal}
${notes}
${BOARD_AUDIENCE_INSTRUCTIONS}

Other participants in this board (reference them by TITLE when relevant): ${others}

Discussion so far:
---
${params.transcriptLines}
---

Write ONE message (3 to 7 sentences). React to the most recent substantive points; you may disagree, qualify, or build on others. Reference others by title.

${BOARD_POINT_STRUCTURE}

Do NOT speak for other roles or narrate the meeting meta. No bullet lists. Plain prose only.`;
}

export function chairBriefingPrompt(params: {
  userBrief: string;
  meetingPlanJson: string;
  transcriptText: string;
}): string {
  return `You are the Chair. The board session has finished. Using the submitter's original brief, the meeting plan you designed, and the full transcript, produce a synthesis memo for the submitter — not a transcript recap.

${BOARD_SESSION_PURPOSE}

${BOARD_AUDIENCE_INSTRUCTIONS}

${CHAIR_PYRAMID_RULES}

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
  "headline": "string — BLUF: recommendation for the submitter (approve / defer / reject / pursue / pivot / investigate / refine / proceed-with-conditions — fit the brief) plus immediate next move, with at least one filled concrete element from debate",
  "keyTakeaways": ["string — 2 to 5 insight bullets, plain language, each scannable on its own; supporting arguments for the headline"],
  "thesis": "string — board conclusion after debate: recommend now / defer / what unlocks next; tradeoffs in plain language",
  "keyRisks": ["string — caveats, downsides, or failure modes (any domain)"],
  "experiments": ["string — ways to validate or test the board's view"],
  "sevenDayPlan": ["string — ordered next steps for the submitter; use day scope only when timing matters"],
  "openQuestions": ["string"],
  "dissentOrUnresolved": "optional string — what the board still disagrees on, or gaps left blank, and what would resolve it"
}

Field guidance:
- headline: Pyramid top / BLUF for a busy submitter. Outcome vocabulary fits the brief domain. No jargon; do not repeat the next-steps list verbatim. Must include filled substance from the transcript or explicit non-agreement.
- keyTakeaways: Cross-cutting insights from the debate — not a chronological walkthrough. Each bullet: short lead, then why it matters. Do not reference "as discussed above" without restating the point.
- thesis: Pyramid middle layer — synthesize the board's position; may be more nuanced than headline/takeaways. Plain language throughout.
- keyRisks, experiments, openQuestions: Each array item scannable — short lead clause, then why it matters.
- sevenDayPlan: Actionable next steps grounded in the debate — not headline paraphrase.
- dissentOrUnresolved: Plain-language summary of unresolved debate, unfilled slots, and what evidence or decision would settle it.

Anti-patterns: no transcript walkthrough, no undefined acronyms, no specialist jargon without a plain-language gloss, no qualifier-only headlines with empty slots.

If experts disagreed or key details were never specified, use dissentOrUnresolved and/or openQuestions. Arrays must be non-empty except openQuestions may be empty only if truly none. keyTakeaways must have 2–5 items.`;
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
