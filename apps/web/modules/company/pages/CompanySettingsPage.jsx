import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  ChevronRight,
  Globe,
  Moon,
  Search,
  MapPin,
  Save,
} from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import { companyAPI } from '@companyFeatures/companyAPI';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

function SettingsRow({ icon: Icon, title, subtitle, onClick, rightElement }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[#eef6ee] dark:hover:bg-[#1e3a5f]/55 sm:py-4"
    >
      <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#b8d4e8] sm:h-6 sm:w-6" />
        <div>
          <p className="text-[16px] font-semibold leading-snug text-[#1c2b1f] dark:text-white sm:text-[17px]">{title}</p>
          {subtitle ? <p className="text-sm leading-snug text-[#5f6f52] dark:text-[#9fb4ca]">{subtitle}</p> : null}
        </div>
      </div>
      {rightElement || <ChevronRight className="h-5 w-5 text-[#7c8e76] dark:text-[#7d9ab8]" />}
    </button>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="px-1 pb-2 pt-5 sm:pt-6">
      <h2 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-[13px] leading-tight text-[#5f6f52] dark:text-[#9fb4ca]">{subtitle}</p> : null}
    </div>
  );
}

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export default function CompanySettingsPage({ user, onUpdated }) {
  const { theme, toggleTheme } = useTheme();
  const [introReady, setIntroReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCompanyInfoForm, setShowCompanyInfoForm] = useState(false);
  const [form, setForm] = useState({
    name: user?.companyName || user?.username || '',
    shortDescription: user?.bio || '',
    location: user?.address || '',
    website: user?.website || '',
    logo: user?.profileImage || '',
  });

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await companyAPI.getProfile();
        const company = data?.company || {};
        if (cancelled) return;

        setForm({
          name: company?.name || user?.companyName || user?.username || '',
          shortDescription: company?.short_description || user?.bio || '',
          location: company?.location || user?.address || '',
          website: company?.website || user?.website || '',
          logo: company?.logo || user?.profileImage || '',
        });
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

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

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
        setForm((current) => ({ ...current, logo: logoUrl }));
      })
      .catch((logoError) => setError(logoError?.message || 'Unable to read logo file.'));
  };

  const saveCompanySettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: String(form.name || '').trim(),
        shortDescription: String(form.shortDescription || '').trim(),
        location: String(form.location || '').trim(),
        website: String(form.website || '').trim(),
        logo: String(form.logo || '').trim(),
      };
      const response = await companyAPI.updateProfile(payload);
      onUpdated?.(response?.company, payload);
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
        subtitle: 'Manage the information candidates and developers see.',
        items: [
              {
                icon: Briefcase,
                title: 'Company information',
                subtitle: 'Name, logo, summary, location and website',
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

  const companyInitial = (form.name || 'C').charAt(0).toUpperCase();

  return (
    <div className={`mx-auto flex w-full max-w-[min(100%,900px)] flex-col px-4 pb-16 pt-4 transition-all duration-300 ease-out sm:px-5 sm:pb-8 sm:pt-6 ${introReady ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}>
      <div className="sticky top-0 z-10 pb-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.dashboard)}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:hover:bg-[#1e3a5f]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
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

      <div className="flex-1">
        {filteredData.length > 0 ? (
          filteredData.map((section, idx) => (
            <section key={idx}>
              <SectionHeading title={section.title} subtitle={section.subtitle} />
              <div className="overflow-hidden rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] shadow-sm shadow-black/5 dark:border-[#2a4a6f] dark:bg-[#162842]">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    id={section.title === 'Company account' && item.title === 'Company information' ? 'company-info-row' : undefined}
                    className={itemIdx > 0 ? 'border-t border-[#d8e3cc] dark:border-[#2a4a6f]' : ''}
                  >
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
                  <div className="border-t border-[#d8e3cc] px-4 py-4 dark:border-[#2a4a6f] sm:px-6 sm:py-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-[#1c2b1f] dark:text-white">Company information</h3>
                      <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#9fb4ca]">Update what candidates see first: branding, profile details, and contact context.</p>
                    </div>

                    <div className="mb-5 flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#f1f5eb] text-xl font-bold text-[#3a5a40] dark:bg-[#1e3a5f] dark:text-white sm:h-16 sm:w-16 sm:text-2xl">
                        {form.logo ? <img src={form.logo} alt="Company logo" className="h-full w-full object-cover" /> : companyInitial}
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
                      <Field label="Company name">
                        <input
                          value={form.name}
                          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                          className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2.5 text-sm text-[#1c2b1f] outline-none placeholder:text-[#6b7c6a] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:placeholder:text-[#8ba9c0] dark:focus:ring-[#3ba9d6]/25"
                          placeholder="Your company name"
                        />
                      </Field>
                      <Field label="Website">
                        <input
                          value={form.website}
                          onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
                          className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2.5 text-sm text-[#1c2b1f] outline-none placeholder:text-[#6b7c6a] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:placeholder:text-[#8ba9c0] dark:focus:ring-[#3ba9d6]/25"
                          placeholder="https://"
                        />
                      </Field>
                      <Field label="Location">
                        <div className="relative">
                          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6f52] dark:text-[#8fb2cf]" />
                          <input
                            value={form.location}
                            onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                            className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] py-2.5 pl-9 pr-3 text-sm text-[#1c2b1f] outline-none placeholder:text-[#6b7c6a] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:placeholder:text-[#8ba9c0] dark:focus:ring-[#3ba9d6]/25"
                            placeholder="City, Province"
                          />
                        </div>
                      </Field>
                      <Field label="Short description">
                        <input
                          value={form.shortDescription}
                          onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))}
                          className="w-full rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2.5 text-sm text-[#1c2b1f] outline-none placeholder:text-[#6b7c6a] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:placeholder:text-[#8ba9c0] dark:focus:ring-[#3ba9d6]/25"
                          placeholder="What your company does"
                        />
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

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-[#1c2b1f] dark:text-white">{label}</label>
      {children}
    </div>
  );
}
