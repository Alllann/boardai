"use client";

import { GlossaryPanel } from "@/components/GlossaryPanel";
import type { GlossaryEntry } from "@/lib/schemas";

type Props = {
  entries: GlossaryEntry[];
};

export function ChatGlossaryMessage({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <li className="flex justify-center py-1">
      <div className="w-full max-w-[min(32rem,92%)]">
        <GlossaryPanel entries={entries} />
      </div>
    </li>
  );
}
