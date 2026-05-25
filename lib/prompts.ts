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

Confirmation flags (required):
- \`goalNeedsConfirmation\`: true ONLY if the brief supports multiple equally plausible meeting goals and you cannot pick one confidently. false if one goal is clearly implied.
- \`rosterNeedsConfirmation\`: false ONLY if the user explicitly named specific experts or seats to invite in their brief (e.g. "bring in the CFO", "I want the General Counsel"). true if you are choosing the roster yourself.
- \`chairMessage\`: plain-language message to the user. If either confirmation flag is true, ask clearly for approval or alternatives. If both false, briefly state the goal and who you are inviting (1–3 sentences).

Output ONLY valid JSON (no markdown, no commentary) matching this shape:
{
  "roles": [{ "id": "string", "title": "string", "mandate": "string" }],
  "turnSchedule": ["role_id", "..."],
  "meetingGoal": "string",
  "chairNotesForFacilitator": "optional string",
  "goalNeedsConfirmation": boolean,
  "rosterNeedsConfirmation": boolean,
  "chairMessage": "string"
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

export function chairProposalRevisionPrompt(params: {
  userBrief: string;
  currentProposalJson: string;
  userReply: string;
}): string {
  return `You are the Chair. The user replied to your meeting proposal. Revise the plan based on their feedback, or confirm the existing plan if they approved it.

User's original brief:
---
${params.userBrief}
---

Current proposal (JSON):
${params.currentProposalJson}

User's reply:
---
${params.userReply}
---

If the user clearly approved (e.g. "looks good", "start", "proceed"), set both goalNeedsConfirmation and rosterNeedsConfirmation to false and keep or lightly refine the plan.

If they requested changes, update meetingGoal and/or roles/turnSchedule accordingly. Re-evaluate confirmation flags: after addressing their feedback, set flags to false unless still genuinely ambiguous.

Output ONLY valid JSON (same shape as meeting plan proposal) with goalNeedsConfirmation, rosterNeedsConfirmation, and chairMessage.`;
}

export function expertTurnPrompt(params: {
  expertTitle: string;
  mandate: string;
  otherExperts: { title: string }[];
  transcriptLines: string;
  chairNotes?: string;
  userQuestion?: string;
}): string {
  const others =
    params.otherExperts.length > 0
      ? params.otherExperts.map((e) => e.title).join(", ")
      : "(none yet)";
  const notes = params.chairNotes
    ? `\nChair guidance for this meeting (internal): ${params.chairNotes}\n`
    : "";
  const directAsk = params.userQuestion
    ? `\nThe owner is addressing you directly:\n"${params.userQuestion}"\nAnswer this directly in your message.\n`
    : "";
  return `You are ONLY the expert: "${params.expertTitle}".
Your mandate: ${params.mandate}
${notes}
${BOARD_AUDIENCE_INSTRUCTIONS}
${directAsk}
Other participants in this board (reference them by TITLE when relevant): ${others}

Discussion so far:
---
${params.transcriptLines}
---

Write ONE message using markdown for readability:
1. **Opening:** one short sentence — react to the most relevant prior point or the owner's question.
2. **Body:** 2–4 markdown bullet points (\`- …\`) — your position, reasoning, and evidence. One idea per bullet; max ~2 sentences each. Use \`**bold**\` sparingly for key terms.
3. **Close:** one short sentence on what your point implies for the decision.

Keep total length ~150–250 words. Do NOT speak for other roles or narrate meeting meta.`;
}

export function expertDirectReplyPrompt(params: {
  expertTitle: string;
  mandate: string;
  transcriptLines: string;
  userMessage: string;
  briefingSummary?: string;
}): string {
  const briefing = params.briefingSummary
    ? `\nChair briefing summary:\n${params.briefingSummary}\n`
    : "";
  return `You are ONLY the expert: "${params.expertTitle}".
Your mandate: ${params.mandate}
${BOARD_AUDIENCE_INSTRUCTIONS}
${briefing}
Discussion so far:
---
${params.transcriptLines}
---

The owner asked you directly:
"${params.userMessage}"

Reply in ONE short message (markdown bullets welcome, 2–4 bullets max + brief opener/closer). Answer only from your expert perspective. Do not speak for others.`;
}

export function chairBriefingPrompt(params: {
  userBrief: string;
  meetingPlanJson: string;
  transcriptText: string;
  roundLabel?: string;
}): string {
  const roundNote = params.roundLabel
    ? `\nThis briefing covers: ${params.roundLabel}\n`
    : "";
  return `You are the Chair. The board session has finished. Using the user's original brief, the meeting plan you designed, and the full transcript, produce the owner's insight memo — not a transcript recap.
${roundNote}
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
  roundLabel?: string;
}): string {
  return `${chairBriefingPrompt(params)}

IMPORTANT: Previous JSON failed validation: ${params.validationError}
Return corrected JSON ONLY.`;
}

export function chairRouterPrompt(params: {
  userMessage: string;
  meetingPlanJson: string;
  transcriptText: string;
  briefingSummary?: string;
}): string {
  const briefing = params.briefingSummary
    ? `\nLatest briefing summary:\n${params.briefingSummary}\n`
    : "";
  return `You are the Chair routing the owner's follow-up message in an ongoing board session.

Meeting plan (JSON):
${params.meetingPlanJson}
${briefing}
Transcript:
---
${params.transcriptText}
---

Owner's message:
"${params.userMessage}"

Choose ONE action:
- \`expert_direct\`: owner @mentioned or clearly directed a question to ONE expert — set targetRoleId to that expert's id.
- \`follow_up_round\`: owner wants another full discussion round (e.g. "run another round", "debate X", "bring everyone back on Y") — set followUpGoal and turnSchedule (reuse role ids from plan, ${TARGET_TURNS_MIN}-${TARGET_TURNS_MAX} turns).
- \`chair_reply\`: owner asked you a summary/clarification that you can answer without a new round — set chairReply.
- \`revise_roster\`: owner wants new experts added — set newRoles (full role objects) and followUpGoal; may lead to a round after approval.

Output ONLY valid JSON:
{
  "action": "expert_direct" | "follow_up_round" | "chair_reply" | "revise_roster",
  "targetRoleId": "optional string",
  "followUpGoal": "optional string",
  "turnSchedule": ["optional role ids"],
  "chairReply": "optional string",
  "newRoles": [{ "id", "title", "mandate" }]
}`;
}

export function chairReplyPrompt(params: {
  userMessage: string;
  transcriptText: string;
  meetingGoal: string;
  briefingSummary?: string;
}): string {
  const briefing = params.briefingSummary
    ? `\nBriefing summary:\n${params.briefingSummary}\n`
    : "";
  return `You are the Chair of this advisory board. Meeting goal: ${params.meetingGoal}
${briefing}
Transcript:
---
${params.transcriptText}
---

The owner asked:
"${params.userMessage}"

Reply in plain language (2–5 sentences). Do not speak as the experts. Do not start a new round unless they explicitly asked.`;
}
