"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  onMenuClick?: () => void;
  actions?: ReactNode;
  minimal?: boolean;
};

export function ThreadHeader({ title, onMenuClick, actions, minimal = false }: Props) {
  return (
    <header
      className={`flex shrink-0 items-center gap-2 px-4 py-3 ${
        minimal ? "" : "border-b border-[var(--border-light)]"
      }`}
    >
      {onMenuClick ? (
        <button
          type="button"
          onClick={onMenuClick}
          className="-ml-1 rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] md:hidden"
          aria-label="Open sidebar"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      ) : null}
      <h1
        className={`min-w-0 flex-1 truncate tracking-tight text-[var(--text-primary)] ${
          minimal ? "text-center text-sm font-normal text-[var(--text-tertiary)] md:text-left" : "text-[13px] font-medium"
        }`}
      >
        {title}
      </h1>
      {actions ? (
        <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
      ) : minimal && onMenuClick ? (
        <span className="w-8 md:hidden" aria-hidden />
      ) : null}
    </header>
  );
}
