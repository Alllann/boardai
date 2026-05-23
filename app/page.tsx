"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatBriefingCard } from "@/components/chat/ChatBriefingCard";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatExpertsInvite } from "@/components/chat/ChatExpertsInvite";
import { ChatGlossaryMessage } from "@/components/chat/ChatGlossaryMessage";
import { ChatSystemBubble } from "@/components/chat/ChatSystemBubble";
import { ChatUserBubble } from "@/components/chat/ChatUserBubble";
import { DiscussionTurn } from "@/components/DiscussionTurn";
import type { ExplainContextParams } from "@/components/SelectableExplain";
import { indexBriefingExplanations } from "@/lib/briefing-explanations";
import {
  buildBriefingSnippet,
  buildMeetingGoal,
  buildTranscriptSnippet,
} from "@/lib/explain-context";
import type { BoardStreamEvent } from "@/lib/board-events";
import type {
  ChairBriefing,
  Glossary,
  MeetingPlan,
  ReaderGuide,
  TranscriptTurn,
} from "@/lib/schemas";

export default function Home() {
  const [brief, setBrief] = useState("");
  const [submittedBrief, setSubmittedBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meetingPlan, setMeetingPlan] = useState<MeetingPlan | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [briefing, setBriefing] = useState<ChairBriefing | null>(null);
  const [readerGuide, setReaderGuide] = useState<ReaderGuide | null>(null);
  const [glossary, setGlossary] = useState<Glossary | null>(null);
  const [discussionMaximized, setDiscussionMaximized] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const roleById = useMemo(() => {
    const map = new Map<string, MeetingPlan["roles"][number]>();
    if (meetingPlan) {
      for (const r of meetingPlan.roles) {
        map.set(r.id, r);
      }
    }
    return map;
  }, [meetingPlan]);

  const explanationByTurnId = useMemo(() => {
    const map = new Map<number, string>();
    if (readerGuide) {
      for (const e of readerGuide.turnExplanations) {
        map.set(e.turnId, e.explanation);
      }
    }
    return map;
  }, [readerGuide]);

  const briefingExplanationByKey = useMemo(
    () => indexBriefingExplanations(readerGuide?.briefingExplanations),
    [readerGuide],
  );

  const explainDisabled = !submittedBrief?.trim();

  const baseExplainContext = useMemo((): ExplainContextParams | undefined => {
    const userBrief = submittedBrief?.trim();
    if (!userBrief) return undefined;
    return {
      source: "transcript",
      userBrief,
      meetingGoal: buildMeetingGoal(meetingPlan),
      transcriptSnippet: buildTranscriptSnippet(turns),
      briefingSnippet: briefing ? buildBriefingSnippet(briefing) : undefined,
    };
  }, [submittedBrief, meetingPlan, turns, briefing]);

  useEffect(() => {
    if (!chatEndRef.current || !chatScrollRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, meetingPlan, briefing, readerGuide, glossary, loading]);

  useEffect(() => {
    if (!discussionMaximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDiscussionMaximized(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [discussionMaximized]);

  const runBoard = useCallback(async () => {
    const trimmed = brief.trim();
    if (!trimmed) return;

    setSubmittedBrief(trimmed);
    setError(null);
    setMeetingPlan(null);
    setTurns([]);
    setBriefing(null);
    setReaderGuide(null);
    setGlossary(null);
    setLoading(true);

    try {
      const res = await fetch("/api/board/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: trimmed }),
      });

      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || !ct.includes("ndjson")) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        setError(errBody.error ?? `Request failed (${res.status})`);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("No response body");
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let streamFinished = false;

      const applyEvent = (ev: BoardStreamEvent) => {
        switch (ev.type) {
          case "meeting_plan":
            setMeetingPlan(ev.payload);
            break;
          case "turn":
            setTurns((prev) => [...prev, ev.payload]);
            break;
          case "briefing":
            setBriefing(ev.payload);
            break;
          case "reader_guide":
            setReaderGuide(ev.payload);
            break;
          case "glossary":
            setGlossary(ev.payload);
            break;
          case "error":
            setError(ev.message);
            break;
          case "done":
            break;
          default:
            break;
        }
      };

      while (!streamFinished) {
        const { done, value } = await reader.read();
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
        }
        if (done) {
          buffer += decoder.decode();
        }

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

        if (done) {
          streamFinished = true;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [brief]);

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError(`Could not copy ${label} to clipboard`);
    }
  };

  const glossaryEntries = glossary?.entries ?? [];
  const showChat = submittedBrief !== null;

  const statusMessage = (() => {
    if (!loading) return null;
    if (!meetingPlan) return "Chair is convening the board…";
    if (turns.length === 0) return "Inviting experts to the group…";
    if (!readerGuide && !briefing) {
      if (meetingPlan && turns.length < meetingPlan.turnSchedule.length) {
        return `Discussion · ${turns.length} message${turns.length === 1 ? "" : "s"}`;
      }
      return "Writing briefing and plain-language summaries…";
    }
    if (briefing && !readerGuide) return "Finishing plain-language summaries…";
    if (readerGuide && !glossary) return "Building glossary…";
    return null;
  })();

  return (
    <div
      className={
        discussionMaximized
          ? "fixed inset-0 z-50 flex flex-col bg-zinc-100 dark:bg-zinc-950"
          : "mx-auto flex min-h-[100dvh] max-w-3xl flex-col bg-zinc-50 dark:bg-zinc-950"
      }
    >
      <header className="shrink-0 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Board AI
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Group advisory · select text to Explain
            </p>
          </div>
          {showChat ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDiscussionMaximized((v) => !v)}
                className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                aria-pressed={discussionMaximized}
              >
                {discussionMaximized ? "Exit full screen" : "Full screen"}
              </button>
              {turns.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    copyText("transcript", JSON.stringify({ turns }, null, 2))
                  }
                  className="text-[11px] font-medium text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Copy JSON
                </button>
              ) : null}
              {briefing ? (
                <button
                  type="button"
                  onClick={() =>
                    copyText("briefing", JSON.stringify(briefing, null, 2))
                  }
                  className="text-[11px] font-medium text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Briefing
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          className="mx-4 mt-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
        >
          {error}
        </div>
      ) : null}

      {showChat ? (
        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(161 161 170 / 0.12) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        >
          <ul className="mx-auto flex max-w-2xl flex-col gap-1">
            {submittedBrief ? <ChatUserBubble text={submittedBrief} /> : null}

            {loading && !meetingPlan ? (
              <ChatSystemBubble variant="status">
                Chair is convening the board…
              </ChatSystemBubble>
            ) : null}

            {meetingPlan ? <ChatExpertsInvite plan={meetingPlan} /> : null}

            {readerGuide?.threadFraming ? (
              <ChatSystemBubble>
                <span className="font-medium">About this meeting · </span>
                {readerGuide.threadFraming}
              </ChatSystemBubble>
            ) : null}

            {turns.map((t) => (
              <DiscussionTurn
                key={t.id}
                turn={t}
                role={roleById.get(t.roleId)}
                glossaryEntries={glossaryEntries}
                explanation={explanationByTurnId.get(t.id)}
                showExplanationToggle={Boolean(readerGuide)}
                explainContext={
                  baseExplainContext
                    ? {
                        ...baseExplainContext,
                        transcriptSnippet: buildTranscriptSnippet(turns, t.id),
                      }
                    : undefined
                }
                explainDisabled={explainDisabled}
              />
            ))}

            {loading && meetingPlan && turns.length === 0 ? (
              <ChatSystemBubble variant="status">
                Experts are joining the discussion…
              </ChatSystemBubble>
            ) : null}

            {briefing && baseExplainContext ? (
              <ChatBriefingCard
                briefing={briefing}
                glossaryEntries={glossaryEntries}
                briefingExplanationByKey={briefingExplanationByKey}
                showExplanationToggle={Boolean(readerGuide)}
                explainContext={baseExplainContext}
                explainDisabled={explainDisabled}
              />
            ) : null}

            {glossaryEntries.length > 0 ? (
              <ChatGlossaryMessage entries={glossaryEntries} />
            ) : null}

            {statusMessage ? (
              <ChatSystemBubble variant="status">{statusMessage}</ChatSystemBubble>
            ) : null}
          </ul>
          <div ref={chatEndRef} className="h-1" aria-hidden />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Send what you want the board to help with — a decision, plan, or question in any domain. The Chair will invite experts,
            run the discussion, and share a briefing — like a group chat.
          </p>
        </div>
      )}

      <ChatComposer
        value={brief}
        onChange={setBrief}
        onSubmit={runBoard}
        loading={loading}
      />
    </div>
  );
}
