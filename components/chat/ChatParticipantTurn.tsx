"use client";

import type { ReactNode } from "react";

type Props = {
  avatar: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function ChatParticipantTurn({
  avatar,
  title,
  subtitle = "Board seat",
  children,
  className = "",
}: Props) {
  return (
    <li className={`flex items-start gap-3 py-0.5 ${className}`}>
      <div className="shrink-0">{avatar}</div>
      <div className="max-w-[min(36rem,92%)] rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
          {subtitle ? (
            <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </li>
  );
}
