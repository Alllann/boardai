"use client";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import type { MeetingProposal } from "@/lib/schemas";

type Props = {
  proposal: MeetingProposal;
  onApprove: () => void;
  onSuggestChanges: () => void;
  loading?: boolean;
};

export function ChatProposalCard({
  proposal,
  onApprove,
  onSuggestChanges,
  loading = false,
}: Props) {
  return (
    <li className="flex justify-start py-1">
      <div className="w-full max-w-[min(36rem,95%)] rounded-2xl rounded-tl-sm border border-amber-200/90 bg-amber-50/95 px-4 py-3 shadow-md dark:border-amber-800/60 dark:bg-amber-950/40">
        <div className="mb-3 flex items-center gap-2 border-b border-amber-200/50 pb-2 dark:border-amber-800/40">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-300 text-sm font-semibold text-amber-950 dark:bg-amber-700 dark:text-amber-50"
            aria-hidden
          >
            C
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Chair</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">meeting proposal</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {proposal.chairMessage}
        </p>

        <div className="mt-3 space-y-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/50">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Proposed goal
          </p>
          <p className="text-sm text-zinc-900 dark:text-zinc-100">{proposal.meetingGoal}</p>
        </div>

        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Proposed experts
          </p>
          <ul className="space-y-2">
            {proposal.roles.map((r) => (
              <li
                key={r.id}
                className="flex gap-2.5 rounded-lg border border-zinc-200 bg-white/90 px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950/50"
              >
                <ExpertAvatar role={r} size="sm" />
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{r.title}</p>
                  {r.background ? (
                    <p className="mt-0.5 leading-snug text-zinc-600 dark:text-zinc-400">
                      {r.background}
                    </p>
                  ) : null}
                  <p className="mt-0.5 leading-snug text-zinc-500 dark:text-zinc-500">{r.mandate}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onApprove}
            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Looks good, start
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onSuggestChanges}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Suggest changes
          </button>
        </div>
      </div>
    </li>
  );
}
