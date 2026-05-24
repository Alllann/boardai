"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  onMenuClick?: () => void;
  actions?: ReactNode;
};

export function ThreadHeader({ title, onMenuClick, actions }: Props) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-[var(--border-light)] bg-[var(--main-surface)]/90 px-3 py-2.5 backdrop-blur">
      {onMenuClick ? (
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] md:hidden"
          aria-label="Open sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      ) : null}
      <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
        {title}
      </h1>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  );
}
