import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import DeveloperCard from '@companyComponents/CompanyDeveloperCard';
import { useDeveloperSearch } from '@companyFeatures/companyHooks';
import { TECH_SKILL_OPTIONS, OTHER_SKILL_VALUE } from '@companyFeatures/companySkillOptions';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';
import { getPublicProfile, getStoredUser } from '@sharedServices/authService';
import { loadProvinceCityData } from '@sharedUtils/philippinesLocations';

const EMPTY_FILTERS = {
  q: '',
  skill: '',
  customSkill: '',
  minExperience: '',
  customExperience: '',
  location: '',
};

const EXPERIENCE_OPTIONS = [
  { value: '1', label: '1+ years' },
  { value: '2', label: '2+ years' },
  { value: '3', label: '3+ years' },
  { value: '5', label: '5+ years' },
  { value: '7', label: '7+ years' },
  { value: '10', label: '10+ years' },
  { value: 'Other', label: 'Other' },
];

export default function CompanySearchDevelopersPage() {
  const viewer = getStoredUser();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterPopupPosition, setFilterPopupPosition] = useState({ top: 0, left: 0 });
  const [provinceOptions, setProvinceOptions] = useState([]);
  const { developers, loading, error } = useDeveloperSearch(appliedFilters);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const filterPopupRef = useRef(null);
  const filterButtonRef = useRef(null);
  const skillOptions = useMemo(
    () => TECH_SKILL_OPTIONS
      .filter((skill) => skill !== OTHER_SKILL_VALUE)
      .map((skill) => ({ value: skill, label: skill }))
      .concat({ value: OTHER_SKILL_VALUE, label: OTHER_SKILL_VALUE }),
    []
  );

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value || '').trim()),
    [appliedFilters]
  );

  const handleViewProfile = async (developer) => {
    if (!developer?.id) return;
    setProfileLoading(true);
    try {
      const data = await getPublicProfile(developer.id);
      setProfile({ ...developer, ...data });
    } catch {
      setProfile(developer);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleMessage = (developer) => {
    if (!developer?.id) return;
    navigate(`${COMPANY_PATHS.messages}?contact=${encodeURIComponent(developer.id)}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const normalizedSkill = String(filters.skill || '').trim() === OTHER_SKILL_VALUE
      ? String(filters.customSkill || '').trim()
      : String(filters.skill || '').trim();
    const normalizedExperience = String(filters.minExperience || '').trim() === 'Other'
      ? String(filters.customExperience || '').trim()
      : String(filters.minExperience || '').trim();

    setAppliedFilters({
      q: String(filters.q || '').trim(),
      skill: normalizedSkill,
      minExperience: normalizedExperience,
      location: String(filters.location || '').trim(),
    });
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const query = String(params.get('query') || '').trim();
    if (!query) return;
    setFilters((current) => ({ ...current, q: query }));
    setAppliedFilters((current) => ({ ...current, q: query }));
  }, []);

  useEffect(() => {
    if (!developers.length) {
      setSelectedDeveloper(null);
      return;
    }

    setSelectedDeveloper((current) => {
      if (current?.id) {
        const match = developers.find((developer) => developer.id === current.id);
        if (match) {
          return match;
        }
      }
      return developers[0];
    });
  }, [developers]);

  useEffect(() => {
    let cancelled = false;

    const loadProvinces = async () => {
      const data = await loadProvinceCityData();
      if (!cancelled) {
        setProvinceOptions((data?.provinceOptions || []).map((province) => ({ value: province.label, label: province.label })));
      }
    };

    loadProvinces();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showAdvancedFilters) return undefined;

    const updatePopupPosition = () => {
      const trigger = filterButtonRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const popupWidth = Math.min(window.innerWidth * 0.92, 420);
      const desiredLeft = rect.right - popupWidth;
      const minLeft = 12;
      const maxLeft = Math.max(minLeft, window.innerWidth - popupWidth - 12);

      setFilterPopupPosition({
        top: rect.bottom + 12,
        left: Math.min(Math.max(desiredLeft, minLeft), maxLeft),
      });
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowAdvancedFilters(false);
      }
    };

    updatePopupPosition();
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePopupPosition);
    window.addEventListener('scroll', updatePopupPosition, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePopupPosition);
      window.removeEventListener('scroll', updatePopupPosition, true);
    };
  }, [showAdvancedFilters]);

  return (
    <div className="company-workspace-page space-y-6">
      <div>
        <h1 className="company-workspace-page-title">Talent search</h1>
        <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Find developers by role, skill, experience, or location.</p>
      </div>

      <form
        onSubmit={handleSearch}
        className="transition-colors duration-300"
      >
        <div className={`flex flex-col ${hasActiveFilters ? 'gap-4' : 'gap-3'}`}>
          <div className="company-workspace-toolbar">
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <label className="company-workspace-control flex min-w-0 items-center gap-2.5 px-3.5">
                <Search className="h-[18px] w-[18px] shrink-0 text-[var(--workspace-text-muted)]" />
                <span className="sr-only">Search developers</span>
                <input
                  value={filters.q}
                  onChange={(event) => handleFilterChange('q', event.target.value)}
                  placeholder="Search by name, desired role, education..."
                  className="h-10 min-w-0 flex-1 border-0 bg-transparent py-2 text-[var(--workspace-text-strong)] outline-none placeholder:text-[var(--workspace-text-muted)]"
                />
              </label>
              <button
                type="submit"
                className="company-workspace-primary-button inline-flex h-10 shrink-0 items-center justify-center gap-2 px-4"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </div>

            <div ref={filterPopupRef} className="relative lg:min-w-fit">
              <button
                ref={filterButtonRef}
                type="button"
                onClick={() => setShowAdvancedFilters((current) => !current)}
                className="company-workspace-secondary-button inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 lg:w-auto"
                aria-expanded={showAdvancedFilters}
                aria-controls="developer-search-filters-modal"
              >
                <SlidersHorizontal className="h-4 w-4 text-[var(--workspace-primary)]" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <ActiveChip label="Keyword" value={appliedFilters.q} />
              <ActiveChip label="Skill" value={appliedFilters.skill} />
              <ActiveChip label="Min exp" value={appliedFilters.minExperience ? `${appliedFilters.minExperience} yrs` : ''} />
              <ActiveChip label="Location" value={appliedFilters.location} />
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 rounded-full border border-[#c8d5b9] px-3 py-1.5 text-xs font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-[#eceff2] dark:hover:bg-[#353c44]"
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </button>
            </div>
          ) : null}

        </div>
      </form>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="company-workspace-empty-quiet p-8 text-center text-sm">Searching...</div>
      ) : developers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(360px,0.88fr)_minmax(0,1.12fr)]">
            <section className="company-workspace-list-surface p-4">
              <div className="border-b border-[var(--workspace-border)] pb-3">
                <h2 className="company-workspace-section-title">Results</h2>
                <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">{developers.length} developers matched your current search.</p>
              </div>
              <div className="mt-4 space-y-3">
                {developers.map((developer) => (
                  <DeveloperCard
                    key={developer.id}
                    developer={developer}
                    selected={selectedDeveloper?.id === developer.id}
                    onSelect={setSelectedDeveloper}
                    onViewProfile={handleViewProfile}
                    onMessage={handleMessage}
                  />
                ))}
              </div>
            </section>

            <section className="company-workspace-detail-surface hidden p-5 xl:block">
              {selectedDeveloper ? (
                <DeveloperPreview developer={selectedDeveloper} onViewProfile={handleViewProfile} onMessage={handleMessage} />
              ) : (
                <div className="company-workspace-empty-quiet flex h-full items-center justify-center p-8 text-center text-sm">
                  Select a developer to preview their profile details.
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className="company-workspace-empty-quiet p-8 text-center text-sm">
          No developers matched your current search yet. Try a broader keyword or open Filters to adjust the details.
        </div>
      )}

      {profile ? (
        <Modal title="Developer Profile" onClose={() => setProfile(null)}>
          {profileLoading ? (
            <p className="text-sm text-[#4b5563] dark:text-[#d0d7dd]">Loading profile...</p>
          ) : (
            <div className="rounded-xl border border-[#a3b18a] bg-[#f8fbf6] p-4 transition-colors duration-300 dark:border-[#444d57] dark:bg-[#1a1d20]">
              <PublicProfilePage profile={profile} onBack={() => setProfile(null)} onMessage={handleMessage} viewer={viewer} />
            </div>
          )}
        </Modal>
      ) : null}

      {showAdvancedFilters ? (
        <FilterPopup
          popupRef={filterPopupRef}
          position={filterPopupPosition}
          skillOptions={skillOptions}
          provinceOptions={provinceOptions}
          filters={filters}
          onChange={handleFilterChange}
          onClose={() => setShowAdvancedFilters(false)}
          onReset={handleReset}
        />
      ) : null}
    </div>
  );
}

function DeveloperPreview({ developer, onViewProfile, onMessage }) {
  const name = developer?.username || developer?.email || 'Developer';
  const initial = name.charAt(0).toUpperCase();
  const skills = Array.isArray(developer?.skills) ? developer.skills.filter(Boolean).slice(0, 10) : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-surface-subtle)] text-lg font-semibold text-[var(--workspace-text-strong)]">
            {developer?.profileImage ? (
              <img src={developer.profileImage} alt={`${name} profile`} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div>
            <h2 className="company-workspace-section-title">{name}</h2>
            <p className="mt-1 text-sm text-[var(--workspace-text)]">{developer?.desiredJob || developer?.education || 'IT Professional'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--workspace-text-muted)]">
              {developer?.address ? <span>{developer.address}</span> : null}
              {Number.isFinite(Number(developer?.ai?.matchPercentage)) ? (
                <span className="font-semibold text-[var(--workspace-primary)]">
                  Match {Number(developer.ai.matchPercentage)}% / ATS {Number(developer?.ai?.atsScore || 0)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={() => onMessage?.(developer)} className="company-workspace-primary-button px-4">
            Message
          </button>
          <button type="button" onClick={() => onViewProfile?.(developer)} className="company-workspace-secondary-button px-4">
            View full profile
          </button>
        </div>
      </div>

      <div className="company-workspace-detail-grid mt-6">
        <div className="company-workspace-detail-block">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--workspace-text-muted)]">About</p>
          <p className="mt-2 text-sm leading-7 text-[var(--workspace-text)]">
            {developer?.bio || developer?.summary || 'No profile summary added yet.'}
          </p>
        </div>
        <div className="company-workspace-detail-block">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--workspace-text-muted)]">Highlights</p>
          <div className="mt-2 space-y-2 text-sm text-[var(--workspace-text)]">
            <p><span className="font-semibold text-[var(--workspace-text-strong)]">Education:</span> {developer?.education || 'Not provided'}</p>
            <p><span className="font-semibold text-[var(--workspace-text-strong)]">Location:</span> {developer?.address || 'Not provided'}</p>
            <p><span className="font-semibold text-[var(--workspace-text-strong)]">Role:</span> {developer?.desiredJob || 'Not provided'}</p>
          </div>
        </div>
      </div>

      <div className="company-workspace-detail-block mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--workspace-text-muted)]">Skills</p>
        {skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span key={skill} className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-2.5 py-1 text-xs text-[var(--workspace-text)]">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--workspace-text-muted)]">No skills listed yet.</p>
        )}
      </div>
    </div>
  );
}

function ActiveChip({ label, value }) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-[#c8d5b9] bg-[#f8fbf6] px-3 py-1.5 text-xs font-medium text-[#344e41] dark:border-[#444d57] dark:bg-[#202428] dark:text-[#eceff2]">
      {label}: {value}
    </span>
  );
}

function FilterPopup({ popupRef, position, skillOptions, provinceOptions, filters, onChange, onClose, onReset }) {
  const customSkill = filters.skill === OTHER_SKILL_VALUE;
  const customExperience = filters.minExperience === 'Other';

  return (
    <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close filters popup" />
      <div
        id="developer-search-filters-modal"
        ref={popupRef}
        className="absolute z-10 w-[min(92vw,420px)] rounded-[24px] border border-[#d6d3c9] bg-[#f8fbf6] p-5 shadow-2xl shadow-black/15 transition-colors duration-300 dark:border-[#444d57] dark:bg-[#202428] dark:shadow-black/40"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        role="dialog"
        aria-modal="true"
        aria-label="Search filters"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-[#3a5a40] dark:text-white">Search filters</p>
            <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#c0c8d0]">Add extra details to narrow the developer search results.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c8d5b9] text-[#344e41] transition-colors hover:bg-[#f1f5eb] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
            aria-label="Close filters popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
              Skill
            </label>
            <SelectField value={filters.skill} onChange={(event) => onChange('skill', event.target.value)}>
              <option value="" disabled>
                Select skill
              </option>
              {skillOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
            {customSkill ? (
              <input
                value={filters.customSkill || ''}
                onChange={(event) => onChange('customSkill', event.target.value)}
                placeholder="Enter custom skill"
                className="field mt-3"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
                Minimum experience
              </label>
              <SelectField value={filters.minExperience} onChange={(event) => onChange('minExperience', event.target.value)}>
                <option value="" disabled>
                  Select experience
                </option>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              {customExperience ? (
                <input
                  value={filters.customExperience || ''}
                  onChange={(event) => onChange('customExperience', event.target.value)}
                  placeholder="Enter custom experience"
                  className="field mt-3"
                />
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
                Location
              </label>
              <SelectField value={filters.location} onChange={(event) => onChange('location', event.target.value)}>
                <option value="" disabled>
                  Select province
                </option>
                {provinceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-[#a8b892] px-4 py-2.5 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectField({ value, onChange, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className="field appearance-none pr-11">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6f52] dark:text-[#a8b1ba]" />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] shadow-2xl shadow-black/20 transition-colors duration-300 dark:border-[#353c44] dark:bg-[#22272b] dark:shadow-black/50">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#a3b18a] bg-[#f8fbf6]/90 px-5 py-4 backdrop-blur transition-colors duration-300 dark:border-[#353c44] dark:bg-[#22272b]/90">
          <div className="font-bold text-[#3a5a40] dark:text-white">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#a3b18a] text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
            aria-label="Close developer profile"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
