"use client";

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
} as const;

type Props = {
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
};

export function ChairAvatar({ size = "md", onClick, className = "" }: Props) {
  const inner = (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-amber-200 font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100 ${SIZE_CLASSES[size]} ${className}`}
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
        className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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
