# Explain prompt variant comparison (2026-05-17)

**Command:** `pnpm eval:explain:compare` (6 variants × 10 cases, full judge)  
**Reports:** `eval/explain/reports/compare-2026-05-17T14-17-29-311Z.{json,html}`

## Leaderboard

| Rank | Variant | Pass | Avg chars | Overall | Brevity | Score |
|------|---------|------|-----------|---------|---------|-------|
| 1 | **v4-popover-ui** | 3/10 | 175 | 3.9 | 4.9 | 420.1 |
| 2 | v1-tight-350 | 1/10 | 261 | 4.1 | 4.6 | 221.3 |
| 3 | v3-two-beat | 1/10 | 319 | 3.4 | 3.7 | 200.3 |
| 4 | v5-no-repeat | 1/10 | 321 | 3.1 | 3.2 | 189.6 |
| 5 | v2-reader-parity | 0/10 | 353 | 3.4 | 3.3 | 95.9 |
| 6 | baseline | 0/10 | 735 | 2.3 | 1.5 | 3.7 |

**Winner:** `v4-popover-ui` — promoted in `lib/explain-prompts.ts`.

Open the HTML report in a browser for a per-case pass/fail matrix and full explanation text.

**Note:** Full compare took ~23 min (120 sequential `Agent.prompt` calls). Use `--skip-judge` or `--variants` for faster iteration.
