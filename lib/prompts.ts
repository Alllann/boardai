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
- Names are human-readable titles (e.g. "Unit economics", "Regulatory").
- Mandates must be NON-OVERLAPPING and tailored to THIS brief (stage, industry, constraints implied in the text).
- Create \`turnSchedule\`: an ordered array of length between ${TARGET_TURNS_MIN} and ${TARGET_TURNS_MAX} (inclusive) of \`roleId\` strings. Repeat ids where a real meeting would bring someone back (objections, follow-ups). Order should create cross-talk and tension—not a rigid "everyone speaks once" go-around.
- Include \`meetingGoal\`: one sentence on what this session must decide or stress-test.
- Optional \`chairNotesForFacilitator\`: short private notes (tone: push for at least one sustained disagreement before the last third of turns).

Output ONLY valid JSON (no markdown, no commentary) matching this shape:
{
  "roles": [{ "id": "string", "name": "string", "mandate": "string" }],
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
  expertName: string;
  mandate: string;
  otherExperts: { name: string }[];
  transcriptLines: string;
  chairNotes?: string;
}): string {
  const others =
    params.otherExperts.length > 0
      ? params.otherExperts.map((e) => e.name).join(", ")
      : "(none yet)";
  const notes = params.chairNotes
    ? `\nChair guidance for this meeting (internal): ${params.chairNotes}\n`
    : "";
  return `You are ONLY the expert: "${params.expertName}".
Your mandate: ${params.mandate}
${notes}
Other participants in this board (reference them by NAME when relevant): ${others}

Discussion so far:
---
${params.transcriptLines}
---

Write ONE message (2 to 6 sentences). React to the most recent substantive points; you may disagree, qualify, or build on others. Reference others by name. Do NOT speak for other roles or narrate the meeting meta. No bullet lists. Plain prose only.`;
}

export function chairBriefingPrompt(params: {
  userBrief: string;
  meetingPlanJson: string;
  transcriptText: string;
}): string {
  return `You are the Chair. The board session has finished. Using the user's original brief, the meeting plan you designed, and the full transcript, produce the owner's structured briefing. You shall assume the reader is smart but not trained in this domain of discussion.

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
  "thesis": "string",
  "keyRisks": ["string"],
  "experiments": ["string — each item should imply how to validate"],
  "sevenDayPlan": ["string — ordered steps or day-scoped actions"],
  "openQuestions": ["string"],
  "dissentOrUnresolved": "optional string — summarize unresolved debate if any"
}

If experts disagreed, use dissentOrUnresolved to name the disagreement and what remains undecided. Arrays must be non-empty except openQuestions may be empty only if truly none.`;
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
