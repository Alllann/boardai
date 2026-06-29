"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { BoardStreamEvent, StreamContext } from "@/lib/board-events";
import {
  appendTimelineEvent,
  appendThreadItem,
  loadSession,
  markAutostart,
  patchSession,
  syncTurnToThread,
  type BoardSession,
} from "@/lib/session-store";
import type {
  ChairBriefing,
  Glossary,
  MeetingPlan,
  MeetingProposal,
  SessionTimelineEvent,
  ThreadItem,
  TranscriptTurn,
} from "@/lib/schemas";

export type StreamState = {
  brief: string;
  loading: boolean;
  error: string | null;
  meetingPlan: MeetingPlan | null;
  turns: TranscriptTurn[];
  briefing: ChairBriefing | null;
  glossary: Glossary | null;
  status: BoardSession["status"];
  phase: BoardSession["phase"];
  roundCount: number;
  timeline: SessionTimelineEvent[];
  thread: ThreadItem[];
  pendingProposal: MeetingProposal | null;
  userMessages: BoardSession["userMessages"];
};

function sessionToState(session: BoardSession, streaming = false): StreamState {
  return {
    brief: session.brief,
    loading: streaming || session.status === "running",
    error: session.error,
    meetingPlan: session.meetingPlan,
    turns: session.turns,
    briefing: session.briefing,
    glossary: session.glossary,
    status: session.status,
    phase: session.phase,
    roundCount: session.roundCount,
    timeline: session.timeline,
    thread: session.thread,
    pendingProposal: session.pendingProposal,
    userMessages: session.userMessages,
  };
}

function buildStreamContext(session: BoardSession): StreamContext {
  return {
    userBrief: session.brief,
    meetingPlan: session.meetingPlan,
    turns: session.turns,
    briefing: session.briefing,
    glossary: session.glossary,
    roundCount: session.roundCount,
    pendingProposal: session.pendingProposal,
  };
}

function isDiscussionCountMessage(message: string): boolean {
  return /^Discussion · \d+ message/.test(message);
}

