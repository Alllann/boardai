import type { AgentOptions } from "@cursor/sdk";

import type { BoardEmitEvent, StreamAction, StreamContext } from "./board-events";
import { MAX_TURNS, TARGET_TURNS_MIN } from "./board-constants";
import { runPromptForText, getAgentOptions } from "./agent-client";
import { extractJsonObject } from "./json-extract";
import { generateGlossary } from "./glossary-agent";
import {
  chairBriefingPrompt,
  chairBriefingRetryPrompt,
  chairMeetingPlanPrompt,
  chairMeetingPlanRetryPrompt,
  chairProposalRevisionPrompt,
  chairReplyPrompt,
  chairRouterPrompt,
  expertDirectReplyPrompt,
  expertTurnPrompt,
} from "./prompts";
import type {
  ChairBriefing,
  ChairRoute,
  Glossary,
  MeetingPlan,
  MeetingProposal,
  TranscriptTurn,
} from "./schemas";
import {
  briefingSchema,
  chairRouteSchema,
  meetingPlanSchema,
  meetingProposalSchema,
} from "./schemas";

export type { BoardRunResult } from "./board-events";
export { getAgentOptions } from "./agent-client";

export async function runBoardSessionWithEvents(
  userBrief: string,
  sink: (event: BoardEmitEvent) => void | Promise<void>,
  ctx?: Partial<StreamContext>,
): Promise<void> {
  const options = getAgentOptions();

  if (ctx?.pendingProposal && !ctx.meetingPlan) {
    await runDiscussionFromPlan(
      userBrief,
      proposalToPlan(ctx.pendingProposal),
      ctx.turns ?? [],
      (ctx.roundCount ?? 0) + 1,
      sink,
      options,
      { includeGlossary: true },
    );
    return;
  }

  const proposal = await generateMeetingProposal(userBrief, options);
  const needsPause =
    proposal.goalNeedsConfirmation || proposal.rosterNeedsConfirmation;

  if (needsPause) {
    await sink({ type: "meeting_proposal", payload: proposal });
    const reason =
      proposal.goalNeedsConfirmation && proposal.rosterNeedsConfirmation
        ? "both"
        : proposal.goalNeedsConfirmation
          ? "goal"
          : "roster";
    await sink({ type: "awaiting_user", reason });
    return;
  }

  const plan = proposalToPlan(proposal);
  await sink({ type: "meeting_plan", payload: plan, roundId: 1 });
  await runDiscussionFromPlan(userBrief, plan, [], 1, sink, options, {
    includeGlossary: true,
  });
}

export async function resumeBoardSessionWithEvents(
  action: StreamAction,
  ctx: StreamContext,
  sink: (event: BoardEmitEvent) => void | Promise<void>,
): Promise<void> {
  const options = getAgentOptions();

  if (action.action === "approve_proposal" && ctx.pendingProposal) {
    const plan = proposalToPlan(ctx.pendingProposal);
    await sink({ type: "meeting_plan", payload: plan, roundId: (ctx.roundCount || 0) + 1 });
    await runDiscussionFromPlan(
      ctx.userBrief,
      plan,
      ctx.turns,
      (ctx.roundCount || 0) + 1,
      sink,
      options,
      { includeGlossary: true },
    );
    return;
  }

  if (action.action === "proposal_reply" && ctx.pendingProposal) {
    const revised = await reviseMeetingProposal(
      ctx.userBrief,
      ctx.pendingProposal,
      action.message,
      options,
    );
    const stillNeedsPause =
      revised.goalNeedsConfirmation || revised.rosterNeedsConfirmation;

    if (stillNeedsPause) {
      await sink({ type: "meeting_proposal", payload: revised });
      const reason =
        revised.goalNeedsConfirmation && revised.rosterNeedsConfirmation
          ? "both"
          : revised.goalNeedsConfirmation
            ? "goal"
            : "roster";
      await sink({ type: "awaiting_user", reason });
      return;
    }

    const plan = proposalToPlan(revised);
    await sink({ type: "meeting_plan", payload: plan, roundId: 1 });
    await runDiscussionFromPlan(ctx.userBrief, plan, [], 1, sink, options, {
      includeGlossary: true,
    });
    return;
  }

  if (action.action === "follow_up" && ctx.meetingPlan) {
    await runFollowUp(ctx.userBrief, action.message, ctx, sink, options);
    return;
  }

  throw new Error("Invalid resume action or missing session context");
}

