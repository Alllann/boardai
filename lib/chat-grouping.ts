import type { ThreadItem } from "@/lib/schemas";

export type ChatGroupFlags = {
  showAvatar: boolean;
  showName: boolean;
};

export function getThreadSpeaker(item: ThreadItem): string | null {
  switch (item.kind) {
    case "user":
      return "owner";
    case "chair":
    case "status":
      return "chair";
    case "expert":
      return `expert:${item.roleId}`;
    default:
      return null;
  }
}

export function getGroupFlags(
  speakers: (string | null)[],
  index: number,
): ChatGroupFlags {
  const speaker = speakers[index] ?? null;
  if (!speaker) {
    return { showAvatar: true, showName: true };
  }
  const prev = index > 0 ? speakers[index - 1] : null;
  const grouped = prev === speaker;
  return { showAvatar: !grouped, showName: !grouped };
}

export function getContinuationFlags(lastSpeaker: string | null, speaker: string): ChatGroupFlags {
  const grouped = lastSpeaker === speaker;
  return { showAvatar: !grouped, showName: !grouped };
}
