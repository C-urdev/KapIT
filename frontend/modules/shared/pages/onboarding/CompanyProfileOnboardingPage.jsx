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

const inputClass = (invalid) => [
  'min-h-11 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none',
  'placeholder:text-slate-400 focus-visible:border-[#0f5a48] focus-visible:ring-4 focus-visible:ring-[#0f5a48]/15',
  'dark:border-slate-600 dark:bg-[#1b2024] dark:text-slate-100 dark:placeholder:text-slate-500',
  'dark:focus-visible:border-[#71b69b] dark:focus-visible:ring-[#71b69b]/20',
  'transition-[border-color,box-shadow,background-color] duration-150 ease-out',
  invalid ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/15 dark:border-red-400' : 'border-slate-200 hover:border-slate-300 dark:hover:border-slate-500',
].join(' ');

export default function CompanyProfileOnboardingPage({ user, onSubmit, onLogout }) {
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
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
    contactName: user?.name || '',
    contactEmail: user?.email || '',
    companyName: user?.companyName || user?.username || '',
    logoUrl: user?.profileImage || '',
    industry: initialUsesCustomType ? OTHER_COMPANY_TYPE_OPTION : initialIndustry,
    customIndustry: initialUsesCustomType ? initialIndustry : '',
    companySize: user?.companySize || '',
    website: user?.website || '',
    country: 'Philippines',
    provinceCode: '',
    city: '',
    location: String(user?.address || ''),
    phoneNumber: user?.phone || '',
    description: user?.bio || '',
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

    setForm((current) => {
      if (current.provinceCode || current.city) {
        return current;
      }

      const nextLocation = parseLocation(
        user?.address || '',
        locationData.provinceOptions,
        locationData.provinceCodeByLabel,
        locationData.getCitiesForProvince
      );

      return {
        ...current,
        provinceCode: nextLocation.provinceCode,
        city: nextLocation.city,
        country: nextLocation.country || current.country || 'Philippines',
        location: formatLocation(nextLocation.city, nextLocation.provinceCode, locationData.provinceLabelByCode, nextLocation.country || current.country),
      };
    });
  }, [locationData, user]);

  useEffect(() => {
    if (!isPhilippines) {
      return;
    }
    setForm((current) => {
      const nextCities = locationData.getCitiesForProvince(current.provinceCode);
      const hasCity = nextCities.some((option) => option.name === current.city);
      const nextCity = hasCity ? current.city : '';
      return {
        ...current,
        city: nextCity,
        location: formatLocation(nextCity, current.provinceCode, locationData.provinceLabelByCode, current.country),
      };
    });
  }, [form.provinceCode, locationData, isPhilippines]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      location: formatLocation(current.city, current.provinceCode, locationData.provinceLabelByCode, current.country),
    }));
  }, [form.city, form.country, locationData]);

  const finalIndustry = form.industry === OTHER_COMPANY_TYPE_OPTION ? form.customIndustry : form.industry;

  const missing = useMemo(() => ({
    contactName: !String(form.contactName).trim(),
    contactEmail: !String(form.contactEmail).trim(),
    companyName: !String(form.companyName).trim(),
    industry: !String(finalIndustry).trim(),
    companySize: !String(form.companySize).trim(),
    location: !String(form.location).trim(),
    provinceCode: isPhilippines && !String(form.provinceCode).trim(),
    city: isPhilippines && !String(form.city).trim(),
  }), [finalIndustry, form, isPhilippines]);

  const isComplete = useMemo(() => !Object.values(missing).some(Boolean), [missing]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const controlStyle = (invalid = false, readOnly = false) => ({
    backgroundColor: isDark ? (readOnly ? '#171c1f' : '#1b2024') : (readOnly ? '#f8fafc' : '#ffffff'),
    borderColor: invalid ? (isDark ? '#f87171' : '#ef4444') : (isDark ? '#475569' : '#e2e8f0'),
    color: isDark ? '#f1f5f9' : '#0f172a',
    colorScheme: isDark ? 'dark' : 'light',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!isComplete) {
      setSubmitAttempted(true);
      toast.warning('Please fill in the highlighted required fields.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit?.({
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        companyName: form.companyName.trim(),
        logoUrl: form.logoUrl,
        industry: finalIndustry.trim(),
        companySize: form.companySize,
        website: form.website.trim(),
        location: form.location.trim(),
        phoneNumber: form.phoneNumber.trim(),
        description: form.description.trim(),
      });
    } catch (error) {
      const status = Number(error?.status || 0);
      const message = String(error?.message || '').trim();
      if (status === 400) {
        setSubmitAttempted(true);
        toast.warning(message || 'Please fill in the required fields.');
      } else if (status === 401) {
        toast.error('Your session expired. Please log in again.');
      } else {
        toast.error(message || 'Unable to save your company profile right now. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-onboarding min-h-screen bg-[#f7f8f8] text-slate-900 dark:bg-[#101416] dark:text-slate-100" style={{ backgroundColor: isDark ? '#101416' : '#f7f8f8', color: isDark ? '#f1f5f9' : '#0f172a' }}>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#101416]/95" style={{ backgroundColor: isDark ? '#101416' : '#ffffff', borderColor: isDark ? '#1f2937' : '#e2e8f0' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <button type="button" onClick={() => navigate('/')} className="inline-flex min-h-11 items-center gap-2.5 rounded-lg px-1 text-slate-700 transition-colors duration-150 hover:text-[#0f5a48] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0f5a48]/15 dark:text-slate-200 dark:hover:text-[#9ad2ba]" style={{ color: isDark ? '#e2e8f0' : '#334155' }}>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <KapITLogo className="h-9 w-9 rounded-lg bg-white object-contain dark:bg-slate-100" />
            <span className="text-lg font-bold tracking-tight">KapIT</span>
          </button>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0f5a48]/15 dark:text-slate-200 dark:hover:bg-slate-800" style={{ color: isDark ? '#e2e8f0' : '#334155' }} aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button type="button" onClick={onLogout} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-300 px-3.5 text-sm font-semibold text-red-700 transition-colors duration-150 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/15 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/35">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-950 [text-wrap:balance] dark:text-white" style={{ color: isDark ? '#ffffff' : '#020617' }}>Complete your company profile</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-600 [text-wrap:pretty] dark:text-slate-400" style={{ color: isDark ? '#94a3b8' : '#475569' }}>Set up the company details candidates will see before you start posting roles.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_4px_rgba(15,23,42,0.03),0_14px_36px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-[#20262a] dark:shadow-[0_16px_40px_rgba(0,0,0,0.28)] sm:p-8" style={{ backgroundColor: isDark ? '#20262a' : '#ffffff', borderColor: isDark ? '#475569' : '#e2e8f0' }}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <Field label="Company logo" full isDark={isDark}>
              <CompanyLogoUpload value={form.logoUrl} onChange={(logoUrl) => setForm((current) => ({ ...current, logoUrl }))} compact />
            </Field>
            <Field label="Your name" required invalid={submitAttempted && missing.contactName} isDark={isDark}>
              <input value={form.contactName} onChange={update('contactName')} className={inputClass(submitAttempted && missing.contactName)} style={controlStyle(submitAttempted && missing.contactName)} placeholder="Jane Doe" autoComplete="name" required />
            </Field>
            <Field label="Work email" required invalid={submitAttempted && missing.contactEmail} isDark={isDark}>
              <input value={form.contactEmail} className={`${inputClass(submitAttempted && missing.contactEmail)} cursor-not-allowed bg-slate-50 text-slate-600 dark:bg-[#171c1f] dark:text-slate-300`} style={controlStyle(submitAttempted && missing.contactEmail, true)} placeholder="jane@company.com" type="email" autoComplete="email" readOnly aria-readonly="true" required />
            </Field>
            <Field label="Company name" required invalid={submitAttempted && missing.companyName} isDark={isDark}>
              <input value={form.companyName} onChange={update('companyName')} className={inputClass(submitAttempted && missing.companyName)} style={controlStyle(submitAttempted && missing.companyName)} placeholder="Acme, Inc." autoComplete="organization" required />
            </Field>
            <Field label="Phone" isDark={isDark}>
              <input value={form.phoneNumber} onChange={update('phoneNumber')} className={inputClass(false)} style={controlStyle()} placeholder="+63 912 345 6789" autoComplete="tel" inputMode="tel" />
            </Field>
            <Field label="Company type" required invalid={submitAttempted && missing.industry} isDark={isDark}>
              <SearchableSelect
                value={form.industry}
                onChange={(industry) => setForm((current) => ({ ...current, industry }))}
                options={COMPANY_TYPE_OPTIONS}
                placeholder="Select company type"
                searchPlaceholder="Search company types"
                className={inputClass(submitAttempted && missing.industry)}
              />
            </Field>
            {form.industry === OTHER_COMPANY_TYPE_OPTION ? (
              <Field label="Other company type" required invalid={submitAttempted && missing.industry} isDark={isDark}>
                <input value={form.customIndustry} onChange={update('customIndustry')} className={inputClass(submitAttempted && missing.industry)} style={controlStyle(submitAttempted && missing.industry)} placeholder="Enter your company type" required />
              </Field>
            ) : null}
            <Field label="Company size" required invalid={submitAttempted && missing.companySize} isDark={isDark}>
              <SearchableSelect
                value={form.companySize}
                onChange={(companySize) => setForm((current) => ({ ...current, companySize }))}
                options={COMPANY_SIZE_OPTIONS}
                placeholder="Select company size"
                searchPlaceholder="Search company size"
                className={inputClass(submitAttempted && missing.companySize)}
              />
            </Field>
            <Field label="Website" isDark={isDark}>
              <input value={form.website} onChange={update('website')} className={inputClass(false)} style={controlStyle()} placeholder="https://" autoComplete="url" />
            </Field>
            <Field label="Country" isDark={isDark}>
              <SearchableSelect
                value={form.country}
                onChange={(country) =>
                  setForm((current) => ({
                    ...current,
                    country,
                    provinceCode: String(country || '').trim().toLowerCase() === 'philippines' ? current.provinceCode : '',
                  }))}
                options={countryOptions}
                placeholder="Select country"
                searchPlaceholder="Search countries"
                className={inputClass(false)}
              />
            </Field>
            {isPhilippines ? (
              <>
                <Field label="Province" required invalid={submitAttempted && missing.provinceCode} isDark={isDark}>
                  <SearchableSelect
                    value={form.provinceCode}
                    onChange={(provinceCode) => setForm((current) => ({ ...current, provinceCode }))}
                    options={locationData.provinceOptions.map((province) => ({ value: province.code, label: province.label }))}
                    placeholder="Select province"
                    searchPlaceholder="Search provinces"
                    className={inputClass(submitAttempted && missing.provinceCode)}
                  />
                </Field>
                <Field label="City / Municipality" required invalid={submitAttempted && missing.city} isDark={isDark}>
                  <SearchableSelect
                    value={form.city}
                    onChange={(city) => setForm((current) => ({ ...current, city }))}
                    options={cityOptions.map((city) => ({ value: city.name, label: city.name }))}
                    placeholder={form.provinceCode ? 'Select city or municipality' : 'Select a province first'}
                    searchPlaceholder="Search cities"
                    disabled={!form.provinceCode}
                    className={inputClass(submitAttempted && missing.city)}
                  />
                </Field>
              </>
            ) : (
              <Field label="City / Region" required invalid={submitAttempted && missing.location} isDark={isDark}>
                <input value={form.city} onChange={update('city')} className={inputClass(submitAttempted && missing.location)} style={controlStyle(submitAttempted && missing.location)} placeholder="City, state, or region" required />
              </Field>
            )}
            <Field label="About the company" full isDark={isDark}>
              <textarea value={form.description} onChange={update('description')} className={`${inputClass(false)} min-h-28 resize-y`} style={controlStyle()} placeholder="Tell candidates what your company does, who you serve, and what your team is like." />
            </Field>
            <Field label="Profile context" full isDark={isDark}>
              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-[#171c1f] dark:text-slate-300">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0f5a48] dark:text-[#9ad2ba]" aria-hidden="true" />
                <span>Hiring requirements, ATS details, timelines, and must-haves belong on each job post so every role can have its own criteria.</span>
              </div>
            </Field>
          </div>

          <button type="submit" disabled={saving} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0f5a48] px-5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-[#0b493a] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0f5a48]/25 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#176c57] dark:hover:bg-[#218069] dark:focus-visible:ring-[#9ad2ba]/25" style={{ backgroundColor: isDark ? '#176c57' : '#0f5a48', color: '#ffffff' }}>
            {saving ? 'Saving...' : 'Save company profile'}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children, full = false, invalid = false, required = false, isDark = false }) {
  return (
    <label className={`block ${full ? 'md:col-span-2' : ''}`}>
      <span className={`mb-2 block text-sm font-medium ${invalid ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-100'}`} style={{ color: invalid ? (isDark ? '#fca5a5' : '#b91c1c') : (isDark ? '#f1f5f9' : '#1e293b') }}>
        {label}{required ? <span className="ml-1 text-red-600 dark:text-red-400">*</span> : null}
      </span>
      {children}
    </label>
  );
}
