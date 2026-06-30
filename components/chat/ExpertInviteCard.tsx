"use client";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import type { MeetingPlan } from "@/lib/schemas";

type Role = MeetingPlan["roles"][number];

type Props = {
  role: Role;
  invited: boolean;
  onToggleInvite: () => void;
  disabled?: boolean;
};

export function ExpertInviteCard({ role, invited, onToggleInvite, disabled = false }: Props) {
  return (
    <li
      className={`relative flex gap-2.5 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
        invited
          ? "border-emerald-300/80 bg-emerald-50/90 dark:border-emerald-800/50 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white/90 dark:border-zinc-700 dark:bg-zinc-950/50"
      }`}
    >
      <ExpertAvatar role={role} size="sm" />
      <div className="min-w-0 flex-1 pr-16">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">{role.title}</p>
        {role.background ? (
          <p className="mt-0.5 leading-snug text-zinc-600 dark:text-zinc-400">{role.background}</p>
        ) : null}
        <p className="mt-0.5 leading-snug text-zinc-500 dark:text-zinc-500">{role.mandate}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleInvite}
        aria-pressed={invited}
        className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors disabled:opacity-50 ${
          invited
            ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        }`}
      >
        {invited ? "Invited" : "Invite"}
      </button>
    </li>
  );
}
