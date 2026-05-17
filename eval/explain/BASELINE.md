# Explain prompt baseline (current `onDemandExplainPrompt`)

**Run date:** 2026-05-17  
**Command:** `pnpm eval:explain`  
**Model:** `composer-2` (via `getAgentOptions`)  
**Report:** `eval/explain/reports/2026-05-17T13-33-47-010Z.json` (gitignored)

## Summary

| Metric | Result |
|--------|--------|
| Cases | 10 |
| Passed (checks + judge) | **0 / 10** |
| Most common check failure | `popover_max_chars` (10/10) — explanations typically 548–945 chars vs 350 budget |
| Weakest judge dimension | **brevity** (avg 1.7 / 5) |
| Strongest judge dimensions | **meeting_relevance** (avg 4.7), **rule_compliance** (avg 4.8) |

## Per-case judge scores

| Case | Overall | Clarity | Brevity | Relevance | Rules | Structure | Chars |
|------|---------|---------|---------|-----------|-------|-----------|-------|
| jargon-transcript | 3.0 | 4 | 2 | 5 | 5 | 4 | 672 |
| briefing-thesis | 2.0 | 4 | 1 | 4 | 4 | 4 | 916 |
| ambiguous-phrase | 3.0 | 5 | 2 | 5 | 5 | 5 | 548 |
| vague-common-word | 3.0 | 5 | 2 | 5 | 5 | 5 | 519 |
| expert-voice-trap | 2.0 | 5 | 2 | 5 | 5 | 5 | 754 |
| long-selection | 2.0 | 5 | 1 | 4 | 5 | 5 | 945 |
| briefing-key-risk | 3.0 | 4 | 2 | 5 | 5 | 5 | 651 |
| compliance-jargon | 3.0 | 4 | 2 | 5 | 5 | 4 | 921 |
| chair-briefing-summary | 2.0 | 4 | 2 | 4 | 5 | 4 | 630 |
| minimal-context | 2.0 | 4 | 1 | 4 | 5 | 3 | 829 |

**Judge pass threshold:** overall ≥ 3.5, each dimension ≥ 3.

## Takeaways for prompt/limit work

1. **Length is the primary failure mode** — not clarity or expert voice. The model teaches well but writes mini-articles; 900-char schema cap and “optional related terms” encourage length.
2. **Quote overlap checks fire often** — defining jargon necessarily reuses selection words; tune prompt (“define in plain words without repeating the phrase”) or relax overlap threshold after prompt changes.
3. **vague-common-word** — model handled “however” reasonably (clarity 5) but still over length; brevity rules need hard caps in the prompt (e.g. 2–3 sentences, ≤350 chars).
4. **Suggested next prompt PR targets** (informed by this baseline):
   - Lower `MAX_ON_DEMAND_EXPLAIN_CHARS` toward 400–500
   - Explicit structure: max 3 sentences; define terms → meeting meaning
   - Remove or forbid “related terms / next reads” appendices
   - Fix typo: `plain language assume` → `plain language. Assume`

## Re-run

```bash
pnpm eval:explain              # full hybrid eval
pnpm eval:explain --skip-judge # deterministic checks only (faster)
pnpm eval:explain --case jargon-transcript
pnpm eval:explain --tag jargon
```

Requires `CURSOR_API_KEY` in `.env.local` or `.env`. Reports are written under `eval/explain/reports/`.
