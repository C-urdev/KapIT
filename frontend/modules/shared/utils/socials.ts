const SOCIAL_LINK_KEYS: readonly string[] = ['github', 'portfolio', 'linkedin', 'other', 'otherLinks'];

const toCleanString = (value: unknown): string => String(value || '').trim();

const uniqueValues = (values: string[]): string[] => {
  const seen = new Set<string>();
  return values.filter((entry: string) => {
    const key = entry.toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const extractSocialLinks = (rawValue: unknown): string[] => {
  if (rawValue == null) {
    return [];
  }

  if (typeof rawValue === 'object') {
    const valueMap = rawValue as Record<string, unknown>;
    const links = SOCIAL_LINK_KEYS.map((key) => toCleanString(valueMap?.[key])).filter(Boolean);
    return uniqueValues(links);
  }

  const text = toCleanString(rawValue);
  if (!text) {
    return [];
  }

  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        return extractSocialLinks(parsed);
      }
    } catch {
      return [];
    }
  }

  return uniqueValues([text]);
};

export const normalizeSocialsText = (rawValue: unknown): string => extractSocialLinks(rawValue).join(' | ');
