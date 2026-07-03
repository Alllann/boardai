"use client";

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-8 w-8 text-[11px]",
  lg: "h-10 w-10 text-xs",
} as const;

type Props = {
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
};

export function ChairAvatar({ size = "md", onClick, className = "" }: Props) {
  const inner = (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] font-medium text-[var(--text-primary)] ${SIZE_CLASSES[size]} ${className}`}
      aria-hidden={!onClick}
    >
      C
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        title="Chair — meeting facilitator"
        aria-label="View Chair profile"
      >
        {inner}
      </button>
    );
  }

  return (
    <span title="Chair — meeting facilitator" className="shrink-0">
      {inner}
    </span>
  );
}
