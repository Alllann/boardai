import { z } from "zod";

import {
  MAX_ROLES,
  MAX_TURNS,
  MIN_ROLES,
  ROLE_ID_REGEX,
} from "./board-constants";

const roleSchema = z.object({
  id: z.string().regex(ROLE_ID_REGEX, "role id must be lowercase_snake_case"),
  name: z.string().min(1).max(120),
  mandate: z.string().min(1).max(800),
});

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
  entries: z.array(glossaryEntrySchema).max(25),
});

export type GlossaryEntry = z.infer<typeof glossaryEntrySchema>;
export type Glossary = z.infer<typeof glossarySchema>;
