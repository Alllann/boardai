/**
 * Compare Explain prompt variants across all fixtures.
 * Usage: pnpm eval:explain:compare [--skip-judge] [--variants baseline,v1-tight-350]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFiles(): void {
  for (const name of [".env.local", ".env"]) {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

import { getAgentOptions, runPromptForText } from "../lib/agent-client";
import {
  aggregateVariantMetrics,
  rankVariants,
  type VariantCaseMetrics,
} from "../lib/explain-eval-aggregate";
import { runExplainEvalChecks } from "../lib/explain-eval-checks";
import {
  explainEvalJudgePrompt,
  judgeResultPasses,
  parseExplainEvalJudgeResult,
} from "../lib/explain-eval-judge";
import { loadExplainEvalCases } from "../lib/explain-eval-fixtures";
import {
  buildExplainPromptVariant,
  EXPLAIN_PROMPT_VARIANTS,
  parseVariantIds,
  type ExplainPromptVariantId,
} from "../lib/explain-prompt-variants";

type CompareCell = VariantCaseMetrics & { variantId: ExplainPromptVariantId };

function parseSkipJudge(argv: string[]): boolean {
  return argv.includes("--skip-judge");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeComparisonHtml(
  outPath: string,
  ranked: ReturnType<typeof rankVariants>,
  cells: CompareCell[],
  caseIds: string[],
  variantIds: ExplainPromptVariantId[],
): void {
  const variantMeta = new Map(
    EXPLAIN_PROMPT_VARIANTS.map((v) => [v.id, v]),
  );

  const headerCells = variantIds
    .map((id) => {
      const v = variantMeta.get(id)!;
      return `<th title="${escapeHtml(v.description)}">${escapeHtml(v.label)}</th>`;
    })
    .join("");

  const rows = caseIds
    .map((caseId) => {
      const tds = variantIds
        .map((vid) => {
          const cell = cells.find(
            (c) => c.caseId === caseId && c.variantId === vid,
          );
          if (!cell) return `<td class="na">—</td>`;
          if (cell.error) {
            return `<td class="fail"><span class="badge err">ERR</span><p class="err">${escapeHtml(cell.error)}</p></td>`;
          }
          const cls = cell.pass ? "pass" : "fail";
          const badge = cell.pass ? "PASS" : "FAIL";
          const j = cell.judge;
          const scores = j
            ? `O${j.overall} B${j.scores.brevity} C${j.scores.beginner_clarity}`
            : "no judge";
          return `<td class="${cls}">
  <span class="badge">${badge}</span>
  <span class="meta">${cell.charCount}ch · ${scores}</span>
  <details><summary>Text</summary><p class="explanation">${escapeHtml(cell.explanation)}</p></details>
</td>`;
        })
        .join("");
      return `<tr><th class="case-id">${escapeHtml(caseId)}</th>${tds}</tr>`;
    })
    .join("");

  const leaderboard = ranked
    .map(
      (a, i) =>
        `<tr><td>${i + 1}</td><td><strong>${escapeHtml(a.label)}</strong> <code>${escapeHtml(a.variantId)}</code></td>
<td>${a.passCount}/${a.casesRun}</td><td>${a.avgChars}</td><td>${a.avgOverall}</td><td>${a.avgBrevity}</td><td>${a.compositeScore}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Explain prompt variant comparison</title>
  <style>
    :root { font-family: system-ui, sans-serif; font-size: 14px; }
    body { margin: 1.5rem; max-width: 1400px; color: #18181b; }
    h1 { font-size: 1.25rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #e4e4e7; padding: 0.5rem 0.6rem; vertical-align: top; }
    th { background: #f4f4f5; text-align: left; }
    .case-id { font-size: 0.75rem; white-space: nowrap; }
    td.pass { background: #ecfdf5; }
    td.fail { background: #fef2f2; }
    td.na { background: #fafafa; color: #a1a1aa; }
    .badge { font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 3px; background: #3f3f46; color: #fff; }
    td.pass .badge { background: #059669; }
    td.fail .badge { background: #dc2626; }
    .badge.err { background: #7f1d1d; }
    .meta { display: block; font-size: 0.7rem; color: #52525b; margin: 0.25rem 0; }
    details { margin-top: 0.35rem; }
    summary { cursor: pointer; font-size: 0.7rem; color: #3b82f6; }
    .explanation { font-size: 0.8rem; line-height: 1.45; margin: 0.35rem 0 0; white-space: pre-wrap; }
    .err { font-size: 0.75rem; color: #b91c1c; }
    code { font-size: 0.75rem; }
    .leaderboard td:nth-child(n+3) { text-align: center; }
  </style>
</head>
<body>
  <h1>Explain prompt variant comparison</h1>
  <p>Generated ${escapeHtml(new Date().toISOString())}. Green = passed checks + judge thresholds.</p>
  <h2>Leaderboard (composite score)</h2>
  <table class="leaderboard">
    <thead><tr><th>#</th><th>Variant</th><th>Pass</th><th>Avg chars</th><th>Avg overall</th><th>Avg brevity</th><th>Score</th></tr></thead>
    <tbody>${leaderboard}</tbody>
  </table>
  <h2>Per-case matrix</h2>
  <table>
    <thead><tr><th>Case</th>${headerCells}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  writeFileSync(outPath, html, "utf8");
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const skipJudge = parseSkipJudge(argv);
  const variantIds = parseVariantIds(argv);
  const cases = loadExplainEvalCases();
  const caseIds = cases.map((c) => c.id);

  console.log(
    `Comparing ${variantIds.length} variant(s) × ${cases.length} cases${skipJudge ? " (judge skipped)" : ""}…`,
  );

  const options = getAgentOptions();
  const cells: CompareCell[] = [];

  for (const variantId of variantIds) {
    const meta = EXPLAIN_PROMPT_VARIANTS.find((v) => v.id === variantId)!;
    console.log(`\n=== ${meta.label} (${variantId}) ===`);

    for (const evalCase of cases) {
      process.stdout.write(`  ${evalCase.id}… `);
      try {
        const prompt = buildExplainPromptVariant(variantId, evalCase.request);
        const { text } = await runPromptForText(prompt, options);
        const explanation = text.trim();
        const checks = runExplainEvalChecks(evalCase.request, explanation);

        let judge;
        let judgePass = false;
        if (!skipJudge) {
          const judgePrompt = explainEvalJudgePrompt(
            { id: evalCase.id, description: evalCase.description },
            evalCase.request,
            explanation,
          );
          const judgeRun = await runPromptForText(judgePrompt, options);
          judge = parseExplainEvalJudgeResult(judgeRun.text);
          judgePass = judgeResultPasses(judge);
        }

        const pass = checks.pass && (skipJudge || judgePass);
        console.log(pass ? "PASS" : "fail");

        cells.push({
          variantId,
          caseId: evalCase.id,
          charCount: explanation.length,
          checkPass: checks.pass,
          checkViolationCount: checks.violations.length,
          judgePass,
          judge,
          pass,
          explanation,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.log(`ERR ${message}`);
        cells.push({
          variantId,
          caseId: evalCase.id,
          charCount: 0,
          checkPass: false,
          checkViolationCount: 0,
          judgePass: false,
          pass: false,
          explanation: "",
          error: message,
        });
      }
    }
  }

  const aggregates = variantIds.map((vid) => {
    const meta = EXPLAIN_PROMPT_VARIANTS.find((v) => v.id === vid)!;
    const rows = cells
      .filter((c) => c.variantId === vid)
      .map(({ variantId: _v, ...rest }) => rest);
    return aggregateVariantMetrics(vid, meta.label, rows);
  });

  const ranked = rankVariants(aggregates);

  console.log("\n--- Leaderboard ---\n");
  for (const [i, a] of ranked.entries()) {
    console.log(
      `${i + 1}. ${a.label} (${a.variantId}) — pass ${a.passCount}/${a.casesRun}, avg ${a.avgChars}ch, overall ${a.avgOverall}, brevity ${a.avgBrevity}, score ${a.compositeScore}`,
    );
  }

  const reportsDir = join(process.cwd(), "eval", "explain", "reports");
  mkdirSync(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(reportsDir, `compare-${stamp}.json`);
  const htmlPath = join(reportsDir, `compare-${stamp}.html`);

  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        skipJudge,
        variantIds,
        leaderboard: ranked,
        cells,
      },
      null,
      2,
    ),
    "utf8",
  );

  writeComparisonHtml(htmlPath, ranked, cells, caseIds, variantIds);

  console.log(`\nJSON: ${jsonPath}`);
  console.log(`HTML: ${htmlPath}\n`);

  const winner = ranked[0];
  if (winner && winner.variantId !== "baseline") {
    console.log(`Best variant: ${winner.variantId} — consider promoting in explain-prompts.ts`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
