import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  ChevronRight,
  Globe,
  Moon,
  Search,
  Save,
} from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import { companyAPI } from '@companyFeatures/companyAPI';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
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

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

function SettingsRow({ icon: Icon, title, subtitle, onClick, rightElement }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl bg-[#f8fbf6] px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[#eef6ee] max-[360px]:px-3 max-[360px]:py-3 dark:bg-[#162842] dark:hover:bg-[#1e3a5f]/60 sm:py-4"
    >
      <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#b8d4e8] sm:h-6 sm:w-6" />
        <p className="text-[16px] font-semibold leading-snug text-[#1c2b1f] dark:text-white sm:text-[17px]">{title}</p>
      </div>
      {rightElement || <ChevronRight className="h-5 w-5 text-[#7c8e76] dark:text-[#7d9ab8]" />}
    </button>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="px-1 pb-2 pt-5 sm:pt-6">
      <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#5f6f52] dark:text-[#9fb4ca]">{title}</h2>
    </div>
  );
}

export default function CompanySettingsPage({ user, onUpdated }) {
  const { theme, toggleTheme } = useTheme();
  const [introReady, setIntroReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCompanyInfoForm, setShowCompanyInfoForm] = useState(false);
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
    location: user?.address || '',
    contactEmail: user?.email || '',
    phoneNumber: user?.phone || '',
  });

  const cityOptions = useMemo(() => locationData.getCitiesForProvince(form.provinceCode), [form.provinceCode, locationData]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await companyAPI.getProfile();
        const onboarding = data?.company?.onboardingProfile || {};
        const initialIndustry = String(onboarding?.industry || user?.industry || '').trim();
        const isCustomIndustry = Boolean(initialIndustry) && !INDUSTRY_OPTIONS.includes(initialIndustry);
        if (cancelled) return;

        setForm((prev) => ({
          ...prev,
          companyName: onboarding?.companyName || user?.companyName || user?.username || '',
          logoUrl: onboarding?.logoUrl || user?.profileImage || '',
          industry: isCustomIndustry ? OTHER_COMPANY_TYPE_OPTION : initialIndustry,
          customIndustry: isCustomIndustry ? initialIndustry : '',
          companySize: onboarding?.companySize || user?.companySize || '',
          website: onboarding?.website || user?.website || '',
          description: onboarding?.description || user?.bio || '',
          location: onboarding?.location || user?.address || '',
          contactEmail: onboarding?.contactEmail || user?.email || '',
          phoneNumber: onboarding?.phoneNumber || user?.phone || '',
        }));
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
        location: formatLocation(nextLocation.city, nextLocation.provinceCode, locationData.provinceLabelByCode),
      };
    });
  }, [locationData]);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIntroReady(true);
      return;
    }

    const frame = window.requestAnimationFrame(() => setIntroReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
      const response = await companyAPI.saveOnboardingProfile(payload);
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

  const settingsData = useMemo(
    () => [
      {
        title: 'Company account',
        subtitle: 'Manage all complete-profile fields in one place.',
        items: [
          {
            icon: Briefcase,
            title: 'Company information',
            subtitle: 'Identity, location, profile details, and contact info',
            onClick: () => {
              setShowCompanyInfoForm(true);
              document.getElementById('company-info-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            },
          },
        ],
      },
      {
        title: 'Workspace',
        subtitle: 'Quick shortcuts for hiring and communication.',
        items: [
          { icon: Briefcase, title: 'Manage jobs', subtitle: 'Open your job listings workspace', onClick: () => navigate(COMPANY_PATHS.jobs) },
          { icon: Bell, title: 'Notifications', subtitle: 'Review company alerts and updates', onClick: () => navigate(COMPANY_PATHS.notifications) },
          { icon: Globe, title: 'Public profile', subtitle: 'Preview your public company page', onClick: () => navigate(COMPANY_PATHS.publicProfile) },
        ],
      },
      {
        title: 'Preferences',
        subtitle: 'Adjust your workspace appearance.',
        items: [
          {
            icon: Moon,
            title: 'Dark mode',
            subtitle: theme === 'dark' ? 'On' : 'Off',
            onClick: toggleTheme,
            rightElement: (
              <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 ease-out ${theme === 'dark' ? 'bg-[#3ba9d6]' : 'bg-[#c8d5b9]'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-150 ease-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            ),
          },
        ],
      },
    ],
    [theme, toggleTheme]
  );

  const filteredData = settingsData
    .map((section) => {
      const query = searchQuery.toLowerCase();
      const filteredItems = section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(query))
      );
      return { ...section, items: filteredItems };
    })
    .filter((section) => section.items.length > 0 || section.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const companyInitial = (form.companyName || 'C').charAt(0).toUpperCase();

  return (
    <div className={`mx-auto flex w-full max-w-[min(100%,900px)] flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pt-4 transition-all duration-300 ease-out sm:px-5 sm:pb-10 sm:pt-6 ${introReady ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}>
      <div className="sticky top-0 z-10 -mx-4 bg-[#d8d5cc]/95 px-4 pb-3 pt-1 backdrop-blur-sm dark:bg-[#0f1b2d]/95 sm:-mx-5 sm:px-5">
        <div>
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.dashboard)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:hover:bg-[#1e3a5f]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="mt-3 text-[28px] font-bold text-[#1c2b1f] dark:text-white">Settings</h1>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5f6f52] dark:text-[#8fb2cf]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search settings"
            className="w-full rounded-[20px] border border-[#bfd0af] bg-[#f8fbf6] py-2.5 pl-10 pr-4 text-[15px] font-medium text-[#1c2b1f] outline-none placeholder:text-[#6b7c6a] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:placeholder:text-[#8ba9c0] dark:focus:ring-[#3ba9d6]/25"
          />
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-[#3a5a40] dark:text-[#7fd0ee]">{success}</p> : null}
      {loading ? <p className="mt-2 text-sm text-[#5f6f52] dark:text-[#9fb4ca]">Loading company settings...</p> : null}

      <div className="flex-1 pt-2">
        {filteredData.length > 0 ? (
          filteredData.map((section, idx) => (
            <section key={idx}>
              <SectionHeading title={section.title} subtitle={section.subtitle} />
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} id={section.title === 'Company account' && item.title === 'Company information' ? 'company-info-row' : undefined}>
                    <SettingsRow
                      icon={item.icon}
                      title={item.title}
                      subtitle={item.subtitle}
                      onClick={item.onClick}
                      rightElement={item.rightElement}
                    />
                  </div>
                ))}
                {section.title === 'Company account' && showCompanyInfoForm ? (
                  <div className="mt-2 rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-4 shadow-sm shadow-black/5 dark:border-[#2a4a6f] dark:bg-[#162842] sm:px-6 sm:py-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-[#1c2b1f] dark:text-white">Company information</h3>
                      <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#9fb4ca]">This matches your complete company profile fields.</p>
                    </div>

                    <div className="mb-5 flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#f1f5eb] text-xl font-bold text-[#3a5a40] dark:bg-[#1e3a5f] dark:text-white sm:h-16 sm:w-16 sm:text-2xl">
                        {form.logoUrl ? <img src={form.logoUrl} alt="Company logo" className="h-full w-full object-cover" /> : companyInitial}
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#1c2b1f] dark:text-white">Company branding</p>
                        <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#a3b18a] px-3 py-2 text-sm font-semibold text-[#344e41] hover:bg-[#eef6ee] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f]">
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

                      <Field label="Country">
                        <input value="Philippines" readOnly className="field bg-[#edf3e8] dark:bg-[#122740]" />
                      </Field>

                      <Field label="Saved Location" full>
                        <input value={form.location} readOnly className="field bg-[#edf3e8] dark:bg-[#122740]" />
                      </Field>

                      <Field label="Company Description" full>
                        <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="field min-h-24" />
                      </Field>

                      <Field label="Contact Email" required>
                        <input value={form.contactEmail} readOnly className="field bg-[#edf3e8] dark:bg-[#122740]" />
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] sm:w-auto"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save company settings'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ))
        ) : (
          <div className="mt-5 rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-10 text-center shadow-sm shadow-black/5 dark:border-[#2a4a6f] dark:bg-[#162842]">
            <p className="text-[#5f6f52] dark:text-[#b8d4e8]">No settings match your search.</p>
          </div>
        )}
      </div>
    </div>
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
