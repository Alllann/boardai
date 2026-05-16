"use client";

import { useState } from "react";

import type { GlossaryEntry } from "@/lib/schemas";

type Props = {
  entries: GlossaryEntry[];
};

export function GlossaryPanel({ entries }: Props) {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-950/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        aria-expanded={open}
      >
        Glossary ({entries.length} term{entries.length === 1 ? "" : "s"})
        <span aria-hidden>{open ? "▾" : "▸"}</span>
      </button>
      {open ? (
        <ul className="space-y-2 border-t border-zinc-200 px-3 py-2 dark:border-zinc-700">
          {entries.map((e, i) => (
            <li key={`${e.phrase}-${i}`} className="text-xs">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {e.phrase}
              </span>
              <p className="mt-0.5 leading-snug text-zinc-600 dark:text-zinc-400">
                {e.explanation}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
