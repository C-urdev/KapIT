// @ts-nocheck
const normalizeCheckoutUrl = (value) => {
  const candidate = String(value || '').trim();
  if (!candidate) {
    return '';
  }
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

export const resolveCheckoutUrls = (payload = {}) => {
  const urls = [];
  const addUnique = (value) => {
    const normalized = normalizeCheckoutUrl(value);
    if (!normalized) {
      return;
    }
    if (!urls.includes(normalized)) {
      urls.push(normalized);
    }
  };

  const rawUrls = Array.isArray(payload?.checkoutUrls) ? payload.checkoutUrls : [];
  rawUrls.forEach((value) => addUnique(value));
  addUnique(payload?.checkoutUrl);

  return urls;
};

