/** Deterministic avatar styling per role id — muted neutrals, distinct shapes. */

export type ExpertAvatarStyle = {
  initials: string;
  bgClass: string;
  textClass: string;
  pattern: "circle" | "rounded" | "squircle" | "hex";
};

const AVATAR_BACKGROUNDS = [
  { bg: "bg-zinc-200 dark:bg-zinc-700", text: "text-zinc-700 dark:text-zinc-200" },
  { bg: "bg-stone-200 dark:bg-stone-700", text: "text-stone-700 dark:text-stone-200" },
  { bg: "bg-neutral-300 dark:bg-neutral-600", text: "text-neutral-800 dark:text-neutral-100" },
  { bg: "bg-slate-200 dark:bg-slate-700", text: "text-slate-700 dark:text-slate-200" },
  { bg: "bg-gray-200 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-200" },
  { bg: "bg-zinc-300 dark:bg-zinc-600", text: "text-zinc-800 dark:text-zinc-100" },
] as const;

const AVATAR_PATTERNS = ["circle", "rounded", "squircle", "hex"] as const;

function hashRoleId(roleId: string): number {
  let h = 0;
  for (let i = 0; i < roleId.length; i++) {
    h = (h * 31 + roleId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getInitialsFromTitle(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

export function getExpertAvatarStyle(roleId: string, title: string): ExpertAvatarStyle {
  const h = hashRoleId(roleId);
  const palette = AVATAR_BACKGROUNDS[h % AVATAR_BACKGROUNDS.length]!;
  const pattern = AVATAR_PATTERNS[h % AVATAR_PATTERNS.length]!;
  return {
    initials: getInitialsFromTitle(title),
    bgClass: palette.bg,
    textClass: palette.text,
    pattern,
  };
}

export function avatarShapeClass(pattern: ExpertAvatarStyle["pattern"]): string {
  switch (pattern) {
    case "circle":
      return "rounded-full";
    case "rounded":
      return "rounded-lg";
    case "squircle":
      return "rounded-xl";
    case "hex":
      return "rounded-md rotate-0";
    default:
      return "rounded-full";
  }
}

export function expertTooltipSummary(
  title: string,
  background?: string,
  mandate?: string,
): string {
  const snippet = background?.trim() || mandate?.trim() || "";
  if (!snippet) return title;
  const short = snippet.length > 80 ? `${snippet.slice(0, 79).trimEnd()}…` : snippet;
  return `${title} — ${short}`;
}
