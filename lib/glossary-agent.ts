import type { AgentOptions } from "@cursor/sdk";

import { runPromptForText } from "./agent-client";
import {
  buildGlossaryBundle,
  buildTranscriptGlossaryBundle,
  glossaryPrompt,
  incrementalGlossaryPrompt,
} from "./glossary-prompts";
import { extractJsonObject } from "./json-extract";
import type { ChairBriefing, Glossary, MeetingPlan, TranscriptTurn } from "./schemas";
import { glossarySchema } from "./schemas";

async function parseGlossaryResponse(text: string): Promise<Glossary> {
  try {
    const jsonStr = extractJsonObject(text);
    const raw = JSON.parse(jsonStr) as { entries?: unknown[] };
    const glossary = glossarySchema.parse(raw);
    const rawCount = Array.isArray(raw.entries) ? raw.entries.length : 0;
    if (rawCount > glossary.entries.length) {
      console.info("[board] glossary truncated", rawCount, "->", glossary.entries.length);
    }
    return glossary;
  } catch (e) {
    console.warn("[board] glossary parse failed", e);
    return { entries: [] };
  }
}

export async function generateGlossaryIncremental(
  userBrief: string,
  plan: MeetingPlan,
  turns: TranscriptTurn[],
  options: AgentOptions,
): Promise<Glossary> {
  if (turns.length === 0) return { entries: [] };
  const bundle = buildTranscriptGlossaryBundle(userBrief, plan, turns);
  try {
    const { text, runId } = await runPromptForText(
      incrementalGlossaryPrompt(userBrief, bundle),
      options,
    );
    console.info("[board] incremental glossary run", runId);
    return parseGlossaryResponse(text);
  } catch (e) {
    console.warn("[board] incremental glossary failed", e);
    return { entries: [] };
  }
}

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
    return parseGlossaryResponse(text);
  } catch (e) {
    console.warn("[board] glossary parse failed", e);
    return { entries: [] };
  }
}
