"use client";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import type { MeetingPlan } from "@/lib/schemas";

type Props = {
  roles: MeetingPlan["roles"];
};

export function RoleLegend({ roles }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((r) => (
        <div
          key={r.id}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200"
        >
          <ExpertAvatar role={r} size="sm" />
          {r.title}
        </div>
      ))}
    </div>
  );
}
