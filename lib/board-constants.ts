/** Chair must pick at least this many expert roles. */
export const MIN_ROLES = 3;
/** Hard cap per plan. */
export const MAX_ROLES = 6;
/** Max turns in schedule (latency / cost guardrail). */
export const MAX_TURNS = 14;
/** Default target turns when prompting Chair (Chair may emit fewer; we pad in code only if needed — prefer Chair to hit range). */
export const TARGET_TURNS_MIN = 10;
export const TARGET_TURNS_MAX = 12;
/** User brief max length (characters). */
export const MAX_BRIEF_CHARS = 12_000;

export const ROLE_ID_REGEX = /^[a-z][a-z0-9_]{1,39}$/;

/** Max glossary terms surfaced in the UI (model may overshoot; we clamp). */
export const GLOSSARY_MAX_ENTRIES = 25;

/** UI cap for per-turn reader explanations (model may overshoot; we clamp). */
export const MAX_READER_EXPLANATION_CHARS = 400;
export const MAX_READER_THREAD_FRAMING_CHARS = 600;
