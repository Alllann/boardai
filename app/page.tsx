"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ChairBriefing, MeetingPlan, Transcript } from "@/lib/schemas";

type BoardResponse = {
  meetingPlan: MeetingPlan;
  transcript: Transcript;
  briefing: ChairBriefing;
};

const LOADING_MESSAGES = [
  "Chair is convening the board…",
  "Experts are in session (multi-turn discussion)…",
  "Chair is drafting your briefing…",
] as const;

export default function Home() {
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [result, setResult] = useState<BoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setPhaseIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 8000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const runBoard = useCallback(async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    setPhaseIdx(0);
    try {
      const res = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = (await res.json()) as BoardResponse & {
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setResult(data as BoardResponse);
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

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Board AI
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Describe your business idea or decision. The Chair convenes a tailored
          expert board, runs an open discussion, then delivers a structured
          briefing.
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
          rows={8}
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
            {loading ? "Running…" : "Run board"}
          </button>
          {loading ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {LOADING_MESSAGES[phaseIdx]}
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

      {result ? (
        <>
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
              Goal: {result.meetingPlan.meetingGoal}
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {result.meetingPlan.roles.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {r.name}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    id: <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">{r.id}</code>
                  </div>
                  <p className="mt-2 text-zinc-700 dark:text-zinc-300">{r.mandate}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Discussion
              </h2>
              <button
                type="button"
                onClick={() =>
                  copyText("transcript", JSON.stringify(result.transcript, null, 2))
                }
                className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Copy transcript JSON
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Transcript is model-generated dialogue for advisory purposes.
            </p>
            <ul className="space-y-3">
              {result.transcript.turns.map((t) => (
                <li
                  key={t.id}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {t.roleName}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {t.content}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Chair briefing
              </h2>
              <button
                type="button"
                onClick={() =>
                  copyText("briefing", JSON.stringify(result.briefing, null, 2))
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
                {result.briefing.thesis}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                Key risks
              </h3>
              <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                {result.briefing.keyRisks.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                Experiments
              </h3>
              <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                {result.briefing.experiments.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                7-day plan
              </h3>
              <ol className="list-inside list-decimal text-sm text-zinc-800 dark:text-zinc-200">
                {result.briefing.sevenDayPlan.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                Open questions
              </h3>
              {result.briefing.openQuestions.length === 0 ? (
                <p className="text-sm text-zinc-500">None listed.</p>
              ) : (
                <ul className="list-inside list-disc text-sm text-zinc-800 dark:text-zinc-200">
                  {result.briefing.openQuestions.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              )}
            </div>

            {result.briefing.dissentOrUnresolved ? (
              <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <h3 className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
                  Dissent / unresolved
                </h3>
                <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {result.briefing.dissentOrUnresolved}
                </p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
