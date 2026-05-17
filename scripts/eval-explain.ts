/**
 * Explain prompt quality eval (local only; requires CURSOR_API_KEY).
 * Usage: pnpm eval:explain [--case <id>] [--tag <tag>] [--skip-judge]
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
import { runExplainEvalChecks } from "../lib/explain-eval-checks";
import {
  explainEvalJudgePrompt,
  judgeResultPasses,
  parseExplainEvalJudgeResult,
  type ExplainEvalJudgeResult,
} from "../lib/explain-eval-judge";
import {
  filterExplainEvalCases,
  loadExplainEvalCases,
  type ExplainEvalCase,
} from "../lib/explain-eval-fixtures";
import { onDemandExplainPrompt } from "../lib/explain-prompts";

type CaseResult = {
  id: string;
  description: string;
  tags?: string[];
  runId?: string;
  explanation: string;
  checks: ReturnType<typeof runExplainEvalChecks>;
  judge?: ExplainEvalJudgeResult;
  judgePass?: boolean;
  pass: boolean;
  error?: string;
};

function parseArgs(argv: string[]): {
  caseId?: string;
  tag?: string;
  skipJudge: boolean;
} {
  let caseId: string | undefined;
  let tag: string | undefined;
  let skipJudge = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--skip-judge") {
      skipJudge = true;
    } else if (arg === "--case" && argv[i + 1]) {
      caseId = argv[++i];
    } else if (arg === "--tag" && argv[i + 1]) {
      tag = argv[++i];
    }
  }

  return { caseId, tag, skipJudge };
}

async function runCase(
  evalCase: ExplainEvalCase,
  skipJudge: boolean,
): Promise<CaseResult> {
  const base: CaseResult = {
    id: evalCase.id,
    description: evalCase.description,
    tags: evalCase.tags,
    explanation: "",
    checks: { pass: false, violations: [] },
    pass: false,
  };

  try {
    const options = getAgentOptions();
    const prompt = onDemandExplainPrompt(evalCase.request);
    const { text, runId } = await runPromptForText(prompt, options);
    const explanation = text.trim();
    const checks = runExplainEvalChecks(evalCase.request, explanation);

    let judge: ExplainEvalJudgeResult | undefined;
    let judgePass: boolean | undefined;

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

    const pass = checks.pass && (skipJudge || judgePass === true);

    return {
      ...base,
      runId,
      explanation,
      checks,
      judge,
      judgePass,
      pass,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ...base,
      error: message,
      pass: false,
    };
  }
}

function printSummary(results: CaseResult[]): void {
  console.log("\n--- Explain eval summary ---\n");
  for (const r of results) {
    const status = r.pass ? "PASS" : "FAIL";
    const judgeStr =
      r.judge != null
        ? ` judge=${r.judge.overall.toFixed(1)}`
        : r.error
          ? ""
          : " judge=skipped";
    console.log(`${status}  ${r.id}${judgeStr}`);
    if (r.error) {
      console.log(`       error: ${r.error}`);
    }
    for (const v of r.checks.violations) {
      console.log(`       check: ${v.code} — ${v.message}`);
    }
    if (r.judge && !r.judgePass) {
      console.log(`       judge failures: ${r.judge.failures.join("; ") || "(low scores)"}`);
      const s = r.judge.scores;
      console.log(
        `       scores: clarity=${s.beginner_clarity} brevity=${s.brevity} relevance=${s.meeting_relevance} rules=${s.rule_compliance} structure=${s.structure}`,
      );
    }
  }

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} cases passed.\n`);
}

function writeReport(results: CaseResult[]): string {
  const reportsDir = join(process.cwd(), "eval", "explain", "reports");
  mkdirSync(reportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = join(reportsDir, `${stamp}.json`);
  const payload = {
    generatedAt: new Date().toISOString(),
    passed: results.filter((r) => r.pass).length,
    total: results.length,
    results,
  };
  writeFileSync(reportPath, JSON.stringify(payload, null, 2), "utf8");
  return reportPath;
}

async function main(): Promise<void> {
  const { caseId, tag, skipJudge } = parseArgs(process.argv.slice(2));
  const cases = filterExplainEvalCases(loadExplainEvalCases(), {
    caseId,
    tag,
  });

  console.log(
    `Running explain eval on ${cases.length} case(s)${skipJudge ? " (judge skipped)" : ""}…`,
  );

  const results: CaseResult[] = [];
  for (const evalCase of cases) {
    console.log(`  → ${evalCase.id}`);
    results.push(await runCase(evalCase, skipJudge));
  }

  printSummary(results);
  const reportPath = writeReport(results);
  console.log(`Report written to ${reportPath}`);

  const anyFail = results.some((r) => !r.pass);
  process.exit(anyFail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
