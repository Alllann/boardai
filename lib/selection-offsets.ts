/** Character offsets of a DOM range within `root` (same as root.textContent order). */
export function selectionOffsetsInRoot(
  root: HTMLElement,
  range: Range,
): { start: number; end: number } | null {
  if (!root.contains(range.commonAncestorContainer)) return null;

  const startRange = document.createRange();
  startRange.selectNodeContents(root);
  startRange.setEnd(range.startContainer, range.startOffset);
  const start = startRange.toString().length;
  const end = start + range.toString().length;
  if (end <= start) return null;
  return { start, end };
}
