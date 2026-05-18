"use client";

import { useState } from "react";

import { getRolePalette } from "@/lib/role-colors";
import type { MeetingPlan } from "@/lib/schemas";

type Props = {
  plan: MeetingPlan;
};

export function ChatExpertsInvite({ plan }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="flex justify-start py-1">
      <div className="max-w-[min(32rem,92%)] rounded-2xl rounded-tl-sm border border-amber-200/80 bg-amber-50/95 px-3.5 py-2.5 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/40">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100"
            aria-hidden
          >
            C
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Chair</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">added experts to the group</p>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
          <span className="font-medium">Goal:</span> {plan.meetingGoal}
        </p>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs font-medium text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100"
          aria-expanded={expanded}
        >
          {plan.roles.length} expert{plan.roles.length === 1 ? "" : "s"} · {expanded ? "Hide" : "Show"}
        </button>
        {expanded ? (
          <ul className="mt-2 space-y-2 border-t border-amber-200/60 pt-2 dark:border-amber-800/40">
            {plan.roles.map((r) => {
              const palette = getRolePalette(r.id);
              return (
                <li
                  key={r.id}
                  className={`rounded-lg border px-2.5 py-2 text-xs ${palette.border} ${palette.bg}`}
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{r.title}</p>
                  <p className="mt-0.5 leading-snug text-zinc-600 dark:text-zinc-400">{r.mandate}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {plan.roles.map((r) => {
              const palette = getRolePalette(r.id);
              return (
                <span
                  key={r.id}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${palette.chip}`}
                >
                  {r.title}
                </span>
              );
            })}
          </p>
        )}
      </div>
    </li>
  );
}
