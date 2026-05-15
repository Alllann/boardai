import { Agent, CursorAgentError } from "@cursor/sdk";
import type { AgentOptions } from "@cursor/sdk";

import { MAX_TURNS, TARGET_TURNS_MIN } from "./board-constants";
import { extractJsonObject } from "./json-extract";
import {
  chairBriefingPrompt,
  chairBriefingRetryPrompt,
  chairMeetingPlanPrompt,
  chairMeetingPlanRetryPrompt,
  expertTurnPrompt,
} from "./prompts";
import type { ChairBriefing, MeetingPlan, Transcript, TranscriptTurn } from "./schemas";
import { briefingSchema, meetingPlanSchema } from "./schemas";

export type BoardRunResult = {
  meetingPlan: MeetingPlan;
  transcript: Transcript;
  briefing: ChairBriefing;
};

function getApiKey(): string {
  const key = process.env.CURSOR_API_KEY;
  if (!key?.trim()) {
    throw new Error("CURSOR_API_KEY is not set");
  }
  return key.trim();
}

export function getLocalAgentOptions(): AgentOptions {
  return {
    apiKey: getApiKey(),
    model: { id: "composer-2" },
    local: { cwd: process.cwd(), settingSources: [] },
  };
}

async function runPromptForText(
  prompt: string,
  options: AgentOptions,
): Promise<{ text: string; runId: string }> {
  try {
    const result = await Agent.prompt(prompt, options);
    if (result.status === "error") {
      throw new Error(`Agent run finished with error status (run ${result.id})`);
    }
    const text = result.result?.trim();
    if (!text) {
      throw new Error(`Agent returned empty result (run ${result.id})`);
    }
    return { text, runId: result.id };
  } catch (e) {
    if (e instanceof CursorAgentError) {
      throw new Error(`Cursor agent failed to start: ${e.message}`);
    }
    throw e;
  }
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

export async function runBoardSession(userBrief: string): Promise<BoardRunResult> {
  const options = getLocalAgentOptions();
  const plan = await generateMeetingPlan(userBrief, options);

  const turns: TranscriptTurn[] = [];
  const otherNames = () => plan.roles.map((r) => ({ name: r.name }));

  for (let i = 0; i < plan.turnSchedule.length; i++) {
    const roleId = plan.turnSchedule[i]!;
    const role = plan.roles.find((r) => r.id === roleId);
    if (!role) {
      throw new Error(`Internal error: missing role ${roleId}`);
    }
    const prompt = expertTurnPrompt({
      expertName: role.name,
      mandate: role.mandate,
      otherExperts: otherNames().filter((o) => o.name !== role.name),
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
    turns.push({
      id: turns.length + 1,
      roleId: role.id,
      roleName: role.name,
      content: text,
    });
  }

  const transcript: Transcript = { turns };
  const briefing = await generateBriefing(userBrief, plan, turns, options);

  return { meetingPlan: plan, transcript, briefing };
}
