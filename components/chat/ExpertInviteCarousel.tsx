"use client";

import { useCallback, useRef, useState } from "react";

import { ExpertInviteCard } from "@/components/chat/ExpertInviteCard";
import type { MeetingPlan } from "@/lib/schemas";

type Role = MeetingPlan["roles"][number];

type Props = {
  roles: Role[];
  invitedRoleIds: string[];
  onToggleInvite: (roleId: string) => void;
  disabled?: boolean;
};

export function ExpertInviteCarousel({
  roles,
  invitedRoleIds,
  onToggleInvite,
  disabled = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const invitedSet = new Set(invitedRoleIds);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || roles.length === 0) return;
    const cardWidth = el.firstElementChild?.clientWidth ?? 1;
    const gap = 12;
    const index = Math.round(el.scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(Math.max(index, 0), roles.length - 1));
  }, [roles.length]);

  const scrollToIndex = (index: number) => {
    const el = scrollRef.current;
    if (!el || roles.length === 0) return;
    const child = el.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(index);
  };

  const scrollByCard = (direction: -1 | 1) => {
    scrollToIndex(Math.min(Math.max(activeIndex + direction, 0), roles.length - 1));
  };

  if (roles.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Suggested experts
        </p>
        {roles.length > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={activeIndex === 0}
              aria-label="Previous expert"
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={activeIndex >= roles.length - 1}
              aria-label="Next expert"
              className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative -mx-1">
        <div
          ref={scrollRef}
          onScroll={updateActiveIndex}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 scrollbar-thin"
        >
          {roles.map((role) => (
            <ExpertInviteCard
              key={role.id}
              role={role}
              invited={invitedSet.has(role.id)}
              onToggleInvite={() => onToggleInvite(role.id)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      {roles.length > 1 ? (
        <div className="flex justify-center gap-1.5" role="tablist" aria-label="Expert carousel">
          {roles.map((role, i) => (
            <button
              key={role.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`${role.title}${invitedSet.has(role.id) ? ", invited" : ""}`}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === activeIndex
                  ? "w-4 bg-zinc-600 dark:bg-zinc-300"
                  : "w-1.5 bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
