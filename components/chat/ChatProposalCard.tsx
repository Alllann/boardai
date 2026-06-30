"use client";

import { useState } from "react";

import { ChairAvatar } from "@/components/ChairAvatar";
import { ChatParticipantTurn } from "@/components/chat/ChatParticipantTurn";
import { ExpertInviteCard } from "@/components/chat/ExpertInviteCard";
import { MIN_ROLES } from "@/lib/board-constants";
import type { MeetingProposal } from "@/lib/schemas";

type Props = {
  proposal: MeetingProposal;
  invitedRoleIds: string[];
  onInvitedChange: (ids: string[]) => void;
  onApprove: () => void;
  onSuggestChanges: () => void;
  loading?: boolean;
};

export function ChatProposalCard({
  proposal,
  invitedRoleIds,
  onInvitedChange,
  onApprove,
  onSuggestChanges,
  loading = false,
}: Props) {
  const invitedSet = new Set(invitedRoleIds);
  const canStart = invitedRoleIds.length >= MIN_ROLES;

  const toggleInvite = (roleId: string) => {
    if (invitedSet.has(roleId)) {
      onInvitedChange(invitedRoleIds.filter((id) => id !== roleId));
    } else {
      onInvitedChange([...invitedRoleIds, roleId]);
    }
  };

  return (
    <>
      <ChatParticipantTurn
        avatar={<ChairAvatar size="md" />}
        title="Chair"
        subtitle="Facilitator"
      >
        <p className="mt-2 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {proposal.chairMessage}
        </p>
      </ChatParticipantTurn>

      <li className="flex justify-start py-1 pl-12">
        <div className="w-full max-w-[min(32rem,92%)] space-y-3">
          <div className="space-y-2 rounded-lg border border-zinc-200 bg-white/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/50">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Proposed goal
            </p>
            <p className="text-sm text-zinc-900 dark:text-zinc-100">{proposal.meetingGoal}</p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Suggested experts — tap Invite
            </p>
            <ul className="space-y-2">
              {proposal.roles.map((r) => (
                <ExpertInviteCard
                  key={r.id}
                  role={r}
                  invited={invitedSet.has(r.id)}
                  onToggleInvite={() => toggleInvite(r.id)}
                  disabled={loading}
                />
              ))}
            </ul>
            {!canStart ? (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Invite at least {MIN_ROLES} experts to start.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !canStart}
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
    </>
  );
}
