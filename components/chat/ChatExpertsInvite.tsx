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
        <p className="text-[var(--text-secondary)]">
          You invited {count} expert{count === 1 ? "" : "s"} to the group.
        </p>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Goal: {plan.meetingGoal}
        </p>
      </ChatParticipantTurn>

      <li className="w-full py-2">
        <div className="w-full">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
            aria-expanded={expanded}
          >
            {count} expert{count === 1 ? "" : "s"} · {expanded ? "Hide" : "Show"}
          </button>
          {expanded ? (
            <ul className="mt-2 space-y-2 border-t border-[var(--border-light)] pt-2">
              {plan.roles.map((r) => (
                <li
                  key={r.id}
                  className="flex gap-2.5 rounded-[var(--radius-soft)] bg-[var(--surface-raised)] px-3 py-2.5 text-xs"
                >
                  <ExpertAvatar role={r} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">{r.title}</p>
                    {r.background ? (
                      <p className="mt-0.5 leading-snug text-[var(--text-secondary)]">
                        {r.background}
                      </p>
                    ) : null}
                    <p className="mt-0.5 leading-snug text-[var(--text-tertiary)]">{r.mandate}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {plan.roles.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]"
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
