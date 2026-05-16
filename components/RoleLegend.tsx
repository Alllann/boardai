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
        const mandateShort =
          r.mandate.length > 72 ? `${r.mandate.slice(0, 69)}…` : r.mandate;
        return (
          <div
            key={r.id}
            title={r.mandate}
            className={`max-w-xs rounded-lg border px-2.5 py-1.5 text-xs ${palette.border} ${palette.chip}`}
          >
            <span className="font-medium">{r.title}</span>
            <span className="text-inherit/80"> — {mandateShort}</span>
          </div>
        );
      })}
    </div>
  );
}
