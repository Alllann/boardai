"use client";

import type { ReactNode } from "react";

type Props = {
  avatar: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  showAvatar?: boolean;
  showName?: boolean;
};

export function ChatParticipantTurn({
  avatar,
  title,
  subtitle = "Board seat",
  children,
  className = "",
  showAvatar = true,
  showName = true,
}: Props) {
  return (
    <li className={`flex items-start gap-3 ${showName ? "py-0.5" : "py-0"} ${className}`}>
      <div className="flex h-9 w-9 shrink-0 items-start justify-center">
        {showAvatar ? avatar : null}
      </div>
      <div className="min-w-0 max-w-[min(36rem,92%)]">
        {showName ? (
          <div className="mb-1 px-0.5">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
            {subtitle ? (
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {subtitle}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
          {children}
        </div>
      </div>
    </li>
  );
}
