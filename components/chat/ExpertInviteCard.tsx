"use client";

import { useEffect, useRef, useState } from "react";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import type { MeetingPlan } from "@/lib/schemas";

type Role = MeetingPlan["roles"][number];

type Props = {
  role: Role;
  invited: boolean;
  onToggleInvite: () => void;
  disabled?: boolean;
};

export function ExpertInviteCard({
  role,
  invited,
  onToggleInvite,
  disabled = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const backgroundRef = useRef<HTMLParagraphElement>(null);
  const mandateRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (expanded) return;

    const check = () => {
      const bgEl = backgroundRef.current;
      const mandateEl = mandateRef.current;
      const bgTruncated = bgEl ? bgEl.scrollHeight > bgEl.clientHeight + 1 : false;
      const mandateTruncated = mandateEl
        ? mandateEl.scrollHeight > mandateEl.clientHeight + 1
        : false;
      setNeedsExpand(bgTruncated || mandateTruncated);
    };

    check();
    const observer = new ResizeObserver(check);
    if (backgroundRef.current) observer.observe(backgroundRef.current);
    if (mandateRef.current) observer.observe(mandateRef.current);
    return () => observer.disconnect();
  }, [role.background, role.mandate, expanded]);

  return (
    <article
      className={`flex h-full w-[min(20rem,calc(100%-0.5rem))] shrink-0 snap-center flex-col rounded-[var(--radius-soft)] p-4 transition-colors sm:w-[min(22rem,48%)] lg:w-[min(24rem,32%)] ${
        invited
          ? "bg-[var(--surface-raised)]"
          : "bg-[var(--peer-msg-bg)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <ExpertAvatar role={role} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">{role.title}</p>
          {role.background ? (
            <p
              ref={backgroundRef}
              className={`mt-0.5 text-xs leading-snug text-[var(--text-secondary)] ${
                expanded ? "" : "line-clamp-2"
              }`}
            >
              {role.background}
            </p>
          ) : null}
        </div>
      </div>
      <p
        ref={mandateRef}
        className={`mt-2 text-xs leading-relaxed text-[var(--text-tertiary)] ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {role.mandate}
      </p>
      {needsExpand || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 self-start text-xs text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleInvite}
        aria-pressed={invited}
        className={`mt-3 w-full rounded-full px-3 py-2 text-xs font-medium transition disabled:opacity-40 ${
          invited
            ? "bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90"
            : "bg-[var(--surface-invite-btn)] text-[var(--text-primary)] hover:opacity-90"
        }`}
      >
        {invited ? "Invited" : "Invite"}
      </button>
    </article>
  );
}
