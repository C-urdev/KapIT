const SOCIAL_LINK_KEYS = ['github', 'portfolio', 'linkedin', 'other', 'otherLinks'];

const toCleanString = (value) => String(value || '').trim();

const uniqueValues = (values) => {
  const seen = new Set();
  return values.filter((entry) => {
    const key = entry.toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const extractSocialLinks = (rawValue) => {
  if (rawValue == null) {
    return [];
  }

  if (typeof rawValue === 'object') {
    const links = SOCIAL_LINK_KEYS.map((key) => toCleanString(rawValue?.[key])).filter(Boolean);
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

const normalizeSocialsText = (rawValue) => extractSocialLinks(rawValue).join(' | ');

module.exports = {
  normalizeSocialsText,
};
