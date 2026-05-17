"use client";

import { useState } from "react";

const EXPLANATIONS_EXPANDED_KEY = "boardai-explanations-expanded";

function readExpandedPreference(): boolean {
  try {
    return sessionStorage.getItem(EXPLANATIONS_EXPANDED_KEY) !== "0";
  } catch {
    return true;
  }
}

type Props = {
  explanation: string;
  showToggle: boolean;
};

export function PlainLanguageBlock({ explanation, showToggle }: Props) {
  const [expanded, setExpanded] = useState(readExpandedPreference);

  const toggle = () => {
    setExpanded((v) => {
      const next = !v;
      try {
        sessionStorage.setItem(EXPLANATIONS_EXPANDED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (!explanation.trim()) return null;

  return (
    <div className="mt-3 border-l-2 border-zinc-300 pl-3 dark:border-zinc-600">
      {showToggle ? (
        <button
          type="button"
          onClick={toggle}
          className="mb-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          aria-expanded={expanded}
        >
          Plain-language explanation
          <span className="ml-1">{expanded ? "▾" : "▸"}</span>
        </button>
      ) : (
        <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Plain-language explanation
        </p>
      )}
      {expanded || !showToggle ? (
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          {explanation}
        </p>
      ) : null}
    </div>
  );
}
