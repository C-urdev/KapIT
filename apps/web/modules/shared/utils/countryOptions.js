const DEFAULT_COUNTRY = 'Philippines';
const FALLBACK_COUNTRY_NAMES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  "Cote d'Ivoire", 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland',
  'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq',
  'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
  'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

let cachedCountryOptions = null;

const buildFallbackRegionCodes = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const codes = [];
  for (let i = 0; i < letters.length; i += 1) {
    for (let j = 0; j < letters.length; j += 1) {
      codes.push(`${letters[i]}${letters[j]}`);
    }
  }
  return codes;
};

export const getCountryOptions = () => {
  if (cachedCountryOptions) {
    return cachedCountryOptions;
  }

  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
    cachedCountryOptions = FALLBACK_COUNTRY_NAMES
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map((country) => ({ value: country, label: country }));
    return cachedCountryOptions;
  }

  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const regionCodes = typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('region')
      : buildFallbackRegionCodes();
    const uniqueNames = new Set();

    for (const code of regionCodes) {
      const label = displayNames.of(code);
      if (!label || /^[A-Z0-9]{2,3}$/.test(label)) {
        continue;
      }
      uniqueNames.add(label);
    }

    uniqueNames.add(DEFAULT_COUNTRY);
    for (const countryName of FALLBACK_COUNTRY_NAMES) {
      uniqueNames.add(countryName);
    }

    cachedCountryOptions = Array.from(uniqueNames)
      .sort((a, b) => a.localeCompare(b))
      .map((country) => ({ value: country, label: country }));
    return cachedCountryOptions;
  } catch {
    cachedCountryOptions = FALLBACK_COUNTRY_NAMES
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map((country) => ({ value: country, label: country }));
    return cachedCountryOptions;
  }
};
