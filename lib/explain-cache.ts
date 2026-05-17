const STORAGE_PREFIX = "boardai-explain:";

function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

export function explainCacheKey(
  parts: Record<string, string | number | undefined>,
): string {
  return `${STORAGE_PREFIX}${hashString(JSON.stringify(parts))}`;
}

export function getCachedExplanation(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setCachedExplanation(key: string, explanation: string): void {
  try {
    sessionStorage.setItem(key, explanation);
  } catch {
    /* quota or private mode */
  }
}
