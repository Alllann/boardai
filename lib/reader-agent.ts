import type { AgentOptions } from "@cursor/sdk";

import { runPromptForText } from "./agent-client";
import { extractJsonObject } from "./json-extract";
import { buildReaderBundle, readerGuidePrompt } from "./reader-prompts";
import type {
  ChairBriefing,
  MeetingPlan,
  ReaderGuide,
  TranscriptTurn,
} from "./schemas";
import { readerGuideSchema } from "./schemas";

export async function generateReaderGuide(
  userBrief: string,
  plan: MeetingPlan,
  turns: TranscriptTurn[],
  briefing: ChairBriefing | undefined,
  options: AgentOptions,
): Promise<ReaderGuide> {
  const bundle = buildReaderBundle(userBrief, plan, turns, briefing);
  try {
    const { text, runId } = await runPromptForText(
      readerGuidePrompt(userBrief, bundle, Boolean(briefing)),
      options,
    );
    console.info("[board] reader guide run", runId);
    const jsonStr = extractJsonObject(text);
    const guide = readerGuideSchema.parse(JSON.parse(jsonStr));
    const expected = turns.length;
    if (guide.turnExplanations.length < expected) {
      console.warn(
        "[board] reader guide missing explanations",
        guide.turnExplanations.length,
        "/",
        expected,
      );
    }
    return guide;
  } catch (e) {
    console.warn("[board] reader guide parse failed", e);
    return { turnExplanations: [], briefingExplanations: [] };
  }
}
