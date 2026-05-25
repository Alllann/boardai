import type {
  ChairBriefing,
  Glossary,
  MeetingPlan,
  MeetingProposal,
  TranscriptTurn,
} from "./schemas";

export type BoardEmitEvent =
  | { type: "meeting_plan"; payload: MeetingPlan; roundId?: number }
  | { type: "meeting_proposal"; payload: MeetingProposal }
  | { type: "awaiting_user"; reason: "goal" | "roster" | "both" }
  | { type: "chair_message"; payload: { id: string; content: string; roundId: number } }
  | { type: "turn"; payload: TranscriptTurn; roundId?: number }
  | { type: "briefing"; payload: ChairBriefing; roundId?: number }
  | { type: "glossary"; payload: Glossary; roundId?: number };

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

export type StreamAction =
  | { action: "start" }
  | { action: "approve_proposal" }
  | { action: "proposal_reply"; message: string }
  | { action: "follow_up"; message: string };

export type StreamContext = {
  userBrief: string;
  meetingPlan: MeetingPlan | null;
  turns: TranscriptTurn[];
  briefing: ChairBriefing | null;
  roundCount: number;
  pendingProposal: MeetingProposal | null;
};
