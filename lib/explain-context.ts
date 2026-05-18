import type { ChairBriefing, MeetingPlan, TranscriptTurn } from "./schemas";

const SNIPPET_TURN_MAX = 2;
const SNIPPET_CHARS = 3500;

export function buildTranscriptSnippet(
  turns: TranscriptTurn[],
  focusTurnId?: number,
): string {
  if (turns.length === 0) return "";

  let slice = turns;
  if (focusTurnId !== undefined) {
    const idx = turns.findIndex((t) => t.id === focusTurnId);
    if (idx >= 0) {
      slice = turns.slice(Math.max(0, idx - SNIPPET_TURN_MAX), idx + 1);
    } else {
      slice = turns.slice(-SNIPPET_TURN_MAX - 1);
    }
  } else {
    slice = turns.slice(-SNIPPET_TURN_MAX - 1);
  }

  let text = slice.map((t) => `${t.roleName}: ${t.content}`).join("\n\n");
  if (text.length > SNIPPET_CHARS) {
    text = `…${text.slice(-SNIPPET_CHARS)}`;
  }
  return text;
}

export function buildBriefingSnippet(briefing: ChairBriefing): string {
  const parts = [
    `Headline: ${briefing.headline}`,
    `Key takeaways: ${briefing.keyTakeaways.slice(0, 3).join(" | ")}`,
    `Thesis: ${briefing.thesis}`,
    `Key risks: ${briefing.keyRisks.slice(0, 3).join(" | ")}`,
  ];
  let text = parts.join("\n");
  if (text.length > 2000) text = text.slice(0, 1999) + "…";
  return text;
}

export function buildMeetingGoal(plan: MeetingPlan | null): string | undefined {
  return plan?.meetingGoal;
}
