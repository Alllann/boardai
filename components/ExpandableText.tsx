"use client";

import { useEffect, useRef, useState } from "react";

const LINE_CLAMP: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

type Props = {
  text: string;
  lines?: number;
  className?: string;
  buttonClassName?: string;
};

export function ExpandableText({
  text,
  lines = 3,
  className = "",
  buttonClassName = "",
}: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;

    const check = () => {
      setTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded, lines]);

  const clampClass = LINE_CLAMP[lines] ?? "line-clamp-3";

  return (
    <div>
      <p ref={ref} className={`${expanded ? "" : clampClass} ${className}`.trim()}>
        {text}
      </p>
      {truncated || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={
            buttonClassName ||
            "mt-1 text-xs text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
          }
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
