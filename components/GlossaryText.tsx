"use client";

import { useId, useMemo, useState } from "react";

import { buildGlossarySegments } from "@/lib/glossary-segments";
import type { GlossaryEntry } from "@/lib/schemas";

type Props = {
  text: string;
  entries: GlossaryEntry[];
  className?: string;
};

export function GlossaryText({ text, entries, className }: Props) {
  const baseId = useId();
  const segments = useMemo(
    () => buildGlossarySegments(text, entries),
    [text, entries],
  );
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.kind === "plain") {
          return <span key={`p-${i}`}>{seg.text}</span>;
        }
        const key = `${baseId}-term-${i}`;
        const isOpen = openKey === key;
        return (
          <span key={`${baseId}-wrap-${i}`} className="relative inline">
            <span
              role="button"
              tabIndex={0}
              aria-describedby={isOpen ? `${key}-tip` : undefined}
              className="cursor-help border-b border-dotted border-[var(--text-tertiary)] text-inherit underline-offset-2 outline-none hover:border-[var(--text-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              onMouseEnter={() => setOpenKey(key)}
              onMouseLeave={() => setOpenKey((k) => (k === key ? null : k))}
              onFocus={() => setOpenKey(key)}
              onBlur={() => setOpenKey((k) => (k === key ? null : k))}
            >
              {seg.text}
            </span>
            {isOpen ? (
              <span
                id={`${key}-tip`}
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-[var(--border-light)] bg-[var(--surface-raised)] px-3 py-2 text-left text-xs font-normal leading-snug text-[var(--text-secondary)]"
              >
                <span className="mb-0.5 block font-medium text-[var(--text-primary)]">
                  {seg.phrase}
                </span>
                {seg.explanation}
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
