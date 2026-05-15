import type { ChairBriefing, Glossary, MeetingPlan, TranscriptTurn } from "./schemas";

export type BoardEmitEvent =
  | { type: "meeting_plan"; payload: MeetingPlan }
  | { type: "turn"; payload: TranscriptTurn }
  | { type: "briefing"; payload: ChairBriefing }
  | { type: "glossary"; payload: Glossary };

export type BoardStreamEvent =
  | BoardEmitEvent
  | { type: "error"; message: string }
  | { type: "done" };

export type BoardRunResult = {
  meetingPlan: MeetingPlan;
  transcript: { turns: TranscriptTurn[] };
  briefing: ChairBriefing;
  glossary: Glossary;
};
