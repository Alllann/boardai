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
      className={`flex h-full w-[min(17.5rem,78vw)] shrink-0 snap-center flex-col rounded-xl border p-3 transition-colors ${
        invited
          ? "border-emerald-300/80 bg-emerald-50/90 dark:border-emerald-800/50 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white/95 dark:border-zinc-700 dark:bg-zinc-950/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <ExpertAvatar role={role} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {role.title}
          </p>
          {role.background ? (
            <p
              ref={backgroundRef}
              className={`mt-0.5 text-xs leading-snug text-zinc-600 dark:text-zinc-400 ${
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
        className={`mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {role.mandate}
      </p>
      {needsExpand || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 self-start text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={onToggleInvite}
        aria-pressed={invited}
        className={`mt-3 w-full rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
          invited
            ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        }`}
      >
        {invited ? "Invited" : "Invite"}
      </button>
    </article>
  );
}
