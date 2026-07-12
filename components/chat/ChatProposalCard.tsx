"use client";

import { ExpandableText } from "@/components/ExpandableText";
import { ChairAvatar } from "@/components/ChairAvatar";
import { ChatParticipantTurn } from "@/components/chat/ChatParticipantTurn";
import { ExpertInviteCarousel } from "@/components/chat/ExpertInviteCarousel";
import { MIN_ROLES } from "@/lib/board-constants";
import type { MeetingProposal } from "@/lib/schemas";

type Props = {
  proposal: MeetingProposal;
  invitedRoleIds: string[];
  onInvitedChange?: (ids: string[]) => void;
  onApprove?: () => void;
  onSuggestChanges?: () => void;
  loading?: boolean;
  locked?: boolean;
};

export function ChatProposalCard({
  proposal,
  invitedRoleIds,
  onInvitedChange,
  onApprove,
  onSuggestChanges,
  loading = false,
  locked = false,
}: Props) {
  const canStart = invitedRoleIds.length >= MIN_ROLES;
  const interactionsDisabled = loading || locked;

  const toggleInvite = (roleId: string) => {
    if (interactionsDisabled || !onInvitedChange) return;
    const invitedSet = new Set(invitedRoleIds);
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
        <ExpandableText
          text={proposal.chairMessage}
          lines={3}
          className="text-[var(--text-secondary)]"
        />
        <div className="mt-3">
          <p className="text-xs font-medium text-[var(--text-tertiary)]">Goal</p>
          <ExpandableText
            text={proposal.meetingGoal}
            lines={2}
            className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]"
          />
        </div>
      </ChatParticipantTurn>

      <li className="w-full py-2">
        <div className="w-full space-y-3">
          <ExpertInviteCarousel
            roles={proposal.roles}
            invitedRoleIds={invitedRoleIds}
            onToggleInvite={toggleInvite}
            disabled={interactionsDisabled}
          />

          {!locked && !canStart ? (
            <p className="text-xs text-[var(--text-tertiary)]">
              Invite at least {MIN_ROLES} experts to start.
            </p>
          ) : null}

          {locked ? (
            <p className="text-xs text-[var(--text-tertiary)]">
              {invitedRoleIds.length} expert{invitedRoleIds.length === 1 ? "" : "s"} invited ·
              session started
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={interactionsDisabled || !canStart}
                onClick={onApprove}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-[var(--accent-fg)] transition hover:opacity-90 disabled:opacity-40"
              >
                Start session
              </button>
              <button
                type="button"
                disabled={interactionsDisabled}
                onClick={onSuggestChanges}
                className="rounded-full bg-[var(--surface-raised)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                Suggest changes
              </button>
            </div>
          )}
        </div>
      </li>
    </>
  );
}
