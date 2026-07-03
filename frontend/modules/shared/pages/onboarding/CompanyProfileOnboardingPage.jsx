import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, LogOut, Moon, Sun } from 'lucide-react';
import { useToast } from '@sharedComponents/ui/ToastProvider';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import CompanyLogoUpload from '@companyComponents/CompanyLogoUpload';
import { navigate } from '@companyFeatures/companyUtils';
import { getCountryOptions } from '@sharedUtils/countryOptions';
import { cleanPlaceName, loadProvinceCityData } from '@sharedUtils/philippinesLocations';

const INDUSTRY_OPTIONS = [
  'AI and Engineering',
  'Information Technology Services',
  'Software Development',
  'Web Development',
  'Mobile App Development',
  'Blockchain / Crypto',
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
  'Enterprise Solutions',
  'Product Development',
];
const OTHER_COMPANY_TYPE_OPTION = 'Other';
const COMPANY_TYPE_OPTIONS = [...INDUSTRY_OPTIONS, OTHER_COMPANY_TYPE_OPTION];

const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const parseLocation = (rawLocation, provinceOptions, provinceCodeByLabel, getCitiesForProvince) => {
  const locationText = String(rawLocation || '').trim();
  const locationParts = locationText
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const hasCountrySegment = locationParts.length >= 3;
  const country = hasCountrySegment ? locationParts[locationParts.length - 1] : 'Philippines';
  const normalized = hasCountrySegment ? locationParts.slice(0, -1).join(', ') : locationText.replace(/,\s*Philippines\s*$/i, '').trim();

  if (!normalized) {
    return { provinceCode: '', city: '', country };
  }
  if (String(country || '').trim().toLowerCase() !== 'philippines') {
    return { provinceCode: '', city: cleanPlaceName(normalized), country };
  }

  const parts = normalized.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const city = cleanPlaceName(parts[0]);
    const provinceCode = provinceCodeByLabel[cleanPlaceName(parts[1]).toLowerCase()] || '';
    return { provinceCode, city, country };
  }

  const cityOnly = cleanPlaceName(normalized);
  for (const option of provinceOptions) {
    const cities = getCitiesForProvince(option.code);
    if (cities.some((item) => item.name.toLowerCase() === cityOnly.toLowerCase())) {
      return { provinceCode: option.code, city: cityOnly, country };
    }
  }

  return { provinceCode: '', city: '', country };
};

const formatLocation = (city, provinceCode, provinceLabelByCode, country) => {
  const normalizedCountry = String(country || 'Philippines').trim() || 'Philippines';
  if (normalizedCountry.toLowerCase() !== 'philippines') {
    const cityText = String(city || '').trim();
    return cityText ? `${cityText}, ${normalizedCountry}` : normalizedCountry;
  }
  const provinceLabel = provinceLabelByCode[provinceCode] || '';
  if (!city || !provinceLabel) {
    return '';
  }
  return `${city}, ${provinceLabel}, ${normalizedCountry}`;
};

