"use client";

type Props = {
  title: string;
  active: boolean;
  running?: boolean;
  onClick: () => void;
};

export function SidebarItem({ title, active, running, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
        active
          ? "bg-[var(--surface-hover)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      {running ? (
        <span
          className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500"
          aria-hidden
        />
      ) : (
        <span className="h-2 w-2 shrink-0" aria-hidden />
      )}
      <span className="truncate">{title}</span>
    </button>
  );
}
