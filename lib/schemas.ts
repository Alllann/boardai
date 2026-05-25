import { z } from "zod";

import {
  GLOSSARY_MAX_ENTRIES,
  MAX_BRIEF_CHARS,
  MAX_TAKEAWAY_CHARS,
  MAX_ON_DEMAND_EXPLAIN_CHARS,
  MAX_ROLES,
  MAX_TURNS,
  MIN_ROLES,
  ROLE_ID_REGEX,
} from "./board-constants";

function clampText(max: number, value: string): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1).trimEnd();
  return cut.length > 0 ? `${cut}…` : value.slice(0, max);
}

const roleSchema = z
  .object({
    id: z.string().regex(ROLE_ID_REGEX, "role id must be lowercase_snake_case"),
    /** Board seat / job title shown in UI and dialogue (e.g. "General Counsel"). */
    title: z.string().min(1).max(120).optional(),
    /** @deprecated Chair may still emit `name`; normalized to `title`. */
    name: z.string().min(1).max(120).optional(),
    mandate: z.string().min(1).max(800),
  })
  .transform((r) => ({
    id: r.id,
    title: (r.title ?? r.name ?? "Board expert").trim(),
    mandate: r.mandate,
  }));

export const meetingPlanSchema = z
  .object({
    roles: z.array(roleSchema).min(MIN_ROLES).max(MAX_ROLES),
    /** Flexible length: Chair may miss exact counts; runner may pad or retry. */
    turnSchedule: z.array(z.string()).min(6).max(MAX_TURNS),
    meetingGoal: z.string().min(1).max(500),
    chairNotesForFacilitator: z.string().max(800).optional(),
    turnCount: z.number().int().positive().max(MAX_TURNS).optional(),
  })
  .refine(
    (p) => new Set(p.roles.map((r) => r.id)).size === p.roles.length,
    "duplicate role id in roles",
  );

export type MeetingPlan = z.infer<typeof meetingPlanSchema>;

export const briefingSchema = z.object({
  headline: z.string().min(1),
  keyTakeaways: z
    .array(z.string().min(1).transform((s) => clampText(MAX_TAKEAWAY_CHARS, s)))
    .min(2)
    .max(5),
  thesis: z.string().min(1),
  keyRisks: z.array(z.string()).min(1),
  experiments: z.array(z.string()).min(1),
  sevenDayPlan: z.array(z.string()).min(1).max(14),
  openQuestions: z.array(z.string()),
  dissentOrUnresolved: z.string().optional(),
});

export type ChairBriefing = z.infer<typeof briefingSchema>;

export const transcriptTurnSchema = z.object({
  id: z.number().int().positive(),
  roleId: z.string(),
  roleName: z.string(),
  content: z.string().min(1),
});

export const transcriptSchema = z.object({
  turns: z.array(transcriptTurnSchema),
});

export type Transcript = z.infer<typeof transcriptSchema>;
export type TranscriptTurn = z.infer<typeof transcriptTurnSchema>;

const glossaryEntrySchema = z.object({
  /** Display / canonical label */
  phrase: z.string().min(1).max(120),
  /** Substring to find in source text (may equal phrase) */
  match: z.string().min(1).max(120),
  explanation: z.string().min(1).max(450),
});

export const glossarySchema = z.object({
  entries: z
    .array(glossaryEntrySchema)
    .transform((entries) => entries.slice(0, GLOSSARY_MAX_ENTRIES)),
});

export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;
export type Glossary = z.infer<typeof glossarySchema>;

export const briefingSectionSchema = z.enum([
  "headline",
  "keyTakeaways",
  "thesis",
  "keyRisks",
  "experiments",
  "sevenDayPlan",
  "openQuestions",
  "dissentOrUnresolved",
]);

export type BriefingSection = z.infer<typeof briefingSectionSchema>;

export const explainSourceSchema = z.enum(["transcript", "briefing"]);

export const explainRequestSchema = z.object({
  selection: z.string().min(1).max(500),
  surroundingParagraph: z.string().max(2000).optional(),
  source: explainSourceSchema,
  turnId: z.number().int().positive().optional(),
  section: briefingSectionSchema.optional(),
  sectionIndex: z.number().int().nonnegative().optional(),
  userBrief: z.string().min(1).max(MAX_BRIEF_CHARS),
  meetingGoal: z.string().max(500).optional(),
  /** Trimmed transcript context (recent turns). */
  transcriptSnippet: z.string().max(4000).optional(),
  /** Trimmed briefing context. */
  briefingSnippet: z.string().max(2000).optional(),
});

export type ExplainRequest = z.infer<typeof explainRequestSchema>;

export const explainResponseSchema = z.object({
  explanation: z
    .string()
    .min(1)
    .transform((s) => clampText(MAX_ON_DEMAND_EXPLAIN_CHARS, s)),
});

export type ExplainResponse = z.infer<typeof explainResponseSchema>;

export const sessionTimelineEventSchema = z.object({
  id: z.string(),
  message: z.string().min(1).max(200),
  timestamp: z.number(),
  afterTurnCount: z.number().int().nonnegative(),
});

export type SessionTimelineEvent = z.infer<typeof sessionTimelineEventSchema>;

export const meetingProposalSchema = meetingPlanSchema
  .extend({
    id: z.string().min(1),
    goalNeedsConfirmation: z.boolean(),
    rosterNeedsConfirmation: z.boolean(),
    chairMessage: z.string().min(1).max(1200),
  })
  .refine(
    (p) => new Set(p.roles.map((r) => r.id)).size === p.roles.length,
    "duplicate role id in roles",
  );

export type MeetingProposal = z.infer<typeof meetingProposalSchema>;

export type SessionPhase =
  | "kickstart"
  | "discussion"
  | "follow_up"
  | "idle"
  | "complete";

export type ThreadUserItem = {
  kind: "user";
  id: string;
  content: string;
  timestamp: number;
  roundId: number;
};

export type ThreadExpertItem = {
  kind: "expert";
  roundId: number;
} & TranscriptTurn;

export type ThreadChairItem = {
  kind: "chair";
  id: string;
  content: string;
  timestamp: number;
  roundId: number;
};

export type ThreadBriefingItem = {
  kind: "briefing";
  roundId: number;
  payload: ChairBriefing;
};

export type ThreadProposalItem = {
  kind: "proposal";
  payload: MeetingProposal;
  status: "pending" | "approved";
};

export type ThreadStatusItem = {
  kind: "status";
} & SessionTimelineEvent;

export type ThreadItem =
  | ThreadUserItem
  | ThreadExpertItem
  | ThreadChairItem
  | ThreadBriefingItem
  | ThreadProposalItem
  | ThreadStatusItem;

export const chairRouteSchema = z.object({
  action: z.enum([
    "expert_direct",
    "follow_up_round",
    "chair_reply",
    "revise_roster",
  ]),
  targetRoleId: z.string().optional(),
  followUpGoal: z.string().optional(),
  turnSchedule: z.array(z.string()).optional(),
  chairReply: z.string().optional(),
  newRoles: z.array(roleSchema).optional(),
});

export type ChairRoute = z.infer<typeof chairRouteSchema>;

export type MentionCandidate = {
  id: string;
  label: string;
  type: "chair" | "expert";
};
