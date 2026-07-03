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

/** Chair briefing key takeaway bullet (model may overshoot; we clamp). */
export const MAX_TAKEAWAY_CHARS = 280;

/** On-demand explain: selection length bounds (characters). */
export const EXPLAIN_MIN_SELECTION_CHARS = 8;
export const EXPLAIN_MAX_SELECTION_CHARS = 500;
export const MAX_ON_DEMAND_EXPLAIN_CHARS = 900;

/** Shown immediately when a session starts, before the first API response. */
export const CHAIR_CONVENING_MESSAGE =
  "I'm convening the board and reviewing your brief…";

/** Reader guide eval prompts. */
export const MAX_READER_EXPLANATION_CHARS = 600;
export const MAX_READER_THREAD_FRAMING_CHARS = 400;
