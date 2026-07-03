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
  subtitle,
  children,
  className = "",
  showAvatar = true,
  showName = true,
}: Props) {
  return (
    <li className={`flex items-end gap-2.5 ${showName ? "py-1.5" : "py-0.5"} ${className}`}>
      <div className="flex h-8 w-8 shrink-0 items-end justify-center pb-0.5">
        {showAvatar ? avatar : null}
      </div>
      <div className="min-w-0 max-w-[min(48rem,92%)]">
        {showName ? (
          <p className="mb-1 px-1 text-[11px] text-[var(--text-tertiary)]">
            {title}
            {subtitle ? ` · ${subtitle}` : ""}
          </p>
        ) : null}
        <div className="inline-block max-w-full rounded-[var(--radius-bubble)] rounded-bl-md bg-[var(--peer-msg-bg)] px-4 py-2.5 text-[15px] leading-relaxed text-[var(--text-primary)]">
          {children}
        </div>
      </div>
    </li>
  );
}