async function runFollowUp(
  userBrief: string,
  message: string,
  ctx: StreamContext,
  sink: (event: BoardEmitEvent) => void | Promise<void>,
  options: AgentOptions,
): Promise<void> {
  const plan = ctx.meetingPlan!;
  const transcriptText = formatTranscriptForPrompt(ctx.turns);
  const briefingSummary = ctx.briefing
    ? `${ctx.briefing.headline}\n${ctx.briefing.thesis}`
    : undefined;

  const route = await routeFollowUp(
    message,
    plan,
    transcriptText,
    briefingSummary,
    options,
  );

  const roundId = (ctx.roundCount || 1) + 1;

  switch (route.action) {
    case "expert_direct": {
      const roleId = route.targetRoleId;
      const role = plan.roles.find((r) => r.id === roleId);
      if (!role) {
        await sink({
          type: "chair_message",
          payload: {
            id: crypto.randomUUID(),
            content:
              "I couldn't tell which expert you meant — try @mentioning them by title.",
            roundId,
          },
        });
        return;
      }
      const prompt = expertDirectReplyPrompt({
        expertTitle: role.title,
        mandate: role.mandate,
        transcriptLines: transcriptText,
        userMessage: message,
        briefingSummary,
      });
      const { text } = await runPromptForText(prompt, options);
      const maxId = ctx.turns.reduce((m, t) => Math.max(m, t.id), 0);
      const turn: TranscriptTurn = {
        id: maxId + 1,
        roleId: role.id,
        roleName: role.title,
        content: text,
      };
      await sink({ type: "turn", payload: turn, roundId });
      return;
    }

    case "chair_reply": {
      const reply =
        route.chairReply?.trim() ??
        (
          await runPromptForText(
            chairReplyPrompt({
              userMessage: message,
              transcriptText,
              meetingGoal: plan.meetingGoal,
              briefingSummary,
            }),
            options,
          )
        ).text;
      await sink({
        type: "chair_message",
        payload: { id: crypto.randomUUID(), content: reply.trim(), roundId },
      });
      return;
    }

    case "revise_roster": {
      const newRoles = route.newRoles ?? [];
      const updatedPlan: MeetingPlan = {
        ...plan,
        roles: [...plan.roles, ...newRoles.filter((nr) => !plan.roles.some((r) => r.id === nr.id))],
        meetingGoal: route.followUpGoal ?? plan.meetingGoal,
        turnSchedule:
          route.turnSchedule && route.turnSchedule.length >= TARGET_TURNS_MIN
            ? route.turnSchedule
            : plan.turnSchedule,
      };
      const finalized = finalizeMeetingPlan(updatedPlan);
      await sink({ type: "meeting_plan", payload: finalized, roundId });
      await runDiscussionFromPlan(
        userBrief,
        finalized,
        ctx.turns,
        roundId,
        sink,
        options,
        { includeGlossary: true, includeBriefing: true },
      );
      return;
    }

    case "follow_up_round": {
      const schedule =
        route.turnSchedule && route.turnSchedule.length >= TARGET_TURNS_MIN
          ? route.turnSchedule
          : plan.turnSchedule;
      const roundPlan: MeetingPlan = {
        ...plan,
        meetingGoal: route.followUpGoal ?? plan.meetingGoal,
        turnSchedule: schedule,
      };
      const finalized = finalizeMeetingPlan(roundPlan);
      await sink({ type: "meeting_plan", payload: finalized, roundId });
      await runDiscussionFromPlan(
        userBrief,
        finalized,
        ctx.turns,
        roundId,
        sink,
        options,
        { includeGlossary: true, includeBriefing: true },
      );
      return;
    }

    default:
      throw new Error(`Unknown route action: ${(route as ChairRoute).action}`);
  }
}

async function runDiscussionFromPlan(
  userBrief: string,
  plan: MeetingPlan,
  priorTurns: TranscriptTurn[],
  roundId: number,
  sink: (event: BoardEmitEvent) => void | Promise<void>,
  options: AgentOptions,
  flags: { includeBriefing?: boolean; includeGlossary?: boolean } = {},
): Promise<void> {
  const turns: TranscriptTurn[] = [...priorTurns];
  const startId = priorTurns.length;
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
      "round",
      roundId,
    );
    const turn: TranscriptTurn = {
      id: startId + i + 1,
      roleId: role.id,
      roleName: role.title,
      content: text,
    };
    turns.push(turn);
    await sink({ type: "turn", payload: turn, roundId });
  }

  const roundTurns = turns.slice(startId);
  let briefing: ChairBriefing | null = null;

  if (flags.includeBriefing !== false && roundTurns.length > 0) {
    briefing = await generateBriefing(
      userBrief,
      plan,
      turns,
      options,
      roundId > 1 ? `follow-up round ${roundId}` : undefined,
    );
    await sink({ type: "briefing", payload: briefing, roundId });
  }

  if (flags.includeGlossary && briefing) {
    const glossary = await generateGlossary(
      userBrief,
      plan,
      turns,
      briefing,
      options,
    );
    await sink({ type: "glossary", payload: glossary, roundId });
  }
}

