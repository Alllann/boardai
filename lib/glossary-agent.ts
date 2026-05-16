import type { AgentOptions } from "@cursor/sdk";

import { runPromptForText } from "./agent-client";
import { buildGlossaryBundle, glossaryPrompt } from "./glossary-prompts";
import { extractJsonObject } from "./json-extract";
import type { ChairBriefing, Glossary, MeetingPlan, TranscriptTurn } from "./schemas";
import { glossarySchema } from "./schemas";

export async function generateGlossary(
  userBrief: string,
  plan: MeetingPlan,
  turns: TranscriptTurn[],
  briefing: ChairBriefing,
  options: AgentOptions,
): Promise<Glossary> {
  const bundle = buildGlossaryBundle(userBrief, plan, turns, briefing);
  try {
    const { text, runId } = await runPromptForText(
      glossaryPrompt(userBrief, bundle),
      options,
    );
    console.info("[board] glossary run", runId);
    const jsonStr = extractJsonObject(text);
    const raw = JSON.parse(jsonStr) as { entries?: unknown[] };
    const glossary = glossarySchema.parse(raw);
    const rawCount = Array.isArray(raw.entries) ? raw.entries.length : 0;
    if (rawCount > glossary.entries.length) {
      console.info(
        "[board] glossary truncated",
        rawCount,
        "->",
        glossary.entries.length,
      );
    }
    return glossary;
  } catch (e) {
    console.warn("[board] glossary parse failed", e);
    return { entries: [] };
  }
}
