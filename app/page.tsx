"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DiscussionTurn } from "@/components/DiscussionTurn";
import { GlossaryPanel } from "@/components/GlossaryPanel";
import { GlossaryText } from "@/components/GlossaryText";
import { RoleLegend } from "@/components/RoleLegend";
import { getRolePalette } from "@/lib/role-colors";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meetingPlan, setMeetingPlan] = useState<MeetingPlan | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [briefing, setBriefing] = useState<ChairBriefing | null>(null);
  const [readerGuide, setReaderGuide] = useState<ReaderGuide | null>(null);
  const [glossary, setGlossary] = useState<Glossary | null>(null);

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

  useEffect(() => {
    if (!chatEndRef.current || !chatScrollRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, meetingPlan, briefing, readerGuide]);

  const runBoard = useCallback(async () => {
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
        body: JSON.stringify({ brief }),
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
  const hasBoard = meetingPlan !== null || turns.length > 0 || briefing !== null;
  const discussionInProgress =
    loading && meetingPlan !== null && turns.length > 0 && readerGuide === null;

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Board AI
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Describe your business idea or decision. The Chair convenes experts; each
          message shows who is speaking and their mandate. Expert dialogue is unchanged
          — plain-language explanations and glossary terms are added separately after
          the discussion. Hover underlined words for quick definitions.
        </p>
      </header>

      <section className="space-y-3">
        <label htmlFor="brief" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Your brief
        </label>
        <textarea
          id="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={6}
          disabled={loading}
          placeholder="Context, constraints, what you want stress-tested…"
          className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runBoard}
            disabled={loading || !brief.trim()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Live session…" : "Run board"}
          </button>
          {loading ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {meetingPlan
                ? turns.length > 0
                  ? `Discussion: ${turns.length} message${turns.length === 1 ? "" : "s"}…`
                  : "Experts joining…"
                : "Chair is convening the board…"}
              {meetingPlan && turns.length > 0 && !readerGuide && !briefing
                ? " (explanations after discussion)"
                : ""}
              {meetingPlan &&
              turns.length >= meetingPlan.turnSchedule.length &&
              !readerGuide &&
              !briefing
                ? " Writing briefing and explanations…"
                : ""}
              {meetingPlan &&
              turns.length >= meetingPlan.turnSchedule.length &&
              briefing &&
              !readerGuide
                ? " Finishing explanations…"
                : ""}
              {readerGuide && !glossary ? " Adding glossary…" : ""}
            </span>
          ) : null}
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
        >
          {error}
        </div>
      ) : null}

      {hasBoard ? (
        <>
          {meetingPlan ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  Convened experts
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Roles chosen for this brief — not a fixed template.
                </p>
              </div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Goal: {meetingPlan.meetingGoal}
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {meetingPlan.roles.map((r) => {
                  const palette = getRolePalette(r.id);
                  return (
                    <li
                      key={r.id}
                      className={`rounded-lg border p-3 text-sm ${palette.border} ${palette.bg}`}
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {r.name}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        id:{" "}
                        <code className="rounded bg-zinc-200/80 px-1 dark:bg-zinc-800">
                          {r.id}
                        </code>
                      </div>
                      <p className="mt-2 text-zinc-700 dark:text-zinc-300">{r.mandate}</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Discussion
              </h2>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    "transcript",
                    JSON.stringify({ turns }, null, 2),
                  )
                }
                disabled={turns.length === 0}
                className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Copy transcript JSON
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Model-generated advisory dialogue. Each bubble shows the expert&apos;s role
              and mandate. Underlined segments have glossary tooltips when available.
            </p>
            {discussionInProgress ? (
              <p className="text-xs text-zinc-500 italic dark:text-zinc-400">
                Plain-language explanations will appear when the discussion finishes.
              </p>
            ) : null}

            {meetingPlan && meetingPlan.roles.length > 0 ? (
              <RoleLegend roles={meetingPlan.roles} />
            ) : null}

            <div
              ref={chatScrollRef}
              className="max-h-[min(28rem,50vh)] min-h-[12rem] space-y-3 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              {readerGuide?.threadFraming ? (
                <div className="rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 text-xs leading-relaxed text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-300">
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                    What this meeting is about:{" "}
                  </span>
                  {readerGuide.threadFraming}
                </div>
              ) : null}

              {turns.length === 0 && !loading ? (
                <p className="text-sm text-zinc-500">No messages yet.</p>
              ) : null}
              <ul className="space-y-3">
                {turns.map((t) => (
                  <DiscussionTurn
                    key={t.id}
                    turn={t}
                    role={roleById.get(t.roleId)}
                    glossaryEntries={glossaryEntries}
                    explanation={explanationByTurnId.get(t.id)}
                    showExplanationToggle={Boolean(readerGuide)}
                  />
                ))}
              </ul>
              <div ref={chatEndRef} />
            </div>

            {glossaryEntries.length > 0 ? (
              <GlossaryPanel entries={glossaryEntries} />
            ) : null}
          </section>

          {briefing ? (
            <section className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  Chair briefing
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    copyText("briefing", JSON.stringify(briefing, null, 2))
                  }
                  className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Copy briefing JSON
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  Thesis
                </h3>
                <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                  <GlossaryText text={briefing.thesis} entries={glossaryEntries} />
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  Key risks
                </h3>
                <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                  {briefing.keyRisks.map((x, i) => (
                    <li key={i}>
                      <GlossaryText text={x} entries={glossaryEntries} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  Experiments
                </h3>
                <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                  {briefing.experiments.map((x, i) => (
                    <li key={i}>
                      <GlossaryText text={x} entries={glossaryEntries} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  7-day plan
                </h3>
                <ol className="list-inside list-decimal text-sm text-zinc-800 dark:text-zinc-200">
                  {briefing.sevenDayPlan.map((x, i) => (
                    <li key={i}>
                      <GlossaryText text={x} entries={glossaryEntries} />
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  Open questions
                </h3>
                {briefing.openQuestions.length === 0 ? (
                  <p className="text-sm text-zinc-500">None listed.</p>
                ) : (
                  <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                    {briefing.openQuestions.map((x, i) => (
                      <li key={i}>
                        <GlossaryText text={x} entries={glossaryEntries} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {briefing.dissentOrUnresolved ? (
                <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <h3 className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
                    Dissent / unresolved
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                    <GlossaryText
                      text={briefing.dissentOrUnresolved}
                      entries={glossaryEntries}
                    />
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
