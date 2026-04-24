const DEFAULT_COUNTRY = 'Philippines';

let cachedCountryOptions = null;

export const getCountryOptions = () => {
  if (cachedCountryOptions) {
    return cachedCountryOptions;
  }

  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
    cachedCountryOptions = [{ value: DEFAULT_COUNTRY, label: DEFAULT_COUNTRY }];
    return cachedCountryOptions;
  }

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const regionCodes = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('region') : [];
    const uniqueNames = new Set();

    for (const code of regionCodes) {
      const label = displayNames.of(code);
      if (!label || /^[A-Z0-9]{2,3}$/.test(label)) {
        continue;
      }
      uniqueNames.add(label);
    }

    if (!uniqueNames.has(DEFAULT_COUNTRY)) {
      uniqueNames.add(DEFAULT_COUNTRY);
    }

    cachedCountryOptions = Array.from(uniqueNames)
      .sort((a, b) => a.localeCompare(b))
      .map((country) => ({ value: country, label: country }));
    return cachedCountryOptions;
  } catch {
    cachedCountryOptions = [{ value: DEFAULT_COUNTRY, label: DEFAULT_COUNTRY }];
    return cachedCountryOptions;
  }
};

