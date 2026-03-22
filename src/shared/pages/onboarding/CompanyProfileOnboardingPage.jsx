import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, LogOut, Moon, Sun } from 'lucide-react';
import phil from 'phil-reg-prov-mun-brgy';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import CompanyLogoUpload from '@companyComponents/CompanyLogoUpload';
import { navigate } from '@companyFeatures/companyUtils';

const INDUSTRY_OPTIONS = [
  'Information Technology Services',
  'Software Development',
  'Web Development',
  'Mobile App Development',
  'E-commerce',
  'Fintech',
  'EdTech',
  'HealthTech',
  'Cybersecurity',
  'Cloud Computing',
  'AI / Machine Learning',
  'Data Analytics',
  'IT Consulting',
  'BPO / Outsourcing',
  'Telecommunications',
  'Digital Marketing',
  'Gaming / Entertainment Tech',
  'Startup / SaaS',
];

const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const NCR_PROVINCE_CODE = 'metro-manila';
const NCR_COMPONENT_CODES = ['1339', '1374', '1375', '1376'];
const EXCLUDED_PROVINCE_CODES = new Set(['0997', '1298']);

const titleCase = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const cleanPlaceName = (value) =>
  titleCase(String(value || ''))
    .replace(/\s*\(Capital\)$/i, '')
    .replace(/^City Of /i, '')
    .replace(/\s+City$/i, '')
    .trim();

const provinceOptions = (() => {
  const unique = new Map();
  for (const province of phil.provinces || []) {
    if (EXCLUDED_PROVINCE_CODES.has(province.prov_code)) {
      continue;
    }
    if (NCR_COMPONENT_CODES.includes(province.prov_code)) {
      continue;
    }
    if (!unique.has(province.prov_code)) {
      unique.set(province.prov_code, {
        code: province.prov_code,
        label: cleanPlaceName(province.name),
      });
    }
  }

  const options = Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label));
  options.unshift({ code: NCR_PROVINCE_CODE, label: 'Metro Manila' });
  return options;
})();

const provinceLabelByCode = Object.fromEntries(provinceOptions.map((option) => [option.code, option.label]));
const provinceCodeByLabel = Object.fromEntries(provinceOptions.map((option) => [option.label.toLowerCase(), option.code]));

const ncrCityOptions = (() => {
  const seen = new Set(['Manila']);
  const cities = [{ name: 'Manila' }];

  for (const record of phil.city_mun || []) {
    if (!NCR_COMPONENT_CODES.includes(record.prov_code)) {
      continue;
    }

    const cleaned = cleanPlaceName(record.name);
    if (!cleaned || seen.has(cleaned)) {
      continue;
    }

    seen.add(cleaned);
    cities.push({ name: cleaned });
  }

  return cities.sort((a, b) => a.name.localeCompare(b.name));
})();

const getCitiesForProvince = (provinceCode) => {
  if (!provinceCode) {
    return [];
  }

  if (provinceCode === NCR_PROVINCE_CODE) {
    return ncrCityOptions;
  }

  const result = phil.getCityMunByProvince(provinceCode) || [];
  return result
    .map((record) => ({ name: cleanPlaceName(record.name) }))
    .filter((record, index, arr) => record.name && arr.findIndex((item) => item.name === record.name) === index)
    .sort((a, b) => a.name.localeCompare(b.name));
};

const parseLocation = (rawLocation) => {
  const normalized = String(rawLocation || '')
    .replace(/,\s*Philippines\s*$/i, '')
    .trim();

  if (!normalized) {
    return { provinceCode: '', city: '' };
  }

  const parts = normalized.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const city = cleanPlaceName(parts[0]);
    const provinceCode = provinceCodeByLabel[cleanPlaceName(parts[1]).toLowerCase()] || '';
    return { provinceCode, city };
  }

  const cityOnly = cleanPlaceName(normalized);
  for (const option of provinceOptions) {
    const cities = getCitiesForProvince(option.code);
    if (cities.some((item) => item.name.toLowerCase() === cityOnly.toLowerCase())) {
      return { provinceCode: option.code, city: cityOnly };
    }
  }

  return { provinceCode: '', city: '' };
};

const formatLocation = (city, provinceCode) => {
  const provinceLabel = provinceLabelByCode[provinceCode] || '';
  if (!city || !provinceLabel) {
    return '';
  }
  return `${city}, ${provinceLabel}, Philippines`;
};

