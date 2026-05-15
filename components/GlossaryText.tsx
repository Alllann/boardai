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
              className="cursor-help border-b border-dotted border-zinc-500 text-inherit decoration-zinc-500 underline-offset-2 outline-none hover:border-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-400 dark:hover:border-zinc-300"
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
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-normal leading-snug text-zinc-800 shadow-lg dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <span className="mb-0.5 block font-semibold text-zinc-600 dark:text-zinc-300">
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