function proposalToPlan(proposal: MeetingProposal): MeetingPlan {
  const {
    goalNeedsConfirmation: _goalNeedsConfirmation,
    rosterNeedsConfirmation: _rosterNeedsConfirmation,
    chairMessage: _chairMessage,
    id: _proposalId,
    ...plan
  } = proposal;
  void _goalNeedsConfirmation;
  void _rosterNeedsConfirmation;
  void _chairMessage;
  void _proposalId;
  return finalizeMeetingPlan(plan);
}

export async function runBoardSession(userBrief: string) {
  const turns: TranscriptTurn[] = [];
  let meetingPlan: MeetingPlan | undefined;
  let briefing: ChairBriefing | undefined;
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
      case "glossary":
        glossary = e.payload;
        break;
    }
  });

  if (!meetingPlan || !briefing || glossary === undefined) {
    throw new Error("Incomplete board session aggregation");
  }

  return {
    meetingPlan,
    transcript: { turns },
    briefing,
    glossary,
  };
}

function parseMeetingPlanJson(raw: string): MeetingPlan {
  const jsonStr = extractJsonObject(raw);
  const data: unknown = JSON.parse(jsonStr);
  return meetingPlanSchema.parse(data);
}

function parseMeetingProposalJson(raw: string, id?: string): MeetingProposal {
  const jsonStr = extractJsonObject(raw);
  const data: unknown = JSON.parse(jsonStr);
  const parsed = meetingProposalSchema.parse({
    ...(typeof data === "object" && data !== null ? data : {}),
    id: id ?? crypto.randomUUID(),
  });
  return {
    ...parsed,
    ...finalizeMeetingPlan(parsed),
  };
}

function parseBriefingJson(raw: string): ChairBriefing {
  const jsonStr = extractJsonObject(raw);
  const data: unknown = JSON.parse(jsonStr);
  return briefingSchema.parse(data);
}

function parseChairRouteJson(raw: string): ChairRoute {
  const jsonStr = extractJsonObject(raw);
  const data: unknown = JSON.parse(jsonStr);
  return chairRouteSchema.parse(data);
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
  return turns.map((t) => `${t.roleName}: ${t.content}`).join("\n\n");
}

async function generateMeetingProposal(
  userBrief: string,
  options: AgentOptions,
): Promise<MeetingProposal> {
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? chairMeetingPlanPrompt(userBrief)
        : chairMeetingPlanRetryPrompt(userBrief, lastErr);
    const { text, runId } = await runPromptForText(prompt, options);
    console.info("[board] meeting proposal run", runId);
    try {
      return parseMeetingProposalJson(text);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (attempt === 1) {
        throw new Error(`Invalid meeting proposal JSON: ${lastErr}`);
      }
    }
  }
  throw new Error("Unreachable");
}

async function reviseMeetingProposal(
  userBrief: string,
  current: MeetingProposal,
  userReply: string,
  options: AgentOptions,
): Promise<MeetingProposal> {
  const prompt = chairProposalRevisionPrompt({
    userBrief,
    currentProposalJson: JSON.stringify(current),
    userReply,
  });
  const { text, runId } = await runPromptForText(prompt, options);
  console.info("[board] proposal revision run", runId);
  return parseMeetingProposalJson(text, current.id);
}

async function routeFollowUp(
  message: string,
  plan: MeetingPlan,
  transcriptText: string,
  briefingSummary: string | undefined,
  options: AgentOptions,
): Promise<ChairRoute> {
  const prompt = chairRouterPrompt({
    userMessage: message,
    meetingPlanJson: JSON.stringify(plan),
    transcriptText,
    briefingSummary,
  });
  const { text } = await runPromptForText(prompt, options);
  return parseChairRouteJson(text);
}

async function generateBriefing(
  userBrief: string,
  plan: MeetingPlan,
  turns: TranscriptTurn[],
  options: AgentOptions,
  roundLabel?: string,
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
            roundLabel,
          })
        : chairBriefingRetryPrompt({
            userBrief,
            meetingPlanJson,
            transcriptText,
            validationError: lastErr,
            roundLabel,
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

// keep parseMeetingPlanJson for tests/smoke
export { parseMeetingPlanJson, formatTranscriptForPrompt };
