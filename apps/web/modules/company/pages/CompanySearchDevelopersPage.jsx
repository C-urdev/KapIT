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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Search developers</h2>
      </div>

      <form
        onSubmit={handleSearch}
        className="rounded-[24px] border border-[#a3b18a] dark:border-[#1e3a5f] bg-[#f8fbf6] dark:bg-[#162842] p-4 shadow-lg shadow-black/5 transition-colors duration-300 dark:shadow-black/20"
      >
        <div className={`flex flex-col ${hasActiveFilters ? 'gap-4' : 'gap-3'}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex w-full items-center rounded-xl border border-[#a3b18a] bg-[#fcfdf8] px-2 py-2 transition-colors focus-within:ring-2 focus-within:ring-[#588157] dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:focus-within:ring-[#3ba9d6]">
                <input
                  value={filters.q}
                  onChange={(event) => handleFilterChange('q', event.target.value)}
                  placeholder="Search by name, desired role, education..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-[#344e41] outline-none placeholder:text-[#3a5a40] dark:text-white dark:placeholder:text-[#7d9ab8]"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#3a5a40] px-3.5 min-[420px]:px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#344e41] hover:shadow-md hover:shadow-[#344e41]/15 dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] dark:hover:shadow-[#3ba9d6]/20"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden min-[380px]:inline">Search</span>
                </button>
              </div>
            </div>

            <div ref={filterPopupRef} className="relative lg:min-w-fit">
              <button
                ref={filterButtonRef}
                type="button"
                onClick={() => setShowAdvancedFilters((current) => !current)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#a8b892] bg-[#fcfdf8] px-4 py-3 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:text-white dark:hover:bg-[#1e3a5f] lg:w-auto"
                aria-expanded={showAdvancedFilters}
                aria-controls="developer-search-filters-modal"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
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
                className="inline-flex items-center gap-1 rounded-full border border-[#c8d5b9] px-3 py-1.5 text-xs font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-[#dcecff] dark:hover:bg-[#1e3a5f]"
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
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Searching...</p>
      ) : developers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {developers.map((developer) => (
            <DeveloperCard
              key={developer.id}
              developer={developer}
              onViewProfile={handleViewProfile}
              onMessage={handleMessage}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] p-6 text-sm text-[#344e41] shadow-lg shadow-black/5 transition-colors duration-300 dark:border-[#1e3a5f] dark:bg-[#162842] dark:text-[#dcecff] dark:shadow-black/20">
          No developers matched your current search yet. Try a broader keyword or open Filters to adjust the details.
        </div>
      )}

      {profile ? (
        <Modal title="Developer Profile" onClose={() => setProfile(null)}>
          {profileLoading ? (
            <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading profile...</p>
          ) : (
            <div className="rounded-xl border border-[#a3b18a] bg-[#f8fbf6] p-4 transition-colors duration-300 dark:border-[#2a4a6f] dark:bg-[#0f2139]">
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

function ActiveChip({ label, value }) {
  if (!value) return null;

  return (
    <span className="inline-flex items-center rounded-full border border-[#c8d5b9] bg-[#f8fbf6] px-3 py-1.5 text-xs font-medium text-[#344e41] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-[#dcecff]">
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
        className="absolute z-10 w-[min(92vw,420px)] rounded-[24px] border border-[#d6d3c9] bg-[#f8fbf6] p-5 shadow-2xl shadow-black/15 transition-colors duration-300 dark:border-[#2a4a6f] dark:bg-[#102235] dark:shadow-black/40"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        role="dialog"
        aria-modal="true"
        aria-label="Search filters"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-[#3a5a40] dark:text-white">Search filters</p>
            <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#a6bfd8]">Add extra details to narrow the developer search results.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c8d5b9] text-[#344e41] transition-colors hover:bg-[#f1f5eb] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f]"
            aria-label="Close filters popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#8fb2cf]">
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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#8fb2cf]">
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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#8fb2cf]">
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
            className="rounded-lg border border-[#a8b892] px-4 py-2.5 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]"
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
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6f52] dark:text-[#8fb2cf]" />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] shadow-2xl shadow-black/20 transition-colors duration-300 dark:border-[#1e3a5f] dark:bg-[#162842] dark:shadow-black/50">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#a3b18a] bg-[#f8fbf6]/90 px-5 py-4 backdrop-blur transition-colors duration-300 dark:border-[#1e3a5f] dark:bg-[#162842]/90">
          <div className="font-bold text-[#3a5a40] dark:text-white">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#a3b18a] text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f]"
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
