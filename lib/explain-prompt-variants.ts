import { MAX_ON_DEMAND_EXPLAIN_CHARS } from "./board-constants";
import {
  assembleExplainPrompt,
  buildExplainPromptContext,
} from "./explain-prompt-build";
import type { ExplainRequest } from "./schemas";

export type ExplainPromptVariantId =
  | "baseline"
  | "v1-tight-350"
  | "v2-reader-parity"
  | "v3-two-beat"
  | "v4-popover-ui"
  | "v5-no-repeat";

export type ExplainPromptVariant = {
  id: ExplainPromptVariantId;
  label: string;
  description: string;
};

export const EXPLAIN_PROMPT_VARIANTS: ExplainPromptVariant[] = [
  {
    id: "baseline",
    label: "Baseline",
    description: "Current production prompt (900 char cap, optional related terms).",
  },
  {
    id: "v1-tight-350",
    label: "Tight 350",
    description: "Hard 350-char / 3-sentence cap; no appendices.",
  },
  {
    id: "v2-reader-parity",
    label: "Reader parity",
    description: "Mirror reader-guide style: 2–4 sentences, ≤400 chars.",
  },
  {
    id: "v3-two-beat",
    label: "Two-beat template",
    description: "Explicit two-sentence template: terms → meeting meaning.",
  },
  {
    id: "v4-popover-ui",
    label: "Popover UI-first",
    description: "Tooltip framing, ≤300 chars, short sentences.",
  },
  {
    id: "v5-no-repeat",
    label: "No-repeat jargon",
    description: "Tight cap plus define terms without repeating selection wording.",
  },
];

const INTRO =
  "You explain selected text from an advisory board session for a smart reader who is NOT trained in this domain.";

function rulesBaseline(): string {
  return `- Output plain prose only (no JSON, no markdown headings). Maximum ${MAX_ON_DEMAND_EXPLAIN_CHARS} characters.
- Briefly explain domain-specific keywords or key phrases in the selection, then briefly explain what the selection means in this meeting in plain language assume that you are teaching a beginner.
- Do NOT rewrite, quote, or replace the selected wording. Do NOT speak as the expert or Chair.
- If the selection is ambiguous, say what is ambiguous and give the most likely reading.
- If the selection is too vague (e.g. a single common word), say so briefly and explain the nearest meaningful phrase from context.
- Optional: name 1–2 related terms the reader might look up, without defining the whole domain.`;
}

function rulesV1Tight350(): string {
  return `- Output plain prose only (no JSON, no markdown headings, no bullet lists).
- HARD LIMIT: ≤350 characters total. Stop when you hit the limit.
- Write at most 3 short sentences. Each sentence ≤18 words.
- Sentence 1: define any jargon in everyday words. Sentence 2–3: what the selection means in this meeting.
- Teach a beginner briefly. Do NOT add "related terms", "next reads", or extra concepts.
- Do NOT rewrite, quote, or replace the selected wording. Do NOT speak as the expert or Chair.
- If the selection is ambiguous or too vague, say so in one short sentence, then give the most likely reading from context.`;
}

function rulesV2ReaderParity(): string {
  return `- Output plain prose only (no JSON, no markdown headings).
- Write 2–4 sentences in concise plain language. HARD LIMIT: ≤400 characters.
- Clarify jargon and what the speaker meant in this debate — not a textbook essay.
- Do NOT compress into one cryptic line, but do NOT lecture either.
- Do NOT quote or paraphrase the experts' exact sentences. Do NOT speak as the expert or Chair.
- If the selection is ambiguous or too vague, note it briefly and explain the nearest meaningful phrase from context.
- No appendices, footnotes, or "terms to explore".`;
}

function rulesV3TwoBeat(): string {
  return `- Output plain prose only. Exactly 2 or 3 sentences. HARD LIMIT: ≤350 characters.
- Sentence 1 MUST define domain terms in plain words for a beginner.
- Sentence 2 MUST say what the selection means in this specific meeting (stakes, who is pushing back, why it matters).
- Optional sentence 3 ONLY if the selection is ambiguous or too vague — state the ambiguity and your best reading.
- Do NOT speak as the expert or Chair. Do NOT quote the selection verbatim.
- Forbidden: lists, headings, "related:", "you might also look up".`;
}

function rulesV4PopoverUi(): string {
  return `- You are writing copy for a narrow UI popover (~22rem wide, small text). It must read in one glance.
- Output plain prose only. HARD LIMIT: ≤300 characters. Maximum 2 sentences.
- Use short, simple sentences (≤15 words each). One idea per sentence.
- Explain unfamiliar terms inline, then tie to this meeting in one line.
- Do NOT speak as the expert or Chair. Do NOT quote the selection.
- No preambles ("In this context…"), no closing tips, no extra vocabulary.`;
}

function rulesV5NoRepeat(): string {
  return `- Output plain prose only. HARD LIMIT: ≤350 characters. At most 3 short sentences.
- Define jargon using everyday words WITHOUT repeating multi-word phrases from the selection verbatim (e.g. if the selection says "cohort payback", write "how long until customers from the same signup group pay back acquisition spend").
- Then say what the selection means in this meeting for a beginner.
- Do NOT speak as the expert or Chair. No "related terms" or reading lists.
- If ambiguous or vague, one sentence on ambiguity, then your best reading.`;
}

const RULES_BY_VARIANT: Record<
  ExplainPromptVariantId,
  () => string
> = {
  baseline: rulesBaseline,
  "v1-tight-350": rulesV1Tight350,
  "v2-reader-parity": rulesV2ReaderParity,
  "v3-two-beat": rulesV3TwoBeat,
  "v4-popover-ui": rulesV4PopoverUi,
  "v5-no-repeat": rulesV5NoRepeat,
};

export function buildExplainPromptVariant(
  variantId: ExplainPromptVariantId,
  req: ExplainRequest,
): string {
  const ctx = buildExplainPromptContext(req);
  return assembleExplainPrompt(INTRO, ctx, RULES_BY_VARIANT[variantId]());
}

export function parseVariantIds(argv: string[]): ExplainPromptVariantId[] {
  const improved: ExplainPromptVariantId[] = [
    "v1-tight-350",
    "v2-reader-parity",
    "v3-two-beat",
    "v4-popover-ui",
    "v5-no-repeat",
  ];
  const idx = argv.indexOf("--variants");
  if (idx < 0 || !argv[idx + 1]) {
    return ["baseline", ...improved];
  }
  const raw = argv[idx + 1]!.split(",").map((s) => s.trim());
  const ids = raw.filter((id): id is ExplainPromptVariantId =>
    EXPLAIN_PROMPT_VARIANTS.some((v) => v.id === id),
  );
  if (ids.length === 0) {
    throw new Error(`No valid variant ids in: ${argv[idx + 1]}`);
  }
  return ids;
}
