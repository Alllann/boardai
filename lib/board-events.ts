import type {
  ChairBriefing,
  Glossary,
  MeetingPlan,
  ReaderGuide,
  TranscriptTurn,
} from "./schemas";

export type BoardEmitEvent =
  | { type: "meeting_plan"; payload: MeetingPlan }
  | { type: "turn"; payload: TranscriptTurn }
  | { type: "briefing"; payload: ChairBriefing }
  | { type: "reader_guide"; payload: ReaderGuide }
  | { type: "glossary"; payload: Glossary };

export type BoardStreamEvent =
  | BoardEmitEvent
  | { type: "error"; message: string }
  | { type: "done" };

export type BoardRunResult = {
  meetingPlan: MeetingPlan;
  transcript: { turns: TranscriptTurn[] };
  briefing: ChairBriefing;
  readerGuide: ReaderGuide;
  glossary: Glossary;
};
