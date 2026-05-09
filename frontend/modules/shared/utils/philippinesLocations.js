const NCR_PROVINCE_CODE = 'metro-manila';
const NCR_COMPONENT_CODES = ['1339', '1374', '1375', '1376'];
const EXCLUDED_PROVINCE_CODES = new Set(['0997', '1298']);

let addressOptionsPromise;
let provinceCityDataPromise;
let locationDatasetPromise;

const titleCase = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const cleanPlaceName = (value) =>
  titleCase(String(value || ''))
    .replace(/\s*\(Capital\)$/i, '')
    .replace(/^City Of /i, '')
    .replace(/\s+City$/i, '')
    .trim();

const loadLocationDataset = async () => {
  if (!locationDatasetPromise) {
    locationDatasetPromise = Promise.all([
      fetch('/data/philippineProvinces.json').then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load province data');
        }
        return response.json();
      }),
      fetch('/data/philippineCityMunicipalities.json').then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load city and municipality data');
        }
        return response.json();
      }),
    ]).then(([provinces, cityMunicipalities]) => ({
      provinces: Array.isArray(provinces) ? provinces : [],
      cityMunicipalities: Array.isArray(cityMunicipalities) ? cityMunicipalities : [],
    }));
  }

  return locationDatasetPromise;
};

export const loadAddressOptions = async () => {
  if (!addressOptionsPromise) {
    addressOptionsPromise = loadLocationDataset().then(({ provinces, cityMunicipalities }) => {
      const provinceMap = new Map((provinces || []).map((item) => [item.prov_code, cleanPlaceName(item.name)]));
      const labels = new Set();
      const options = [];

      for (const record of cityMunicipalities || []) {
        if (EXCLUDED_PROVINCE_CODES.has(record.prov_code)) continue;

        const municipalityOrCity = cleanPlaceName(record.name);
        const provinceLabel = NCR_COMPONENT_CODES.includes(record.prov_code) ? 'Metro Manila' : provinceMap.get(record.prov_code) || '';
        const fullLabel = provinceLabel ? `${municipalityOrCity}, ${provinceLabel}, Philippines` : `${municipalityOrCity}, Philippines`;

        if (!labels.has(fullLabel)) {
          labels.add(fullLabel);
          options.push(fullLabel);
        }
      }

      return options.sort((a, b) => a.localeCompare(b));
    });
  }

  return addressOptionsPromise;
};

export const loadProvinceCityData = async () => {
  if (!provinceCityDataPromise) {
    provinceCityDataPromise = loadLocationDataset().then(({ provinces, cityMunicipalities }) => {
      const unique = new Map();

      for (const province of provinces || []) {
        if (EXCLUDED_PROVINCE_CODES.has(province.prov_code) || NCR_COMPONENT_CODES.includes(province.prov_code)) {
          continue;
        }

        if (!unique.has(province.prov_code)) {
          unique.set(province.prov_code, {
            code: province.prov_code,
            label: cleanPlaceName(province.name),
          });
        }
      }

      const provinceOptions = Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label));
      provinceOptions.unshift({ code: NCR_PROVINCE_CODE, label: 'Metro Manila' });

      const provinceLabelByCode = Object.fromEntries(provinceOptions.map((option) => [option.code, option.label]));
      const provinceCodeByLabel = Object.fromEntries(provinceOptions.map((option) => [option.label.toLowerCase(), option.code]));

      const seen = new Set(['Manila']);
      const ncrCityOptions = [{ name: 'Manila' }];

      for (const record of cityMunicipalities || []) {
        if (!NCR_COMPONENT_CODES.includes(record.prov_code)) {
          continue;
        }

        const cleaned = cleanPlaceName(record.name);
        if (!cleaned || seen.has(cleaned)) {
          continue;
        }

        seen.add(cleaned);
        ncrCityOptions.push({ name: cleaned });
      }

      ncrCityOptions.sort((a, b) => a.name.localeCompare(b.name));

      const getCitiesForProvince = (provinceCode) => {
        if (!provinceCode) {
          return [];
        }

        if (provinceCode === NCR_PROVINCE_CODE) {
          return ncrCityOptions;
        }

        const result = (cityMunicipalities || []).filter((record) => record.prov_code == provinceCode);
        return result
          .map((record) => ({ name: cleanPlaceName(record.name) }))
          .filter((record, index, arr) => record.name && arr.findIndex((item) => item.name === record.name) === index)
          .sort((a, b) => a.name.localeCompare(b.name));
      };

      return {
        provinceOptions,
        provinceLabelByCode,
        provinceCodeByLabel,
        getCitiesForProvince,
      };
    });
  }

  return provinceCityDataPromise;
};
