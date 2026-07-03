const NCR_PROVINCE_CODE = 'metro-manila';
const NCR_COMPONENT_CODES = ['1339', '1374', '1375', '1376'];
const EXCLUDED_PROVINCE_CODES = new Set(['0997', '1298']);

let addressOptionsPromise: Promise<string[]> | undefined;
let provinceCityDataPromise: Promise<ProvinceCityData> | undefined;
let locationDatasetPromise: Promise<{ provinces: LocationRecord[]; cityMunicipalities: LocationRecord[] }> | undefined;

type LocationRecord = { prov_code: string; name: string };
type ProvinceOption = { code: string; label: string };
type ProvinceCityData = {
  provinceOptions: ProvinceOption[];
  provinceLabelByCode: Record<string, string>;
  provinceCodeByLabel: Record<string, string>;
  getCitiesForProvince: (provinceCode?: string) => Array<{ name: string }>;
};

const titleCase = (value: unknown): string =>
  String(value || '')
    .toLowerCase()
    .replace(/\b\w/g, (char: string) => char.toUpperCase());

export const cleanPlaceName = (value: unknown): string =>
  titleCase(String(value || ''))
    .replace(/\s*\(Capital\)$/i, '')
    .replace(/^City Of /i, '')
    .replace(/\s+City$/i, '')
    .trim();

const loadLocationDataset = async (): Promise<{ provinces: LocationRecord[]; cityMunicipalities: LocationRecord[] }> => {
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

export const loadAddressOptions = async (): Promise<string[]> => {
  if (!addressOptionsPromise) {
    addressOptionsPromise = loadLocationDataset().then(({ provinces, cityMunicipalities }) => {
      const provinceMap = new Map<string, string>((provinces || []).map((item: LocationRecord) => [item.prov_code, cleanPlaceName(item.name)]));
      const labels = new Set<string>();
      const options: string[] = [];

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

      return options.sort((a: string, b: string) => a.localeCompare(b));
    });
  }

  return addressOptionsPromise;
};

export const loadProvinceCityData = async (): Promise<ProvinceCityData> => {
  if (!provinceCityDataPromise) {
    provinceCityDataPromise = loadLocationDataset().then(({ provinces, cityMunicipalities }) => {
      const unique = new Map<string, ProvinceOption>();

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

      const provinceOptions: ProvinceOption[] = Array.from(unique.values()).sort((a: ProvinceOption, b: ProvinceOption) => a.label.localeCompare(b.label));
      provinceOptions.unshift({ code: NCR_PROVINCE_CODE, label: 'Metro Manila' });

      const provinceLabelByCode: Record<string, string> = Object.fromEntries(provinceOptions.map((option: ProvinceOption) => [option.code, option.label]));
      const provinceCodeByLabel: Record<string, string> = Object.fromEntries(provinceOptions.map((option: ProvinceOption) => [option.label.toLowerCase(), option.code]));

      const seen = new Set<string>(['Manila']);
      const ncrCityOptions: Array<{ name: string }> = [{ name: 'Manila' }];

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

      ncrCityOptions.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

      const getCitiesForProvince = (provinceCode?: string): Array<{ name: string }> => {
        if (!provinceCode) {
          return [];
        }

        if (provinceCode === NCR_PROVINCE_CODE) {
          return ncrCityOptions;
        }

        const result = (cityMunicipalities || []).filter((record: LocationRecord) => record.prov_code == provinceCode);
        return result
          .map((record: LocationRecord) => ({ name: cleanPlaceName(record.name) }))
          .filter((record: { name: string }, index: number, arr: Array<{ name: string }>) => record.name && arr.findIndex((item: { name: string }) => item.name === record.name) === index)
          .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
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