export function useBoardStream(sessionId: string) {
  const [revision, setRevision] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const streamStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const bump = useCallback(() => setRevision((r) => r + 1), []);

  const session = loadSession(sessionId);
  const state = session ? sessionToState(session, streaming) : null;

  const consumeStream = useCallback(
    async (body: Record<string, unknown>) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setStreaming(true);
      patchSession(sessionId, { status: "running", error: null });
      bump();

      try {
        const res = await fetch("/api/board/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const ct = res.headers.get("content-type") ?? "";
        if (!res.ok || !ct.includes("ndjson")) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          const message = errBody.error ?? `Request failed (${res.status})`;
          patchSession(sessionId, { status: "error", error: message });
          bump();
          return;
        }

        const bodyReader = res.body?.getReader();
        if (!bodyReader) {
          patchSession(sessionId, { status: "error", error: "No response body" });
          bump();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let streamFinished = false;
        let lastRoundId = loadSession(sessionId)?.roundCount ?? 1;

        const applyEvent = (ev: BoardStreamEvent) => {
          const s = loadSession(sessionId);
          if (!s) return;

          switch (ev.type) {
            case "meeting_proposal": {
              const proposalItem: ThreadItem = {
                kind: "proposal",
                payload: ev.payload,
                status: "pending",
              };
              patchSession(sessionId, {
                pendingProposal: ev.payload,
                status: "awaiting_user",
                phase: "kickstart",
                thread: [...s.thread, proposalItem],
              });
              appendTimelineEvent(sessionId, {
                message: "Chair is reviewing your brief…",
                timestamp: Date.now(),
                afterTurnCount: 0,
              });
              break;
            }
            case "awaiting_user":
              patchSession(sessionId, { status: "awaiting_user", phase: "kickstart" });
              break;
            case "meeting_plan": {
              const roundId = ev.roundId ?? s.roundCount + 1;
              lastRoundId = roundId;
              appendTimelineEvent(sessionId, {
                message: "Inviting experts to the group…",
                timestamp: Date.now(),
                afterTurnCount: s.turns.length,
              });
              patchSession(sessionId, {
                meetingPlan: ev.payload,
                pendingProposal: null,
                phase: roundId > 1 ? "follow_up" : "discussion",
                roundCount: Math.max(s.roundCount, roundId),
                status: "running",
              });
              break;
            }
            case "turn": {
              const roundId = ev.roundId ?? lastRoundId;
              syncTurnToThread(sessionId, ev.payload, roundId);
              break;
            }
            case "chair_message": {
              const item: ThreadItem = {
                kind: "chair",
                id: ev.payload.id,
                content: ev.payload.content,
                timestamp: Date.now(),
                roundId: ev.payload.roundId,
              };
              appendThreadItem(sessionId, item);
              break;
            }
            case "briefing": {
              const roundId = ev.roundId ?? lastRoundId;
              appendTimelineEvent(sessionId, {
                message: "Writing briefing…",
                timestamp: Date.now(),
                afterTurnCount: s.turns.length,
              });
              const briefingItem: ThreadItem = {
                kind: "briefing",
                roundId,
                payload: ev.payload,
              };
              patchSession(sessionId, {
                briefing: ev.payload,
                title: ev.payload.headline,
                thread: [...(loadSession(sessionId)?.thread ?? s.thread), briefingItem],
              });
              break;
            }
            case "glossary": {
              patchSession(sessionId, {
                glossary: ev.payload,
              });
              break;
            }
            case "error":
              patchSession(sessionId, { status: "error", error: ev.message });
              break;
            case "done":
              break;
            default:
              break;
          }
          bump();
        };

        while (!streamFinished) {
          const { done, value } = await bodyReader.read();
          if (value) buffer += decoder.decode(value, { stream: !done });
          if (done) buffer += decoder.decode();

          let nl: number;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;
            let ev: BoardStreamEvent;
            try {
              ev = JSON.parse(line) as BoardStreamEvent;
            } catch {
              continue;
            }
            applyEvent(ev);
            if (ev.type === "done") {
              streamFinished = true;
              break;
            }
          }
          if (done) streamFinished = true;
        }

        if (streamFinished && !controller.signal.aborted) {
          const final = loadSession(sessionId);
          if (final && final.status === "running") {
            patchSession(sessionId, { status: "idle", phase: "idle" });
            bump();
          }
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
        const message = e instanceof Error ? e.message : "Network error";
        patchSession(sessionId, { status: "error", error: message });
        bump();
      } finally {
        setStreaming(false);
        bump();
      }
    },
    [sessionId, bump],
  );

  const runStream = useCallback(async () => {
    const current = loadSession(sessionId);
    if (!current?.brief.trim()) return;
    if (streamStartedRef.current) return;
    if (current.status === "idle" && current.glossary) return;
    if (current.status === "complete" && current.glossary) return;
    if (current.status === "awaiting_user") return;

    streamStartedRef.current = true;
    appendTimelineEvent(sessionId, {
      message: "Chair is convening the board…",
      timestamp: Date.now(),
      afterTurnCount: 0,
    });
    await consumeStream({ action: "start", brief: current.brief });
  }, [sessionId, consumeStream]);

  const approveProposal = useCallback(async () => {
    const current = loadSession(sessionId);
    if (!current?.pendingProposal) return;

    const proposalItem: ThreadItem = {
      kind: "proposal",
      payload: current.pendingProposal,
      status: "approved",
    };
    patchSession(sessionId, {
      thread: [...current.thread.filter((t) => t.kind !== "proposal"), proposalItem],
      status: "running",
    });
    bump();

    await consumeStream({
      action: "approve_proposal",
      ...buildStreamContext(current),
    });
  }, [sessionId, consumeStream, bump]);

  const sendProposalReply = useCallback(
    async (message: string) => {
      const current = loadSession(sessionId);
      if (!current?.pendingProposal || !message.trim()) return;

      const userItem: ThreadItem = {
        kind: "user",
        id: crypto.randomUUID(),
        content: message.trim(),
        timestamp: Date.now(),
        roundId: 0,
      };
      patchSession(sessionId, {
        thread: [...current.thread, userItem],
        status: "running",
      });
      bump();

      await consumeStream({
        action: "proposal_reply",
        message: message.trim(),
        ...buildStreamContext(current),
      });
    },
    [sessionId, consumeStream, bump],
  );

  const sendFollowUp = useCallback(
    async (message: string) => {
      const current = loadSession(sessionId);
      if (!current || !message.trim()) return;
      if (!current.meetingPlan) return;

      const roundId = current.roundCount + 1;
      const userItem: ThreadItem = {
        kind: "user",
        id: crypto.randomUUID(),
        content: message.trim(),
        timestamp: Date.now(),
        roundId,
      };
      const userMsg = {
        id: userItem.id,
        content: userItem.content,
        timestamp: userItem.timestamp,
        roundId,
      };

      patchSession(sessionId, {
        thread: [...current.thread, userItem],
        userMessages: [...current.userMessages, userMsg],
        status: "running",
        phase: "follow_up",
      });
      bump();

      await consumeStream({
        action: "follow_up",
        message: message.trim(),
        ...buildStreamContext(loadSession(sessionId)!),
      });
    },
    [sessionId, consumeStream, bump],
  );

  const interruptDiscussion = useCallback(
    async (message: string) => {
      const current = loadSession(sessionId);
      if (!current?.meetingPlan || !message.trim()) return;

      abortControllerRef.current?.abort();

      const roundId = current.roundCount || 1;
      const scheduleIndex = current.thread.filter(
        (t) => t.kind === "expert" && t.roundId === roundId,
      ).length;

      const userItem: ThreadItem = {
        kind: "user",
        id: crypto.randomUUID(),
        content: message.trim(),
        timestamp: Date.now(),
        roundId,
      };

      patchSession(sessionId, {
        thread: [...current.thread, userItem],
        status: "running",
        phase: "discussion",
      });
      bump();

      await consumeStream({
        action: "interrupt_discussion",
        message: message.trim(),
        scheduleIndex,
        ...buildStreamContext(loadSession(sessionId)!),
      });
    },
    [sessionId, consumeStream, bump],
  );

  useEffect(() => {
    streamStartedRef.current = false;
    const s = loadSession(sessionId);
    if (
      s &&
      markAutostart(sessionId) &&
      s.status === "running" &&
      !s.glossary &&
      !s.pendingProposal
    ) {
      queueMicrotask(() => {
        void runStream();
      });
    }
  }, [sessionId, runStream]);

  return {
    state,
    revision,
    runStream,
    approveProposal,
    sendProposalReply,
    sendFollowUp,
    interruptDiscussion,
    isDiscussionCountMessage,
  };
}
