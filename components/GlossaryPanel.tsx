"use client";

import { useState } from "react";

import type { GlossaryEntry } from "@/lib/schemas";

type Props = {
  entries: GlossaryEntry[];
  defaultOpen?: boolean;
};

export function GlossaryPanel({ entries, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  if (entries.length === 0) return null;

  if (defaultOpen) {
    return (
      <ul className="space-y-4">
        {entries.map((e, i) => (
          <li key={`${e.phrase}-${i}`}>
            <span className="text-xs font-medium text-[var(--text-primary)]">{e.phrase}</span>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {e.explanation}
            </p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--surface-raised)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        aria-expanded={open}
      >
        Glossary ({entries.length})
        <span aria-hidden className="text-[var(--text-tertiary)]">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <ul className="space-y-3 border-t border-[var(--border-light)] px-3 py-3">
          {entries.map((e, i) => (
            <li key={`${e.phrase}-${i}`}>
              <span className="text-xs font-medium text-[var(--text-primary)]">{e.phrase}</span>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                {e.explanation}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
