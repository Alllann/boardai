"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "default" | "status";
};

export function ChatSystemBubble({ children, variant = "default" }: Props) {
  return (
    <li className="flex justify-center px-2 py-1">
      <div
        className={
          variant === "status"
            ? "max-w-[min(28rem,90%)] rounded-full bg-zinc-200/80 px-3 py-1.5 text-center text-[11px] text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400"
            : "max-w-[min(32rem,92%)] rounded-2xl border border-zinc-200/80 bg-zinc-100/90 px-3 py-2 text-center text-xs leading-relaxed text-zinc-600 dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:text-zinc-400"
        }
      >
        {children}
      </div>
    </li>
  );
}
