import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import CompanyLogoUpload from '@companyComponents/CompanyLogoUpload';
import { navigate } from '@companyFeatures/companyUtils';
import { cleanPlaceName, loadProvinceCityData } from '@sharedUtils/philippinesLocations';

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
const parseLocation = (rawLocation, provinceOptions, provinceCodeByLabel, getCitiesForProvince) => {
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

const formatLocation = (city, provinceCode, provinceLabelByCode) => {
  const provinceLabel = provinceLabelByCode[provinceCode] || '';
  if (!city || !provinceLabel) {
    return '';
  }
  return `${city}, ${provinceLabel}, Philippines`;
};

export default function CompanyProfileOnboardingPage({ user, onSubmit, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [locationData, setLocationData] = useState({
    provinceOptions: [],
    provinceLabelByCode: {},
    provinceCodeByLabel: {},
    getCitiesForProvince: () => [],
  });
  const [form, setForm] = useState({
    companyName: user?.companyName || user?.username || '',
    logoUrl: user?.profileImage || '',
    industry: user?.industry || '',
    companySize: user?.companySize || '',
    description: user?.bio || '',
    website: user?.website || '',
    provinceCode: '',
    city: '',
    location: String(user?.address || ''),
    contactEmail: user?.email || '',
    phoneNumber: user?.phone || '',
  });

  const cityOptions = useMemo(() => locationData.getCitiesForProvince(form.provinceCode), [form.provinceCode, locationData]);

  useEffect(() => {
    let cancelled = false;

    const loadLocations = async () => {
      const nextData = await loadProvinceCityData();
      if (!cancelled) {
        setLocationData(nextData);
      }
    };

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!locationData.provinceOptions.length) {
      return;
    }

    setForm((prev) => {
      if (prev.provinceCode || prev.city) {
        return prev;
      }

      const nextLocation = parseLocation(
        user?.address || '',
        locationData.provinceOptions,
        locationData.provinceCodeByLabel,
        locationData.getCitiesForProvince
      );

      return {
        ...prev,
        provinceCode: nextLocation.provinceCode,
        city: nextLocation.city,
        location: formatLocation(nextLocation.city, nextLocation.provinceCode, locationData.provinceLabelByCode),
      };
    });
  }, [locationData, user]);

  useEffect(() => {
    setForm((prev) => {
      const nextCities = locationData.getCitiesForProvince(prev.provinceCode);
      const hasCity = nextCities.some((option) => option.name === prev.city);
      const nextCity = hasCity ? prev.city : '';
      return {
        ...prev,
        city: nextCity,
        location: formatLocation(nextCity, prev.provinceCode, locationData.provinceLabelByCode),
      };
    });
  }, [form.provinceCode, locationData]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      location: formatLocation(prev.city, prev.provinceCode, locationData.provinceLabelByCode),
    }));
  }, [form.city, locationData]);

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
    <div className="min-h-screen bg-[#f5f5f2] text-[#344e41] dark:bg-[#0a1628] dark:text-slate-200">
      <header className="sticky top-0 z-30 border-b border-[#a3b18a] bg-white dark:border-[#1e3a5f] dark:bg-[#0a1628]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-[#344e41] hover:text-[#3a5a40] dark:text-slate-200 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="inline-flex items-center gap-3">
              <KapITLogo className="h-9 w-9 rounded-lg object-contain bg-white" />
              <span className="text-xl font-bold text-[#3a5a40] dark:text-white">KapIT</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 transition-colors hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f]"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5 text-[#344e41]" /> : <Sun className="h-5 w-5 text-white" />}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-[#a3b18a] bg-white p-6 shadow-lg shadow-black/5 dark:border-[#1e3a5f] dark:bg-[#162842] dark:shadow-black/30 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#a3b18a] bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#0f2139]">
              <Building2 className="h-6 w-6 text-[#588157] dark:text-[#3ba9d6]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white sm:text-3xl">Complete your company profile</h1>
              <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">Set up your company details so developers can recognize and trust your brand.</p>
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
                    options={locationData.provinceOptions.map((province) => ({ value: province.code, label: province.label }))}
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
                className="rounded-xl bg-[#3a5a40] px-5 py-3 font-semibold text-white hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-60 dark:border dark:border-[#3ba9d6]/30 dark:bg-[#1e3a5f] dark:text-[#dcecff] dark:hover:bg-[#24496d]"
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
      <h2 className="text-lg font-bold text-[#2f3e2f] dark:text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, full = false, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-sm font-semibold text-[#3a5a40] dark:text-slate-200">{label}</label>
      {children}
    </div>
  );
}
