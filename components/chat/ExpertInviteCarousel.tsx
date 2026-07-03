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
        <p className="text-xs font-medium text-[var(--text-tertiary)]">Suggested experts</p>
        {roles.length > 1 ? (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={activeIndex === 0}
              aria-label="Previous expert"
              className="rounded-md p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={activeIndex >= roles.length - 1}
              aria-label="Next expert"
              className="rounded-md p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={updateActiveIndex}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              className={`h-1 rounded-full transition-all ${
                i === activeIndex
                  ? "w-3 bg-[var(--text-primary)]"
                  : "w-1 bg-[var(--border-medium)]"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
