"use client";

import { useState } from "react";

import { ChairAvatar } from "@/components/ChairAvatar";
import { ChatParticipantTurn } from "@/components/chat/ChatParticipantTurn";
import { ExpertAvatar } from "@/components/ExpertAvatar";
import type { MeetingPlan } from "@/lib/schemas";

type Props = {
  plan: MeetingPlan;
};

export function ChatExpertsInvite({ plan }: Props) {
  const [expanded, setExpanded] = useState(false);
  const count = plan.roles.length;

  return (
    <>
      <ChatParticipantTurn
        avatar={<ChairAvatar size="md" />}
        title="Chair"
        subtitle="Facilitator"
      >
        <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          You invited {count} expert{count === 1 ? "" : "s"} to the group.
        </p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-medium">Goal:</span> {plan.meetingGoal}
        </p>
      </ChatParticipantTurn>

      <li className="flex justify-start py-1 pl-12">
        <div className="max-w-[min(32rem,92%)]">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            aria-expanded={expanded}
          >
            {count} expert{count === 1 ? "" : "s"} · {expanded ? "Hide" : "Show"}
          </button>
          {expanded ? (
            <ul className="mt-2 space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
              {plan.roles.map((r) => (
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
                    <p className="mt-0.5 leading-snug text-zinc-500">{r.mandate}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {plan.roles.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full border border-zinc-200 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300"
                >
                  {r.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </li>
    </>
  );
}
