import type { ExplainRequest } from "./schemas";
import { buildExplainPromptVariant } from "./explain-prompt-variants";

/** Production on-demand Explain prompt (v4-popover-ui — winner of 2026-05-17 variant compare). */
export function onDemandExplainPrompt(req: ExplainRequest): string {
  return buildExplainPromptVariant("v4-popover-ui", req);
}
