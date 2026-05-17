"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

import {
  clampFloatingToViewport,
  type FloatingAnchor,
  type FloatingPlacement,
} from "@/lib/floating-viewport";

export function useFloatingViewportPosition(
  anchor: FloatingAnchor | null,
  preferred: FloatingPlacement,
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  /** Re-run when floating content changes size (e.g. loaded text). */
  contentKey = "",
): { left: number; top: number } | null {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!active || !anchor) {
      setPosition(null);
      return;
    }

    const update = () => {
      const el = ref.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 && height === 0) {
        requestAnimationFrame(update);
        return;
      }
      const next = clampFloatingToViewport(anchor, { width, height }, preferred);
      setPosition({ left: next.left, top: next.top });
    };

    update();

    const el = ref.current;
    const ro =
      el && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    ro?.observe(el);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, anchor, preferred, ref, contentKey]);

  return position;
}
