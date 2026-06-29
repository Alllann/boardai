"use client";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import type { MeetingPlan } from "@/lib/schemas";

type Props = {
  role: MeetingPlan["roles"][number];
};

export function DiscussionTypingIndicator({ role }: Props) {
  return (
    <li className="flex items-end gap-3 py-1">
      <ExpertAvatar role={role} size="md" />
      <div className="rounded-2xl rounded-tl-sm border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/60">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Board seat
        </p>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{role.title}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex gap-0.5" aria-hidden>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
          </span>
          is speaking…
        </p>
      </div>
    </li>
  );
}
