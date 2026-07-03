"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { id: "brief", label: "Reading your brief", delayMs: 0 },
  { id: "experts", label: "Matching expert perspectives", delayMs: 2500 },
  { id: "roster", label: "Drafting your board roster", delayMs: 6000 },
  { id: "proposal", label: "Preparing the session plan", delayMs: 10000 },
] as const;

type Props = {
  visible: boolean;
};

export function BoardKickoffProgress({ visible }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!visible) {
      setActiveIndex(0);
      return;
    }

    const timers = STEPS.slice(1).map((step, i) =>
      window.setTimeout(() => setActiveIndex(i + 1), step.delayMs),
    );

    return () => timers.forEach(clearTimeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <li className="flex justify-start py-1 pl-11">
      <div className="max-w-md space-y-2 rounded-2xl bg-[var(--surface-raised)] px-4 py-3">
        <p className="text-xs text-[var(--text-tertiary)]">Setting up your session</p>
        <ul className="space-y-1.5" aria-live="polite">
          {STEPS.map((step, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            return (
              <li
                key={step.id}
                className={`flex items-center gap-2 text-xs transition-opacity ${
                  i > activeIndex ? "opacity-35" : "opacity-100"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    done
                      ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                      : active
                        ? "border border-[var(--border-medium)]"
                        : "border border-[var(--border-light)]"
                  }`}
                  aria-hidden
                >
                  {done ? "✓" : active ? (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--text-secondary)]" />
                  ) : null}
                </span>
                <span
                  className={
                    active
                      ? "text-[var(--text-primary)]"
                      : done
                        ? "text-[var(--text-secondary)]"
                        : "text-[var(--text-tertiary)]"
                  }
                >
                  {step.label}
                  {active ? "…" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}
