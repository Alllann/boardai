import type { ExplainEvalJudgeResult } from "./explain-eval-judge";
import type { ExplainEvalCheckResult } from "./explain-eval-checks";

export type VariantCaseMetrics = {
  caseId: string;
  charCount: number;
  checkPass: boolean;
  checkViolationCount: number;
  judgePass: boolean;
  judge?: ExplainEvalJudgeResult;
  pass: boolean;
  explanation: string;
  error?: string;
};

export type VariantAggregate = {
  variantId: string;
  label: string;
  casesRun: number;
  passCount: number;
  checkPassCount: number;
  judgePassCount: number;
  avgChars: number;
  avgOverall: number;
  avgBrevity: number;
  avgClarity: number;
  avgRelevance: number;
  avgRules: number;
  avgStructure: number;
  /** Higher is better; used to rank variants. */
  compositeScore: number;
};

export function aggregateVariantMetrics(
  variantId: string,
  label: string,
  rows: VariantCaseMetrics[],
): VariantAggregate {
  const ok = rows.filter((r) => !r.error);
  const judged = ok.filter((r) => r.judge);

  const passCount = rows.filter((r) => r.pass).length;
  const checkPassCount = rows.filter((r) => r.checkPass).length;
  const judgePassCount = rows.filter((r) => r.judgePass).length;

  const avgChars =
    ok.length > 0
      ? ok.reduce((s, r) => s + r.charCount, 0) / ok.length
      : 0;

  const avg = (pick: (j: ExplainEvalJudgeResult) => number) =>
    judged.length > 0
      ? judged.reduce((s, r) => s + pick(r.judge!), 0) / judged.length
      : 0;

  const avgOverall = avg((j) => j.overall);
  const avgBrevity = avg((j) => j.scores.brevity);
  const avgClarity = avg((j) => j.scores.beginner_clarity);
  const avgRelevance = avg((j) => j.scores.meeting_relevance);
  const avgRules = avg((j) => j.scores.rule_compliance);
  const avgStructure = avg((j) => j.scores.structure);

  const compositeScore =
    passCount * 100 +
    avgOverall * 15 +
    avgBrevity * 10 +
    avgClarity * 3 -
    Math.max(0, avgChars - 350) * 0.15;

  return {
    variantId,
    label,
    casesRun: rows.length,
    passCount,
    checkPassCount,
    judgePassCount,
    avgChars: Math.round(avgChars),
    avgOverall: round1(avgOverall),
    avgBrevity: round1(avgBrevity),
    avgClarity: round1(avgClarity),
    avgRelevance: round1(avgRelevance),
    avgRules: round1(avgRules),
    avgStructure: round1(avgStructure),
    compositeScore: round1(compositeScore),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function rankVariants(aggregates: VariantAggregate[]): VariantAggregate[] {
  return [...aggregates].sort((a, b) => b.compositeScore - a.compositeScore);
}
