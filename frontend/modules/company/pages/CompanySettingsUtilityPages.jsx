import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bell, Briefcase, Check, ChevronRight, Save } from 'lucide-react';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import { companyAPI } from '@companyFeatures/companyAPI';
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
const DEBUG_PROFILE_SYNC = process.env.NEXT_PUBLIC_DEBUG_PROFILE_SYNC === 'true';

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

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const logProfileSync = (label, payload) => {
  if (!DEBUG_PROFILE_SYNC || typeof window === 'undefined') {
    return;
  }
  void label;
  void payload;
};

function Header({ title, onBack }) {
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:border-[#444d57] dark:bg-[#22272b] dark:text-white dark:hover:bg-[#353c44]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <h2 className="mt-3 text-[28px] font-bold text-[#1c2b1f] dark:text-white">{title}</h2>
    </div>
  );
}

function PageShell({ title, onBack, children }) {
  return (
    <div className="mx-auto w-full max-w-[min(100%,900px)] px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pt-4 sm:px-5 sm:pb-10 sm:pt-6">
      <Header title={title} onBack={onBack} />
      {children}
    </div>
  );
}

function OptionRow({ icon: Icon, title, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl bg-[#f8fbf6] px-4 py-3.5 text-left transition-colors hover:bg-[#eef6ee] dark:bg-[#22272b] dark:hover:bg-[#353c44]/60"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3e8] text-[#3a5a40] dark:bg-[#2b3138] dark:text-[#e9c86b]">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="text-[16px] font-semibold text-[#1c2b1f] dark:text-white">{title}</span>
      </div>
      {selected ? <Check className="h-5 w-5 text-[#3a5a40] dark:text-[#e9c86b]" /> : <ChevronRight className="h-5 w-5 text-[#7c8e76] dark:text-[#adb5be]" />}
    </button>
  );
}

export function CompanyNotificationSettingsPage({ onBack, value, onChange }) {
  return (
    <PageShell title="Notifications" onBack={onBack}>
      <div className="space-y-2">
        <OptionRow icon={Briefcase} title="Jobs notifications only" selected={value === 'jobs_only'} onClick={() => onChange('jobs_only')} />
        <OptionRow icon={Bell} title="Jobs and messages" selected={value === 'jobs_and_messages'} onClick={() => onChange('jobs_and_messages')} />
        <OptionRow icon={Bell} title="All notifications" selected={value === 'all'} onClick={() => onChange('all')} />
      </div>
    </PageShell>
  );
}

export function CompanyInfoSettingsPage({ user, onBack, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationData, setLocationData] = useState({
    provinceOptions: [],
    provinceLabelByCode: {},
    provinceCodeByLabel: {},
    getCitiesForProvince: () => [],
  });
  const [form, setForm] = useState({
    companyName: user?.companyName || user?.username || '',
    logoUrl: user?.profileImage || '',
    industry: '',
    customIndustry: '',
    companySize: '',
    website: user?.website || '',
    description: user?.bio || '',
    provinceCode: '',
    city: '',
    country: 'Philippines',
    location: user?.address || '',
    contactEmail: user?.email || '',
    phoneNumber: user?.phone || '',
  });
  const countryOptions = useMemo(() => getCountryOptions(), []);
  const isPhilippines = String(form.country || '').trim().toLowerCase() === 'philippines';

  const cityOptions = useMemo(() => locationData.getCitiesForProvince(form.provinceCode), [form.provinceCode, locationData]);

  const applyOnboardingProfileToForm = (onboarding, userSnapshot) => {
    const fromOnboarding = (key, fallback = '') => (
      onboarding && Object.prototype.hasOwnProperty.call(onboarding, key)
        ? onboarding[key]
        : fallback
    );
    const initialIndustry = String(fromOnboarding('industry', userSnapshot?.industry || '') || '').trim();
    const isCustomIndustry = Boolean(initialIndustry) && !INDUSTRY_OPTIONS.includes(initialIndustry);

    setForm((prev) => ({
      ...prev,
      companyName: fromOnboarding('companyName', userSnapshot?.companyName || userSnapshot?.username || ''),
      logoUrl: fromOnboarding('logoUrl', userSnapshot?.profileImage || ''),
      industry: isCustomIndustry ? OTHER_COMPANY_TYPE_OPTION : initialIndustry,
      customIndustry: isCustomIndustry ? initialIndustry : '',
      companySize: fromOnboarding('companySize', userSnapshot?.companySize || ''),
      website: fromOnboarding('website', userSnapshot?.website || ''),
      description: fromOnboarding('description', userSnapshot?.bio || ''),
      location: fromOnboarding('location', userSnapshot?.address || ''),
      contactEmail: fromOnboarding('contactEmail', userSnapshot?.email || ''),
      phoneNumber: fromOnboarding('phoneNumber', userSnapshot?.phone || ''),
      provinceCode: '',
      city: '',
    }));
  };

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await companyAPI.getProfile();
        const onboarding = data?.company?.onboardingProfile || {};
        logProfileSync('settings-fetch-profile-response', onboarding);
        if (cancelled) return;
        applyOnboardingProfileToForm(onboarding, user);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Unable to load company settings.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    const loadLocations = async () => {
      const nextData = await loadProvinceCityData();
      if (!cancelled) {
        setLocationData(nextData);
      }
    };
    void loadLocations();
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

      const nextLocation = parseLocation(prev.location, locationData.provinceOptions, locationData.provinceCodeByLabel, locationData.getCitiesForProvince);
      return {
        ...prev,
        provinceCode: nextLocation.provinceCode,
        city: nextLocation.city,
        country: nextLocation.country || prev.country || 'Philippines',
        location: formatLocation(nextLocation.city, nextLocation.provinceCode, locationData.provinceLabelByCode, nextLocation.country || prev.country),
      };
    });
  }, [locationData]);

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

  const handleLogoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    void readFileAsDataUrl(file)
      .then((logoUrl) => {
        setForm((current) => ({ ...current, logoUrl }));
      })
      .catch((logoError) => setError(logoError?.message || 'Unable to read logo file.'));
  };

  const saveCompanySettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const industry = form.industry === OTHER_COMPANY_TYPE_OPTION ? String(form.customIndustry || '').trim() : String(form.industry || '').trim();
      const payload = {
        companyName: String(form.companyName || '').trim(),
        logoUrl: String(form.logoUrl || '').trim(),
        industry,
        companySize: String(form.companySize || '').trim(),
        description: String(form.description || '').trim(),
        website: String(form.website || '').trim(),
        location: String(form.location || '').trim(),
        contactEmail: String(form.contactEmail || '').trim(),
        phoneNumber: String(form.phoneNumber || '').trim(),
      };
      logProfileSync('settings-save-payload', payload);
      const response = await companyAPI.saveOnboardingProfile(payload);
      logProfileSync('settings-save-response', response);

      const refreshed = await companyAPI.getProfile();
      const refreshedOnboarding = refreshed?.company?.onboardingProfile || null;
      if (refreshedOnboarding) {
        applyOnboardingProfileToForm(refreshedOnboarding, user);
        logProfileSync('settings-form-after-save-refetch', refreshedOnboarding);
      }

      onUpdated?.(response?.company, {
        name: payload.companyName,
        logo: payload.logoUrl,
        shortDescription: payload.description,
        description: payload.description,
        location: payload.location,
        website: payload.website,
        industry: payload.industry,
        companySize: payload.companySize,
        phone: payload.phoneNumber,
      });
      setSuccess('Company settings saved.');
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save company settings.');
    } finally {
      setSaving(false);
    }
  };

  const companyInitial = (form.companyName || 'C').charAt(0).toUpperCase();

  return (
    <PageShell title="Company information" onBack={onBack}>
      {error ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {success ? <p className="mt-1 text-sm text-[#3a5a40] dark:text-[#f0c766]">{success}</p> : null}
      {loading ? <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#b3bcc5]">Loading company settings...</p> : null}

      <div className="mt-2 rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-4 shadow-sm shadow-black/5 dark:border-[#444d57] dark:bg-[#22272b] sm:px-6 sm:py-5">
        <div className="mb-5 flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#f1f5eb] text-xl font-bold text-[#3a5a40] dark:bg-[#353c44] dark:text-white sm:h-16 sm:w-16 sm:text-2xl">
            {form.logoUrl ? <img src={form.logoUrl} alt="Company logo" className="h-full w-full object-cover" /> : companyInitial}
          </div>
          <div>
            <p className="text-base font-bold text-[#1c2b1f] dark:text-white">Company branding</p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#a3b18a] px-3 py-2 text-sm font-semibold text-[#344e41] hover:bg-[#eef6ee] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]">
              Upload logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Field label="Company Name" required>
            <input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} className="field" />
          </Field>
          <Field label="Company Type" required>
            <SearchableSelect
              value={form.industry}
              onChange={(industry) => setForm((p) => ({ ...p, industry }))}
              options={COMPANY_TYPE_OPTIONS}
              placeholder="Select company type"
              searchPlaceholder="Search company types"
              className="field"
            />
          </Field>

          {form.industry === OTHER_COMPANY_TYPE_OPTION ? (
            <Field label="Other Company Type" required>
              <input value={form.customIndustry} onChange={(event) => setForm((current) => ({ ...current, customIndustry: event.target.value }))} className="field" />
            </Field>
          ) : null}

          <Field label="Company Size" required>
            <SearchableSelect
              value={form.companySize}
              onChange={(companySize) => setForm((p) => ({ ...p, companySize }))}
              options={COMPANY_SIZE_OPTIONS}
              placeholder="Select company size"
              searchPlaceholder="Search company size"
              className="field"
            />
          </Field>

          <Field label="Website">
            <input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} className="field" placeholder="https://" />
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
              className="field"
            />
          </Field>

          {isPhilippines ? (
            <>
              <Field label="Province" required>
                <SearchableSelect
                  value={form.provinceCode}
                  onChange={(provinceCode) => setForm((p) => ({ ...p, provinceCode }))}
                  options={locationData.provinceOptions.map((province) => ({ value: province.code, label: province.label }))}
                  placeholder="Select a province"
                  searchPlaceholder="Search provinces"
                  className="field"
                />
              </Field>

              <Field label="City / Municipality" required>
                <SearchableSelect
                  value={form.city}
                  onChange={(city) => setForm((p) => ({ ...p, city }))}
                  options={cityOptions.map((city) => ({ value: city.name, label: city.name }))}
                  placeholder={form.provinceCode ? 'Select a city or municipality' : 'Select a province first'}
                  searchPlaceholder="Search cities"
                  disabled={!form.provinceCode}
                  className="field"
                />
              </Field>
            </>
          ) : (
            <Field label="City / State / Region">
              <input
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                className="field"
                placeholder="Enter your location in this country (optional)"
              />
            </Field>
          )}

          <Field label="Company Description" full>
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="field min-h-24" />
          </Field>

          <Field label="Contact Email" required>
            <input value={form.contactEmail} readOnly className="field bg-[#edf3e8] dark:bg-[#2f343b]" />
          </Field>
          <Field label="Phone Number">
            <input value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} className="field" />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={saveCompanySettings}
            disabled={saving || loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save company settings'}
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, children, full = false, required = false }) {
  return (
    <div className={full ? 'lg:col-span-2 space-y-1.5' : 'space-y-1.5'}>
      <label className="text-sm font-semibold text-[#1c2b1f] dark:text-white">
        {label}
        {required ? <span className="ml-1 text-red-600 dark:text-red-400">*</span> : null}
      </label>
      {children}
    </div>
  );
}
