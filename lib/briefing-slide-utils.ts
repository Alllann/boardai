export type ParsedBriefingItem = {
  lead: string;
  detail?: string;
};

export type ParsedPlanItem = {
  dayLabel: string;
  text: string;
};

export type BriefingDensity = "compact" | "expanded";

type SlideLimits = {
  heroHeadline: number;
  quoteBody: number;
  warningBody: number;
  cardLead: number;
  cardDetail: number;
  cardSlideWeight: number;
  maxCardsPerSlide: number;
  milestoneSlideWeight: number;
  maxMilestonesPerSlide: number;
  timelineSlideWeight: number;
  maxTimelinePerSlide: number;
  timelineBody: number;
};

/** Visual density limits for the embedded briefing deck (~24rem tall). */
export const SLIDE_LIMITS: SlideLimits = {
  heroHeadline: 200,
  quoteBody: 240,
  warningBody: 240,
  cardLead: 85,
  cardDetail: 110,
  cardSlideWeight: 400,
  maxCardsPerSlide: 2,
  milestoneSlideWeight: 820,
  maxMilestonesPerSlide: 4,
  timelineSlideWeight: 320,
  maxTimelinePerSlide: 2,
  timelineBody: 100,
} as const;

/** Looser limits for the maximized deck — more content per slide. */
export const SLIDE_LIMITS_EXPANDED: SlideLimits = {
  heroHeadline: 520,
  quoteBody: 720,
  warningBody: 720,
  cardLead: 180,
  cardDetail: 360,
  cardSlideWeight: 900,
  maxCardsPerSlide: 5,
  milestoneSlideWeight: 1200,
  maxMilestonesPerSlide: 4,
  timelineSlideWeight: 860,
  maxTimelinePerSlide: 5,
  timelineBody: 280,
} as const;

export function getSlideLimits(density: BriefingDensity = "compact"): SlideLimits {
  return density === "expanded" ? SLIDE_LIMITS_EXPANDED : SLIDE_LIMITS;
}

/** Split "Lead: detail" or "Lead — detail" into scannable card parts. */
export function parseBriefingItem(text: string): ParsedBriefingItem {
  const colon = text.match(/^([^:]{3,100}):\s+([\s\S]+)$/);
  if (colon) {
    return { lead: colon[1]!.trim(), detail: colon[2]!.trim() };
  }

  const dash = text.match(/^(.{3,100})\s[—–-]\s+([\s\S]+)$/);
  if (dash) {
    return { lead: dash[1]!.trim(), detail: dash[2]!.trim() };
  }

  const trimmed = text.trim();
  if (trimmed.length > SLIDE_LIMITS.cardLead + 40) {
    const sentenceBreak = trimmed.search(/[.!?](?:\s+|$)/);
    if (sentenceBreak > 20 && sentenceBreak < 120) {
      return {
        lead: trimmed.slice(0, sentenceBreak + 1).trim(),
        detail: trimmed.slice(sentenceBreak + 1).trim(),
      };
    }
  }

  return { lead: trimmed };
}

export function parsePlanItem(text: string, index: number): ParsedPlanItem {
  const dayMatch = text.match(/^Day\s+(\d+):\s*([\s\S]+)$/i);
  if (dayMatch) {
    return { dayLabel: `Day ${dayMatch[1]}`, text: dayMatch[2]!.trim() };
  }

  return { dayLabel: `Step ${index + 1}`, text: text.trim() };
}

export function truncateAtSentence(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const punctBreak = slice.search(/[.!?](?:\s|$)/);
  if (punctBreak >= Math.floor(maxChars * 0.45)) {
    return trimmed.slice(0, punctBreak + 1).trim();
  }

  const spaceBreak = slice.lastIndexOf(" ");
  const cut = spaceBreak > 0 ? slice.slice(0, spaceBreak) : slice;
  return `${cut.trim()}…`;
}

/** Split long prose into slide-sized blocks at sentence boundaries. */
export function splitTextBlocks(text: string, maxChars: number): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return [trimmed];

  const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [trimmed];
  const blocks: string[] = [];
  let current = "";

  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length > maxChars && current) {
      blocks.push(current.trim());
      current = sentence;
    } else if (candidate.length > maxChars) {
      blocks.push(truncateAtSentence(sentence, maxChars));
      current = "";
    } else {
      current = candidate;
    }
  }

  if (current.trim()) blocks.push(current.trim());
  return blocks.length > 0 ? blocks : [truncateAtSentence(trimmed, maxChars)];
}

export function condenseBriefingItem(
  text: string,
  density: BriefingDensity = "compact",
): ParsedBriefingItem {
  const limits = getSlideLimits(density);
  const parsed = parseBriefingItem(text);
  if (density === "expanded") {
    return parsed;
  }

  // Only truncate when the model overshoots slide budgets.
  const lead =
    parsed.lead.length > limits.cardLead
      ? truncateAtSentence(parsed.lead, limits.cardLead)
      : parsed.lead;
  const detail = parsed.detail
    ? parsed.detail.length > limits.cardDetail
      ? truncateAtSentence(parsed.detail, limits.cardDetail)
      : parsed.detail
    : undefined;

  return detail ? { lead, detail } : { lead };
}

export function condensePlanText(
  text: string,
  density: BriefingDensity = "compact",
): string {
  if (density === "expanded") return text.trim();
  const max = getSlideLimits(density).timelineBody;
  const trimmed = text.trim();
  return trimmed.length > max ? truncateAtSentence(trimmed, max) : trimmed;
}

export function estimateCardWeight(
  text: string,
  density: BriefingDensity = "compact",
): number {
  const parsed = condenseBriefingItem(text, density);
  return (
    parsed.lead.length +
    (parsed.detail?.length ?? 0) +
    (parsed.detail ? 28 : 12)
  );
}

export function estimateTimelineWeight(
  text: string,
  index: number,
  density: BriefingDensity = "compact",
): number {
  const plan = parsePlanItem(text, index);
  const body = condenseBriefingItem(
    density === "expanded" ? plan.text : condensePlanText(plan.text, density),
    density,
  );
  return plan.dayLabel.length + body.lead.length + (body.detail?.length ?? 0) + 36;
}

export function packItemsByWeight<T>(
  items: T[],
  getWeight: (item: T, index: number) => number,
  maxWeight: number,
  maxItems: number,
): T[][] {
  if (items.length === 0) return [];

  const chunks: T[][] = [];
  let current: T[] = [];
  let currentWeight = 0;

  items.forEach((item, index) => {
    const weight = getWeight(item, index);
    const heavyItem = weight > maxWeight * 0.85;
    const overItemCap = current.length >= maxItems;
    const overWeightCap = current.length > 0 && currentWeight + weight > maxWeight;

    if ((overItemCap || overWeightCap || heavyItem) && current.length > 0) {
      chunks.push(current);
      current = [item];
      currentWeight = weight;
      return;
    }

    current.push(item);
    currentWeight += weight;
  });

  if (current.length > 0) chunks.push(current);
  return chunks;
}

export function chunkItems<T>(items: T[], chunkSize: number): T[][] {
  if (items.length <= chunkSize) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export function paginateLabel(pageIndex: number, pageCount: number): string | undefined {
  return pageCount > 1 ? `${pageIndex + 1} / ${pageCount}` : undefined;
}
