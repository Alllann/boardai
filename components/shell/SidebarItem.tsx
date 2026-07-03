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
      title={title}
      className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-[var(--sidebar-hover)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]"
      }`}
    >
      {running ? (
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[var(--text-secondary)]" aria-hidden />
      ) : (
        <span className="h-1.5 w-1.5 shrink-0" aria-hidden />
      )}
      <span className="truncate font-normal">{title}</span>
    </button>
  );
}
