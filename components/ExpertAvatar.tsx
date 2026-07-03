"use client";

import {
  avatarShapeClass,
  expertTooltipSummary,
  getExpertAvatarStyle,
} from "@/lib/expert-avatar";
import type { MeetingPlan } from "@/lib/schemas";

type Role = MeetingPlan["roles"][number];

type Props = {
  role: Pick<Role, "id" | "title" | "mandate"> & { background?: string };
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-10 w-10 text-xs",
} as const;

export function ExpertAvatar({ role, size = "md", onClick, className = "" }: Props) {
  const style = getExpertAvatarStyle(role.id, role.title);
  const shape = avatarShapeClass(style.pattern);
  const tooltip = expertTooltipSummary(role.title, role.background, role.mandate);

  const inner = (
    <span
      className={`flex shrink-0 items-center justify-center font-medium ${shape} ${style.bgClass} ${style.textClass} ${SIZE_CLASSES[size]} ${className}`}
      aria-hidden={!onClick}
    >
      {style.initials}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        title={tooltip}
        aria-label={`View profile: ${role.title}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <span title={tooltip} className="shrink-0">
      {inner}
    </span>
  );
}
