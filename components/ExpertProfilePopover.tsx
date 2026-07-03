"use client";

import { useEffect, useRef } from "react";

import { ExpertAvatar } from "@/components/ExpertAvatar";
import type { MeetingPlan } from "@/lib/schemas";

type Role = MeetingPlan["roles"][number];

type Props = {
  role: Role;
  open: boolean;
  onClose: () => void;
};

export function ExpertProfilePopover({ role, open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`${role.title} profile`}
      className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-[var(--border-light)] bg-[var(--surface-raised)] p-4"
    >
      <div className="flex items-start gap-3">
        <ExpertAvatar role={role} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">{role.title}</p>
          <p className="text-xs text-[var(--text-tertiary)]">Expert</p>
        </div>
      </div>

      {role.background ? (
        <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
          {role.background}
        </p>
      ) : null}

      <div className="mt-3 border-t border-[var(--border-light)] pt-3">
        <p className="text-xs font-medium text-[var(--text-tertiary)]">Mandate</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
          {role.mandate}
        </p>
      </div>
    </div>
  );
}
