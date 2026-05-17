export const FLOATING_VIEWPORT_MARGIN = 12;

export type FloatingAnchor = { x: number; y: number };
export type FloatingSize = { width: number; height: number };
export type FloatingPlacement = "above" | "below";

/** Top-left position that keeps a floating box fully inside the viewport. */
export function clampFloatingToViewport(
  anchor: FloatingAnchor,
  size: FloatingSize,
  preferred: FloatingPlacement,
  gap = 8,
  margin = FLOATING_VIEWPORT_MARGIN,
): { left: number; top: number; placement: FloatingPlacement } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let placement = preferred;
  let top =
    placement === "above"
      ? anchor.y - size.height - gap
      : anchor.y + gap;

  if (placement === "below" && top + size.height > vh - margin) {
    const aboveTop = anchor.y - size.height - gap;
    if (aboveTop >= margin) placement = "above";
  }
  if (placement === "above" && top < margin) {
    const belowTop = anchor.y + gap;
    if (belowTop + size.height <= vh - margin) placement = "below";
  }

  top =
    placement === "above"
      ? anchor.y - size.height - gap
      : anchor.y + gap;
  top = Math.max(margin, Math.min(top, vh - margin - size.height));

  let left = anchor.x - size.width / 2;
  left = Math.max(margin, Math.min(left, vw - margin - size.width));

  return { left, top, placement };
}
