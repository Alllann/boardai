"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { BoardStreamEvent } from "@/lib/board-events";
import {
  loadSession,
  markAutostart,
  patchSession,
  type BoardSession,
} from "@/lib/session-store";
import type {
  ChairBriefing,
  Glossary,
  MeetingPlan,
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
};

function sessionToState(session: BoardSession, loading = false): StreamState {
  return {
    brief: session.brief,
    loading: loading || (session.status === "running" && !session.glossary),
    error: session.error,
    meetingPlan: session.meetingPlan,
    turns: session.turns,
    briefing: session.briefing,
    glossary: session.glossary,
    status: session.status,
  };
}

export function useBoardStream(sessionId: string) {
  const [revision, setRevision] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const streamStartedRef = useRef(false);

  const bump = useCallback(() => setRevision((r) => r + 1), []);

  const session = loadSession(sessionId);
  const state = session
    ? sessionToState(session, streaming)
    : null;

  const runStream = useCallback(async () => {
    const current = loadSession(sessionId);
    if (!current?.brief.trim()) return;
    if (streamStartedRef.current) return;
    if (current.status === "complete" && current.glossary) return;

    streamStartedRef.current = true;
    setStreaming(true);
    patchSession(sessionId, { status: "running", error: null });
    bump();

    try {
      const res = await fetch("/api/board/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: current.brief }),
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

      const applyEvent = (ev: BoardStreamEvent) => {
        switch (ev.type) {
          case "meeting_plan":
            patchSession(sessionId, { meetingPlan: ev.payload });
            break;
          case "turn": {
            const s = loadSession(sessionId);
            if (s) patchSession(sessionId, { turns: [...s.turns, ev.payload] });
            break;
          }
          case "briefing":
            patchSession(sessionId, {
              briefing: ev.payload,
              title: ev.payload.headline,
            });
            break;
          case "glossary":
            patchSession(sessionId, { glossary: ev.payload, status: "complete" });
            break;
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

      const final = loadSession(sessionId);
      if (final && final.status === "running") {
        patchSession(sessionId, { status: "complete" });
        bump();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error";
      patchSession(sessionId, { status: "error", error: message });
      bump();
    } finally {
      setStreaming(false);
      bump();
    }
  }, [sessionId, bump]);

  useEffect(() => {
    streamStartedRef.current = false;
    const s = loadSession(sessionId);
    if (s && markAutostart(sessionId) && s.status === "running" && !s.glossary) {
      queueMicrotask(() => {
        void runStream();
      });
    }
  }, [sessionId, runStream]);

  return { state, revision, runStream };
}
