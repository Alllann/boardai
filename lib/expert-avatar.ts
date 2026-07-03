/** Deterministic avatar styling per role id — distinct colors and shapes. */

export type ExpertAvatarStyle = {
  initials: string;
  bgClass: string;
  textClass: string;
  pattern: "circle" | "rounded" | "squircle" | "hex";
};

const AVATAR_BACKGROUNDS = [
  { bg: "bg-sky-200 dark:bg-sky-800", text: "text-sky-900 dark:text-sky-100" },
  { bg: "bg-violet-200 dark:bg-violet-800", text: "text-violet-900 dark:text-violet-100" },
  { bg: "bg-amber-200 dark:bg-amber-800", text: "text-amber-900 dark:text-amber-100" },
  { bg: "bg-emerald-200 dark:bg-emerald-800", text: "text-emerald-900 dark:text-emerald-100" },
  { bg: "bg-rose-200 dark:bg-rose-800", text: "text-rose-900 dark:text-rose-100" },
  { bg: "bg-teal-200 dark:bg-teal-800", text: "text-teal-900 dark:text-teal-100" },
  { bg: "bg-indigo-200 dark:bg-indigo-800", text: "text-indigo-900 dark:text-indigo-100" },
  { bg: "bg-orange-200 dark:bg-orange-800", text: "text-orange-900 dark:text-orange-100" },
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
