import { z } from "zod";

import {
  GLOSSARY_MAX_ENTRIES,
  MAX_BRIEF_CHARS,
  MAX_HEADLINE_CHARS,
  MAX_TAKEAWAY_CHARS,
  MAX_ON_DEMAND_EXPLAIN_CHARS,
  MAX_READER_EXPLANATION_CHARS,
  MAX_READER_THREAD_FRAMING_CHARS,
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
  headline: z
    .string()
    .min(1)
    .transform((s) => clampText(MAX_HEADLINE_CHARS, s)),
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

const turnExplanationSchema = z.object({
  turnId: z.number().int().positive(),
  explanation: z
    .string()
    .min(1)
    .transform((s) => clampText(MAX_READER_EXPLANATION_CHARS, s)),
});

export type TurnExplanation = z.infer<typeof turnExplanationSchema>;

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

const briefingExplanationSchema = z.object({
  section: briefingSectionSchema,
  /** Zero-based index for array sections (keyRisks, experiments, etc.). */
  index: z.number().int().nonnegative().optional(),
  explanation: z
    .string()
    .min(1)
    .transform((s) => clampText(MAX_READER_EXPLANATION_CHARS, s)),
});

export type BriefingExplanation = z.infer<typeof briefingExplanationSchema>;

export const readerGuideSchema = z.object({
  turnExplanations: z.array(turnExplanationSchema),
  briefingExplanations: z.array(briefingExplanationSchema).optional(),
  threadFraming: z
    .string()
    .min(1)
    .transform((s) => clampText(MAX_READER_THREAD_FRAMING_CHARS, s))
    .optional(),
});

export type ReaderGuide = z.infer<typeof readerGuideSchema>;

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
