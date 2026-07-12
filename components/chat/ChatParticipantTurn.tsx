"use client";

import type { ReactNode } from "react";

type Props = {
  avatar: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showAvatar?: boolean;
  showName?: boolean;
};

export function ChatParticipantTurn({
  avatar,
  title,
  subtitle,
  children,
  className = "",
  contentClassName,
  showAvatar = true,
  showName = true,
}: Props) {
  const bubbleTail = showAvatar ? "rounded-tl-md" : "";
  const bubbleClass =
    contentClassName ??
    `inline-block max-w-full rounded-[var(--radius-bubble)] bg-[var(--peer-msg-bg)] px-4 py-2.5 text-[15px] leading-relaxed text-[var(--text-primary)] ${bubbleTail}`;

  return (
    <li className={`flex items-start gap-2.5 ${showName ? "py-1.5" : "py-0.5"} ${className}`}>
      <div className="flex h-8 w-8 shrink-0 items-start justify-center pt-0.5">
        {showAvatar ? avatar : null}
      </div>
      <div className="min-w-0 flex-1 max-w-[min(48rem,92%)]">
        {showName ? (
          <p className="mb-1 px-1 text-[11px] text-[var(--text-tertiary)]">
            {title}
            {subtitle ? ` · ${subtitle}` : ""}
          </p>
        ) : null}
        <div className={bubbleClass}>{children}</div>
      </div>
    </li>
  );
}
