import type { AgentOptions } from "@cursor/sdk";

import type { BoardEmitEvent, BoardRunResult } from "./board-events";
import { MAX_TURNS, TARGET_TURNS_MIN } from "./board-constants";
import { runPromptForText, getAgentOptions } from "./agent-client";
import { extractJsonObject } from "./json-extract";
import { generateGlossary } from "./glossary-agent";
import { generateReaderGuide } from "./reader-agent";
import {
  chairBriefingPrompt,
  chairBriefingRetryPrompt,
  chairMeetingPlanPrompt,
  chairMeetingPlanRetryPrompt,
  expertTurnPrompt,
} from "./prompts";
import type {
  ChairBriefing,
  Glossary,
  MeetingPlan,
  ReaderGuide,
  TranscriptTurn,
} from "./schemas";
import { briefingSchema, meetingPlanSchema } from "./schemas";

export type { BoardRunResult } from "./board-events";
export { getAgentOptions } from "./agent-client";

export async function runBoardSessionWithEvents(
  userBrief: string,
  sink: (event: BoardEmitEvent) => void | Promise<void>,
): Promise<void> {
  const options = getAgentOptions();
  const plan = await generateMeetingPlan(userBrief, options);
  await sink({ type: "meeting_plan", payload: plan });

  const turns: TranscriptTurn[] = [];
  const otherTitles = () => plan.roles.map((r) => ({ title: r.title }));

  for (let i = 0; i < plan.turnSchedule.length; i++) {
    const roleId = plan.turnSchedule[i]!;
    const role = plan.roles.find((r) => r.id === roleId);
    if (!role) {
      throw new Error(`Internal error: missing role ${roleId}`);
    }
    const prompt = expertTurnPrompt({
      expertTitle: role.title,
      mandate: role.mandate,
      otherExperts: otherTitles().filter((o) => o.title !== role.title),
      transcriptLines: formatTranscriptForPrompt(turns),
      chairNotes: plan.chairNotesForFacilitator,
    });
    const { text, runId } = await runPromptForText(prompt, options);
    console.info(
      "[board] expert turn",
      i + 1,
      "/",
      plan.turnSchedule.length,
      runId,
      role.id,
    );
    const turn: TranscriptTurn = {
      id: turns.length + 1,
      roleId: role.id,
      roleName: role.title,
      content: text,
    };
    turns.push(turn);
    await sink({ type: "turn", payload: turn });
  }

  const briefing = await generateBriefing(userBrief, plan, turns, options);
  await sink({ type: "briefing", payload: briefing });

  const readerGuide = await generateReaderGuide(
    userBrief,
    plan,
    turns,
    briefing,
    options,
  );
  await sink({ type: "reader_guide", payload: readerGuide });

  const glossary = await generateGlossary(userBrief, plan, turns, briefing, options);
  await sink({ type: "glossary", payload: glossary });
}

export async function runBoardSession(userBrief: string): Promise<BoardRunResult> {
  const turns: TranscriptTurn[] = [];
  let meetingPlan: MeetingPlan | undefined;
  let briefing: ChairBriefing | undefined;
  let readerGuide: ReaderGuide | undefined;
  let glossary: Glossary | undefined;

  await runBoardSessionWithEvents(userBrief, async (e) => {
    switch (e.type) {
      case "meeting_plan":
        meetingPlan = e.payload;
        break;
      case "turn":
        turns.push(e.payload);
        break;
      case "briefing":
        briefing = e.payload;
        break;
      case "reader_guide":
        readerGuide = e.payload;
        break;
      case "glossary":
        glossary = e.payload;
        break;
    }
  });

  if (!meetingPlan || !briefing || !readerGuide || glossary === undefined) {
    throw new Error("Incomplete board session aggregation");
  }

  return {
    meetingPlan,
    transcript: { turns },
    briefing,
    readerGuide,
    glossary,
  };
}

function parseMeetingPlanJson(raw: string): MeetingPlan {
  const jsonStr = extractJsonObject(raw);
  const data: unknown = JSON.parse(jsonStr);
  return meetingPlanSchema.parse(data);
}

function parseBriefingJson(raw: string): ChairBriefing {
  const jsonStr = extractJsonObject(raw);
  const data: unknown = JSON.parse(jsonStr);
  return briefingSchema.parse(data);
}

/** Ensure schedule references only known roles; trim length; pad if Chair was short. */
export function finalizeMeetingPlan(plan: MeetingPlan): MeetingPlan {
  const ids = new Set(plan.roles.map((r) => r.id));
  const bad = plan.turnSchedule.find((id) => !ids.has(id));
  if (bad) {
    throw new Error(`turnSchedule references unknown roleId: ${bad}`);
  }
  let schedule = plan.turnSchedule.slice(0, MAX_TURNS);
  const roleIds = plan.roles.map((r) => r.id);
  while (schedule.length < TARGET_TURNS_MIN && roleIds.length > 0) {
    schedule.push(roleIds[schedule.length % roleIds.length]!);
    if (schedule.length > MAX_TURNS) {
      schedule = schedule.slice(0, MAX_TURNS);
      break;
    }
  }
  return { ...plan, turnSchedule: schedule };
}

function formatTranscriptForPrompt(turns: TranscriptTurn[]): string {
  if (turns.length === 0) {
    return "(Meeting just started — no prior lines.)";
  }
  return turns
    .map((t) => `${t.roleName}: ${t.content}`)
    .join("\n\n");
}

async function generateMeetingPlan(
  userBrief: string,
  options: AgentOptions,
): Promise<MeetingPlan> {
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? chairMeetingPlanPrompt(userBrief)
        : chairMeetingPlanRetryPrompt(userBrief, lastErr);
    const { text, runId } = await runPromptForText(prompt, options);
    console.info("[board] meeting plan run", runId);
    try {
      const parsed = parseMeetingPlanJson(text);
      return finalizeMeetingPlan(parsed);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (attempt === 1) {
        throw new Error(`Invalid meeting plan JSON: ${lastErr}`);
      }
    }
  }
  throw new Error("Unreachable");
}

async function generateBriefing(
  userBrief: string,
  plan: MeetingPlan,
  turns: TranscriptTurn[],
  options: AgentOptions,
): Promise<ChairBriefing> {
  const transcriptText = formatTranscriptForPrompt(turns);
  const meetingPlanJson = JSON.stringify(plan);
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? chairBriefingPrompt({
            userBrief,
            meetingPlanJson,
            transcriptText,
          })
        : chairBriefingRetryPrompt({
            userBrief,
            meetingPlanJson,
            transcriptText,
            validationError: lastErr,
          });
    const { text, runId } = await runPromptForText(prompt, options);
    console.info("[board] chair briefing run", runId);
    try {
      return parseBriefingJson(text);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (attempt === 1) {
        throw new Error(`Invalid briefing JSON: ${lastErr}`);
      }
    }
  }
  throw new Error("Unreachable");
}
