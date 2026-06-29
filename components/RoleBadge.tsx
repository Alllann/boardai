"use client";

import { useState } from "react";

import type { MeetingPlan } from "@/lib/schemas";

type Role = MeetingPlan["roles"][number];

type Props = {
  role: Role;
  compact?: boolean;
};

export function RoleBadge({ role, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const mandateLong = role.mandate.length > 120;

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {role.title}
        </span>
      </div>
      {!compact ? (
        <p
          className={`mt-1 text-xs leading-snug text-zinc-600 dark:text-zinc-400 ${
            expanded ? "" : "line-clamp-2"
          }`}
        >
          {role.background ? (
            <>
              <span className="font-medium text-zinc-500 dark:text-zinc-500">Background: </span>
              {role.background}
            </>
          ) : (
            <>
              <span className="font-medium text-zinc-500 dark:text-zinc-500">Mandate: </span>
              {role.mandate}
            </>
          )}
        </p>
      ) : null}
      {!compact && mandateLong && !role.background ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 text-xs text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          {expanded ? "Show less" : "Show full mandate"}
        </button>
      ) : null}
    </div>
  );
}