export default function CompanyProfileOnboardingPage({ user, onSubmit, onLogout }) {
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [locationData, setLocationData] = useState({
    provinceOptions: [],
    provinceLabelByCode: {},
    provinceCodeByLabel: {},
    getCitiesForProvince: () => [],
  });
  const initialIndustry = String(user?.industry || '').trim();
  const initialUsesCustomType = Boolean(initialIndustry) && !INDUSTRY_OPTIONS.includes(initialIndustry);
  const [form, setForm] = useState({
    companyName: user?.companyName || user?.username || '',
    logoUrl: user?.profileImage || '',
    industry: initialUsesCustomType ? OTHER_COMPANY_TYPE_OPTION : initialIndustry,
    customIndustry: initialUsesCustomType ? initialIndustry : '',
    companySize: user?.companySize || '',
    description: user?.bio || '',
    website: user?.website || '',
    provinceCode: '',
    city: '',
    country: 'Philippines',
    location: String(user?.address || ''),
    contactEmail: user?.email || '',
    phoneNumber: user?.phone || '',
  });
  const countryOptions = useMemo(() => getCountryOptions(), []);
  const isPhilippines = String(form.country || '').trim().toLowerCase() === 'philippines';

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
        country: nextLocation.country || prev.country || 'Philippines',
        location: formatLocation(nextLocation.city, nextLocation.provinceCode, locationData.provinceLabelByCode, nextLocation.country || prev.country),
      };
    });
  }, [locationData, user]);

  useEffect(() => {
    if (!isPhilippines) {
      return;
    }
    setForm((prev) => {
      const nextCities = locationData.getCitiesForProvince(prev.provinceCode);
      const hasCity = nextCities.some((option) => option.name === prev.city);
      const nextCity = hasCity ? prev.city : '';
      return {
        ...prev,
        city: nextCity,
        location: formatLocation(nextCity, prev.provinceCode, locationData.provinceLabelByCode, prev.country),
      };
    });
  }, [form.provinceCode, locationData, isPhilippines]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      location: formatLocation(prev.city, prev.provinceCode, locationData.provinceLabelByCode, prev.country),
    }));
  }, [form.city, form.country, locationData]);

  const isComplete = useMemo(() => {
    const finalIndustry = form.industry === OTHER_COMPANY_TYPE_OPTION ? form.customIndustry : form.industry;
    return Boolean(
      String(form.companyName).trim() &&
        String(finalIndustry).trim() &&
        String(form.companySize).trim() &&
        String(form.location).trim() &&
        String(form.contactEmail).trim()
    );
  }, [form]);

  const finalIndustry = form.industry === OTHER_COMPANY_TYPE_OPTION ? form.customIndustry : form.industry;
  const missing = useMemo(
    () => ({
      companyName: !String(form.companyName).trim(),
      industry: !String(finalIndustry).trim(),
      companySize: !String(form.companySize).trim(),
      location: !String(form.location).trim(),
      contactEmail: !String(form.contactEmail).trim(),
      provinceCode: isPhilippines && !String(form.provinceCode).trim(),
      city: isPhilippines && !String(form.city).trim(),
    }),
    [finalIndustry, form, isPhilippines]
  );

  const sectionInvalid = useMemo(
    () => ({
      identity: missing.companyName || missing.industry || missing.companySize,
      details: missing.location || missing.provinceCode || missing.city,
      contact: missing.contactEmail,
    }),
    [missing]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!isComplete) {
      setSubmitAttempted(true);
      toast.warning('Please fill in the highlighted required fields.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit?.({
        companyName: form.companyName,
        logoUrl: form.logoUrl,
        industry: form.industry === OTHER_COMPANY_TYPE_OPTION ? form.customIndustry : form.industry,
        companySize: form.companySize,
        description: form.description,
        website: form.website,
        location: form.location,
        contactEmail: form.contactEmail,
        phoneNumber: form.phoneNumber,
      });
    } catch (error) {
      const status = Number(error?.status || 0);
      const message = String(error?.message || '').trim();
      if (status === 400) {
        setSubmitAttempted(true);
        toast.warning(message || 'Please fill in the required fields.');
        return;
      }
      if (status === 401) {
        toast.error('Your session expired. Please log in again.');
        return;
      }
      toast.error(message || 'Unable to save your company profile right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-onboarding min-h-screen bg-[#f5f5f2] text-[#344e41] dark:bg-[#121416] dark:text-slate-200">
      <header className="sticky top-0 z-30 border-b border-[#a3b18a] bg-white dark:border-[#353c44] dark:bg-[#121416]">
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
              className="rounded-lg p-2 transition-colors hover:bg-[#f5f5f2] dark:hover:bg-[#353c44]"
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
        <div className="rounded-2xl border border-[#a3b18a] bg-white p-6 shadow-lg shadow-black/5 dark:border-[#353c44] dark:bg-[#22272b] dark:shadow-black/30 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#a3b18a] bg-[#f5f5f2] dark:border-[#444d57] dark:bg-[#1a1d20]">
              <Building2 className="h-6 w-6 text-[#588157] dark:text-[#6f9b74]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white sm:text-3xl">Complete your company profile</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-8">
            <Section title="Company Identity" invalid={submitAttempted && sectionInvalid.identity}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Company Logo (Optional)" full>
                  <CompanyLogoUpload value={form.logoUrl} onChange={(logoUrl) => setForm((p) => ({ ...p, logoUrl }))} compact />
                </Field>
                <Field label="Company Name" required invalid={submitAttempted && missing.companyName}>
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                    className={`field ${submitAttempted && missing.companyName ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                  />
                </Field>
                <Field label="Company Type" required invalid={submitAttempted && missing.industry}>
                  <SearchableSelect
                    value={form.industry}
                    onChange={(industry) => setForm((p) => ({ ...p, industry }))}
                    options={COMPANY_TYPE_OPTIONS}
                    placeholder="Select company type"
                    searchPlaceholder="Search company types"
                    className={`field ${submitAttempted && missing.industry ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                  />
                </Field>
                {form.industry === OTHER_COMPANY_TYPE_OPTION ? (
                  <Field label="Other Company Type" required invalid={submitAttempted && missing.industry}>
                    <input
                      value={form.customIndustry}
                      onChange={(e) => setForm((p) => ({ ...p, customIndustry: e.target.value }))}
                      className={`field ${submitAttempted && missing.industry ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                      placeholder="Enter your company type"
                    />
                  </Field>
                ) : null}
                <Field label="Company Size" required invalid={submitAttempted && missing.companySize}>
                  <SearchableSelect
                    value={form.companySize}
                    onChange={(companySize) => setForm((p) => ({ ...p, companySize }))}
                    options={COMPANY_SIZE_OPTIONS}
                    placeholder="Select company size"
                    searchPlaceholder="Search company size"
                    className={`field ${submitAttempted && missing.companySize ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                  />
                </Field>
              </div>
            </Section>

            <Section title="Company Details" invalid={submitAttempted && sectionInvalid.details}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Website (Optional)">
                  <input
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                    className="field"
                    placeholder="https://"
                  />
                </Field>
                <Field label="Country">
                  <SearchableSelect
                    value={form.country}
                    onChange={(country) =>
                      setForm((p) => ({
                        ...p,
                        country,
                        provinceCode: String(country || '').trim().toLowerCase() === 'philippines' ? p.provinceCode : '',
                      }))
                    }
                    options={countryOptions}
                    placeholder="Select a country"
                    searchPlaceholder="Search countries"
                  />
                </Field>
                {isPhilippines ? (
                  <>
                    <Field label="Province" required invalid={submitAttempted && missing.provinceCode}>
                      <SearchableSelect
                        value={form.provinceCode}
                        onChange={(provinceCode) => setForm((p) => ({ ...p, provinceCode }))}
                        options={locationData.provinceOptions.map((province) => ({ value: province.code, label: province.label }))}
                        placeholder="Select a province"
                        searchPlaceholder="Search provinces"
                        className={`field ${submitAttempted && missing.provinceCode ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                      />
                    </Field>
                    <Field label="City / Municipality" required invalid={submitAttempted && missing.city}>
                      <SearchableSelect
                        value={form.city}
                        onChange={(city) => setForm((p) => ({ ...p, city }))}
                        options={cityOptions.map((city) => ({ value: city.name, label: city.name }))}
                        placeholder={form.provinceCode ? 'Select a city or municipality' : 'Select a province first'}
                        searchPlaceholder="Search cities"
                        disabled={!form.provinceCode}
                        className={`field ${submitAttempted && missing.city ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                      />
                    </Field>
                  </>
                ) : (
                  <Field label="City / State / Region (Optional)">
                    <input
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      className="field"
                      placeholder="Enter your location in this country"
                    />
                  </Field>
                )}
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

            <Section title="Contact Information" invalid={submitAttempted && sectionInvalid.contact}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Contact Email" required invalid={submitAttempted && missing.contactEmail}>
                  <input value={form.contactEmail} readOnly className={`field bg-[#f5f5f2] dark:bg-[#1a1d20]/60 ${submitAttempted && missing.contactEmail ? 'border-red-500' : ''}`} />
                </Field>
              </div>
            </Section>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#3a5a40] px-5 py-3 font-semibold text-white hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-60 dark:border dark:border-[#6f9b74]/30 dark:bg-[#353c44] dark:text-[#eceff2] dark:hover:bg-[#4a535d]"
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

function Section({ title, children, invalid: _invalid = false }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[#2f3e2f] dark:text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, full = false, children, invalid = false, required = false }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className={`mb-1 block text-sm font-semibold ${invalid ? 'text-red-700 dark:text-red-300' : 'text-[#3a5a40] dark:text-slate-200'}`}>
        {label}
        {required ? <span className="ml-1 text-red-600 dark:text-red-400">*</span> : null}
      </label>
      {children}
    </div>
  );
}
