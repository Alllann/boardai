/** Stable accent per role id for discussion bubbles and legend chips. */
const ROLE_PALETTES = [
  {
    border: "border-sky-300 dark:border-sky-700",
    bg: "bg-sky-50/90 dark:bg-sky-950/40",
    chip: "bg-sky-100/80 text-sky-900 dark:bg-sky-900/50 dark:text-sky-100",
    dot: "bg-sky-500",
  },
  {
    border: "border-violet-300 dark:border-violet-700",
    bg: "bg-violet-50/90 dark:bg-violet-950/40",
    chip: "bg-violet-100/80 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100",
    dot: "bg-violet-500",
  },
  {
    border: "border-emerald-300 dark:border-emerald-700",
    bg: "bg-emerald-50/90 dark:bg-emerald-950/40",
    chip: "bg-emerald-100/80 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
  {
    border: "border-amber-300 dark:border-amber-700",
    bg: "bg-amber-50/90 dark:bg-amber-950/40",
    chip: "bg-amber-100/80 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  {
    border: "border-rose-300 dark:border-rose-700",
    bg: "bg-rose-50/90 dark:bg-rose-950/40",
    chip: "bg-rose-100/80 text-rose-900 dark:bg-rose-900/50 dark:text-rose-100",
    dot: "bg-rose-500",
  },
  {
    border: "border-teal-300 dark:border-teal-700",
    bg: "bg-teal-50/90 dark:bg-teal-950/40",
    chip: "bg-teal-100/80 text-teal-900 dark:bg-teal-900/50 dark:text-teal-100",
    dot: "bg-teal-500",
  },
] as const;

export type RolePalette = (typeof ROLE_PALETTES)[number];

function hashRoleId(roleId: string): number {
  let h = 0;
  for (let i = 0; i < roleId.length; i++) {
    h = (h * 31 + roleId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getRolePalette(roleId: string): RolePalette {
  return ROLE_PALETTES[hashRoleId(roleId) % ROLE_PALETTES.length]!;
}