export default function CompanyProfile({ user, onSubmit, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const initialLocation = parseLocation(user?.address || '');
  const [form, setForm] = useState({
    companyName: user?.companyName || user?.username || '',
    logoUrl: user?.profileImage || '',
    industry: user?.industry || '',
    companySize: user?.companySize || '',
    description: user?.bio || '',
    website: user?.website || '',
    provinceCode: initialLocation.provinceCode,
    city: initialLocation.city,
    location: formatLocation(initialLocation.city, initialLocation.provinceCode),
    contactEmail: user?.email || '',
    phoneNumber: user?.phone || '',
  });

  const cityOptions = useMemo(() => getCitiesForProvince(form.provinceCode), [form.provinceCode]);

  useEffect(() => {
    setForm((prev) => {
      const nextCities = getCitiesForProvince(prev.provinceCode);
      const hasCity = nextCities.some((option) => option.name === prev.city);
      const nextCity = hasCity ? prev.city : '';
      return {
        ...prev,
        city: nextCity,
        location: formatLocation(nextCity, prev.provinceCode),
      };
    });
  }, [form.provinceCode]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      location: formatLocation(prev.city, prev.provinceCode),
    }));
  }, [form.city]);

  const isComplete = useMemo(() => {
    return Boolean(
      String(form.companyName).trim() &&
        String(form.industry).trim() &&
        String(form.companySize).trim() &&
        String(form.location).trim() &&
        String(form.contactEmail).trim()
    );
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete || saving) return;
    setSaving(true);
    try {
      await onSubmit?.({
        companyName: form.companyName,
        logoUrl: form.logoUrl,
        industry: form.industry,
        companySize: form.companySize,
        description: form.description,
        website: form.website,
        location: form.location,
        contactEmail: form.contactEmail,
        phoneNumber: form.phoneNumber,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-slate-200 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="inline-flex items-center gap-3">
              <KapITLogo className="w-9 h-9 rounded-lg object-contain bg-white" />
              <span className="text-xl font-bold">KapIT</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 transition-colors hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-slate-200" /> : <Sun className="w-5 h-5 text-slate-200" />}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-200 hover:bg-rose-500/15"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-6 shadow-lg shadow-black/30">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Complete your company profile</h1>
              <p className="mt-1 text-sm text-slate-400">Set up your company details so developers can recognize and trust your brand.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <Section title="Company Identity">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Company Logo (Optional)" full>
                  <CompanyLogoUpload value={form.logoUrl} onChange={(logoUrl) => setForm((p) => ({ ...p, logoUrl }))} compact />
                </Field>
                <Field label="Company Name">
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                    className="field"
                    required
                  />
                </Field>
                <Field label="Industry">
                  <SearchableSelect
                    value={form.industry}
                    onChange={(industry) => setForm((p) => ({ ...p, industry }))}
                    options={INDUSTRY_OPTIONS}
                    placeholder="Select an industry"
                    searchPlaceholder="Search industries"
                  />
                </Field>
                <Field label="Company Size">
                  <SearchableSelect
                    value={form.companySize}
                    onChange={(companySize) => setForm((p) => ({ ...p, companySize }))}
                    options={COMPANY_SIZE_OPTIONS}
                    placeholder="Select company size"
                    searchPlaceholder="Search company size"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Company Details">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Website (Optional)">
                  <input
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                    className="field"
                    placeholder="https://"
                  />
                </Field>
                <Field label="Province">
                  <SearchableSelect
                    value={form.provinceCode}
                    onChange={(provinceCode) => setForm((p) => ({ ...p, provinceCode }))}
                    options={provinceOptions.map((province) => ({ value: province.code, label: province.label }))}
                    placeholder="Select a province"
                    searchPlaceholder="Search provinces"
                  />
                </Field>
                <Field label="City / Municipality">
                  <SearchableSelect
                    value={form.city}
                    onChange={(city) => setForm((p) => ({ ...p, city }))}
                    options={cityOptions.map((city) => ({ value: city.name, label: city.name }))}
                    placeholder={form.provinceCode ? 'Select a city or municipality' : 'Select a province first'}
                    searchPlaceholder="Search cities"
                    disabled={!form.provinceCode}
                  />
                </Field>
                <Field label="Country">
                  <input value="Philippines" readOnly className="field bg-[#f5f5f2] dark:bg-[#0f2139]/60" />
                </Field>
                <Field label="Saved Location" full>
                  <input value={form.location} readOnly className="field bg-[#f5f5f2] dark:bg-[#0f2139]/60" />
                </Field>
                <Field label="Company Description (Optional)" full>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="field min-h-28"
                    placeholder="What does your company do? (Optional)"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Contact Information">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Contact Email">
                  <input value={form.contactEmail} readOnly className="field bg-[#f5f5f2] dark:bg-[#0f2139]/60" />
                </Field>
                <Field label="Phone Number (Optional)">
                  <input
                    value={form.phoneNumber}
                    onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                    className="field"
                    placeholder="+63 9xx xxx xxxx"
                  />
                </Field>
              </div>
            </Section>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={!isComplete || saving}
                className="rounded-xl border border-blue-500/30 bg-blue-500/15 px-5 py-3 font-semibold text-blue-200 shadow-lg shadow-black/30 hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save company profile'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, full = false, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-sm font-semibold text-slate-200">{label}</label>
      {children}
    </div>
  );
}




