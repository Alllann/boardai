export type ParsedBriefingItem = {
  lead: string;
  detail?: string;
};

export type ParsedPlanItem = {
  dayLabel: string;
  text: string;
};

/** Visual density limits for the embedded briefing deck (~24rem tall). */
export const SLIDE_LIMITS = {
  heroHeadline: 200,
  quoteBody: 240,
  warningBody: 240,
  cardLead: 85,
  cardDetail: 110,
  cardSlideWeight: 340,
  maxCardsPerSlide: 2,
  timelineSlideWeight: 320,
  maxTimelinePerSlide: 2,
  timelineBody: 100,
} as const;

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

export function condenseBriefingItem(text: string): ParsedBriefingItem {
  const parsed = parseBriefingItem(text);
  const lead = truncateAtSentence(parsed.lead, SLIDE_LIMITS.cardLead);
  const detail = parsed.detail
    ? truncateAtSentence(parsed.detail, SLIDE_LIMITS.cardDetail)
    : undefined;

  if (detail && !parsed.lead.includes(":") && !parsed.lead.includes("—")) {
    return { lead, detail };
  }

  return detail ? { lead, detail } : { lead };
}

export function condensePlanText(text: string): string {
  return truncateAtSentence(text, SLIDE_LIMITS.timelineBody);
}

export function estimateCardWeight(text: string): number {
  const parsed = condenseBriefingItem(text);
  return (
    parsed.lead.length +
    (parsed.detail?.length ?? 0) +
    (parsed.detail ? 28 : 12)
  );
}

export function estimateTimelineWeight(text: string, index: number): number {
  const plan = parsePlanItem(text, index);
  const body = condenseBriefingItem(plan.text);
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
