import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import { explainRequestSchema } from "./schemas";

const explainEvalCaseSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).optional(),
  request: explainRequestSchema,
});

export type ExplainEvalCase = z.infer<typeof explainEvalCaseSchema>;

const explainEvalCasesFileSchema = z.array(explainEvalCaseSchema);

export function loadExplainEvalCases(casesPath?: string): ExplainEvalCase[] {
  const path =
    casesPath ?? join(process.cwd(), "eval", "explain", "cases.json");
  const raw = readFileSync(path, "utf8");
  return explainEvalCasesFileSchema.parse(JSON.parse(raw));
}

export function filterExplainEvalCases(
  cases: ExplainEvalCase[],
  opts: { caseId?: string; tag?: string },
): ExplainEvalCase[] {
  let filtered = cases;
  if (opts.caseId) {
    filtered = filtered.filter((c) => c.id === opts.caseId);
    if (filtered.length === 0) {
      throw new Error(`No eval case with id "${opts.caseId}"`);
    }
  }
  if (opts.tag) {
    filtered = filtered.filter((c) => c.tags?.includes(opts.tag));
    if (filtered.length === 0) {
      throw new Error(`No eval cases with tag "${opts.tag}"`);
    }
  }
  return filtered;
}
