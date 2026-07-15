/** Chair must pick at least this many expert roles. */
export const MIN_ROLES = 3;
/** Hard cap per plan. */
export const MAX_ROLES = 6;
/** Max turns in schedule (latency / cost guardrail). */
export const MAX_TURNS = 14;
/** User brief max length (characters). */
export const MAX_BRIEF_CHARS = 12_000;

export const ROLE_ID_REGEX = /^[a-z][a-z0-9_]{1,39}$/;

/** Max new glossary entries per incremental generation pass. */
export const GLOSSARY_MAX_ENTRIES_PER_PASS = 12;

/** Safety cap for a single model response (not a session total). */
export const GLOSSARY_RESPONSE_SAFETY_CAP = 200;

/** Chair briefing field clamps — aligned to compact slide deck budgets. */
export const MAX_BRIEFING_HEADLINE_CHARS = 180;
export const MAX_BRIEFING_PROSE_CHARS = 220;
export const MAX_BRIEFING_LIST_ITEM_CHARS = 180;
export const MAX_BRIEFING_MILESTONE_CHARS = 160;

/** @deprecated Use MAX_BRIEFING_LIST_ITEM_CHARS */
export const MAX_TAKEAWAY_CHARS = MAX_BRIEFING_LIST_ITEM_CHARS;

/** Shown immediately when a session starts, before the first API response. */
export const CHAIR_CONVENING_MESSAGE =
  "I'm reviewing your brief…";

/** Reader guide eval prompts. */
export const MAX_READER_EXPLANATION_CHARS = 600;
export const MAX_READER_THREAD_FRAMING_CHARS = 400;
