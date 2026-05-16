"use client";

import { getRolePalette } from "@/lib/role-colors";
import type { MeetingPlan } from "@/lib/schemas";

type Props = {
  roles: MeetingPlan["roles"];
};

export function RoleLegend({ roles }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((r) => {
        const palette = getRolePalette(r.id);
        return (
          <div
            key={r.id}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${palette.border} ${palette.chip}`}
          >
            {r.title}
          </div>
        );
      })}
    </div>
  );
}
