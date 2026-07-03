"use client";

import { GlossaryPanel } from "@/components/GlossaryPanel";
import type { GlossaryEntry } from "@/lib/schemas";

type Props = {
  entries: GlossaryEntry[];
  expanded: boolean;
  onToggle: () => void;
};

export function GlossarySidebarRail({ entries, expanded, onToggle }: Props) {
  if (expanded) return null;

  return (
    <aside className="hidden h-full w-11 shrink-0 flex-col bg-[var(--sidebar-surface)] md:flex">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex flex-1 flex-col items-center justify-start gap-1 px-1 py-4 text-[var(--text-tertiary)] transition hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-secondary)]"
        aria-label={`Open glossary (${entries.length} terms)`}
        title="Glossary"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        {entries.length > 0 ? (
          <span className="text-[10px] font-medium tabular-nums text-[var(--text-secondary)]">
            {entries.length}
          </span>
        ) : null}
      </button>
    </aside>
  );
}

export function GlossarySidebar({ entries, expanded, onToggle }: Props) {
  if (!expanded) return null;

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col bg-[var(--sidebar-surface)] md:flex">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-[13px] font-medium tracking-tight text-[var(--text-primary)]">
          Glossary
        </h2>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-secondary)]"
          aria-label="Collapse glossary"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {entries.length > 0 ? (
          <GlossaryPanel entries={entries} defaultOpen />
        ) : (
          <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
            Terms appear as the discussion unfolds.
          </p>
        )}
      </div>
    </aside>
  );
}
