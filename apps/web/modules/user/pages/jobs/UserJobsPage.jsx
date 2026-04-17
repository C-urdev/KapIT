import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Building, ChevronDown, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { applyToJob, getJobsFeed, getSavedJobs, removeSavedJob, saveJob } from '@sharedServices/authService';
import { formatJobStatus, statusBadgeClass } from '@companyFeatures/companyUtils';
import { saveApplicationForUser, syncApplicationsForUser } from '@userFeatures/activity/userActivityStorage';

const EMPTY_FILTERS = {
  q: '',
  location: '',
  type: '',
  skill: '',
  status: '',
};

const JOB_TYPE_OPTIONS = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
  'Remote',
  'Hybrid',
  'On-site',
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'filled', label: 'Filled' },
  { value: 'closed', label: 'Closed' },
];

export default function UserJobsPage({ userType, user }) {
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [plan, setPlan] = useState({ isPremium: false });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterPopupPosition, setFilterPopupPosition] = useState({ top: 0, left: 0 });
  const filterPopupRef = useRef(null);
  const filterButtonRef = useRef(null);

  useEffect(() => {
    let canceled = false;

    const safeLoadJobs = async ({ silent = false } = {}) => {
      if (!silent && !canceled) {
        setLoading(true);
      }
      if (!canceled) {
        setError('');
        if (!silent) {
          setFeedback('');
        }
      }
      try {
        const [jobsData, savedJobs] = await Promise.all([
          getJobsFeed(appliedFilters),
          getSavedJobs().catch(() => []),
        ]);
        if (!canceled) {
          const nextJobs = Array.isArray(jobsData?.jobs) ? jobsData.jobs : [];
          syncApplicationsForUser(user, nextJobs);
          setJobs(nextJobs);
          setSavedJobIds(savedJobs.map((job) => Number(job?.id)).filter((id) => Number.isInteger(id)));
          setPlan(jobsData?.plan || { isPremium: false });
        }
      } catch (err) {
        if (!canceled) {
          setError(err?.message || 'Failed to load jobs.');
          setJobs([]);
        }
      } finally {
        if (!silent && !canceled) {
          setLoading(false);
        }
      }
    };

    const handleWindowFocus = () => {
      safeLoadJobs({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        safeLoadJobs({ silent: true });
      }
    };

    safeLoadJobs();
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = window.setInterval(() => {
      safeLoadJobs({ silent: true });
    }, 30000);

    return () => {
      canceled = true;
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [appliedFilters, user]);

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

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value || '').trim()),
    [appliedFilters]
  );

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setAppliedFilters({
      q: String(filters.q || '').trim(),
      location: String(filters.location || '').trim(),
      type: String(filters.type || '').trim(),
      skill: String(filters.skill || '').trim(),
      status: String(filters.status || '').trim().toLowerCase(),
    });
    setShowAdvancedFilters(false);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setShowAdvancedFilters(false);
  };

  const handleApply = async (job) => {
    if (!job?.id || job?.hasApplied) {
      return;
    }

    setApplyingJobId(job.id);
    setError('');
    setFeedback('');

    try {
      await applyToJob(job.id);
      saveApplicationForUser(user, {
        jobId: job.id,
        title: job?.title || 'Untitled job',
        location: job?.location || '',
        type: job?.type || '',
        salary: job?.salary || '',
        status: 'pending',
        company: job?.company || {},
        appliedAt: new Date().toISOString(),
      });
      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id
            ? { ...currentJob, hasApplied: true }
            : currentJob
        )
      );
      setFeedback(`Your application for "${job.title}" was sent to ${job?.company?.name || 'the company'}.`);
    } catch (err) {
      setError(err?.message || 'Failed to apply to job.');
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleToggleSave = async (job) => {
    const jobId = Number(job?.id);
    if (!Number.isInteger(jobId) || jobId <= 0) {
      return;
    }

    const isSaved = savedJobIds.includes(jobId);
    try {
      if (isSaved) {
        await removeSavedJob(jobId);
        setSavedJobIds((current) => current.filter((id) => id !== jobId));
        setFeedback(`"${job.title}" was removed from Saved Jobs.`);
        return;
      }

      await saveJob(jobId);
      setSavedJobIds((current) => (current.includes(jobId) ? current : [jobId, ...current]));
      setFeedback(`"${job.title}" was saved to your Saved Jobs.`);
    } catch (err) {
      setError(err?.message || 'Failed to update saved jobs.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,1040px)] space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white">
          {userType === 'employee' ? 'Browse Jobs' : 'Posted Jobs'}
        </h1>
      </div>

      <form
        onSubmit={handleSearch}
        className="p-0"
      >
        <div className={`flex flex-col ${hasActiveFilters ? 'gap-4' : 'gap-3'}`}>
          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
            <div className="min-w-0 flex-1">
              <div className="flex w-full items-center rounded-xl border border-[#a3b18a] bg-[#fcfdf8] px-1.5 min-[420px]:px-2 py-1.5 min-[420px]:py-2 transition-colors focus-within:ring-2 focus-within:ring-[#588157] dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:focus-within:ring-[#3ba9d6]">
                <input
                  value={filters.q}
                  onChange={(event) => handleFilterChange('q', event.target.value)}
                  placeholder="Search jobs..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 min-[420px]:px-4 py-2 text-[#344e41] outline-none placeholder:text-[#6b7c6a] dark:text-white dark:placeholder:text-[#7d9ab8]"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#3a5a40] px-3 min-[420px]:px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#344e41] hover:shadow-md hover:shadow-[#344e41]/15 dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] dark:hover:shadow-[#3ba9d6]/20"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden min-[380px]:inline">Search</span>
                </button>
              </div>
            </div>

            <div ref={filterPopupRef} className="relative shrink-0">
              <button
                ref={filterButtonRef}
                type="button"
                onClick={() => setShowAdvancedFilters((current) => !current)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#a8b892] bg-[#fcfdf8] px-3 min-[420px]:px-4 py-3 min-[420px]:py-3.5 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:text-white dark:hover:bg-[#1e3a5f]"
                aria-expanded={showAdvancedFilters}
                aria-controls="job-search-filters-modal"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <ActiveChip label="Keyword" value={appliedFilters.q} />
              <ActiveChip label="Location" value={appliedFilters.location} />
              <ActiveChip label="Type" value={appliedFilters.type} />
              <ActiveChip label="Skill" value={appliedFilters.skill} />
              <ActiveChip label="Status" value={appliedFilters.status} />
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

      {feedback && <p className="text-sm text-[#3a5a40] dark:text-[#7fd0ee]">{feedback}</p>}
      {plan?.isPremium ? <p className="text-xs text-[#3a5a40] dark:text-[#7fd0ee]">Premium scoring is active. Match percentages appear on supported jobs.</p> : null}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <div className="bg-[#f8fbf6] dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-6">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">
            {hasActiveFilters ? 'No jobs matched your current filters yet. Try broadening the search.' : 'No jobs available right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#8fb2cf]">
            {jobs.length} job{jobs.length === 1 ? '' : 's'} found
          </p>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={savedJobIds.includes(Number(job?.id))}
              isPremiumUser={Boolean(plan?.isPremium)}
              onApply={handleApply}
              onToggleSave={handleToggleSave}
              applying={applyingJobId === job.id}
            />
          ))}
        </div>
      )}

      {showAdvancedFilters ? (
        <FilterPopup
          popupRef={filterPopupRef}
          position={filterPopupPosition}
          filters={filters}
          onChange={handleFilterChange}
          onClose={() => setShowAdvancedFilters(false)}
          onReset={handleReset}
          onApply={() => {
            setAppliedFilters({
              q: String(filters.q || '').trim(),
              location: String(filters.location || '').trim(),
              type: String(filters.type || '').trim(),
              skill: String(filters.skill || '').trim(),
              status: String(filters.status || '').trim().toLowerCase(),
            });
            setShowAdvancedFilters(false);
          }}
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

function FilterPopup({ popupRef, position, filters, onChange, onClose, onReset, onApply }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close filters popup" />
      <div
        id="job-search-filters-modal"
        ref={popupRef}
        className="absolute z-10 w-[min(92vw,420px)] rounded-[24px] border border-[#d6d3c9] bg-[#f8fbf6] p-5 shadow-2xl shadow-black/15 transition-colors duration-300 dark:border-[#2a4a6f] dark:bg-[#102235] dark:shadow-black/40"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        role="dialog"
        aria-modal="true"
        aria-label="Job search filters"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-[#3a5a40] dark:text-white">Job filters</p>
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
          <Field
            label="Location"
            value={filters.location}
            onChange={(event) => onChange('location', event.target.value)}
            placeholder="City, province, remote..."
          />

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#8fb2cf]">
              Job type
            </label>
            <SelectField value={filters.type} onChange={(event) => onChange('type', event.target.value)}>
              <option value="">All job types</option>
              {JOB_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
          </div>

          <Field
            label="Skill"
            value={filters.skill}
            onChange={(event) => onChange('skill', event.target.value)}
            placeholder="React, Node.js, QA..."
          />

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#8fb2cf]">
              Status
            </label>
            <SelectField value={filters.status} onChange={(event) => onChange('status', event.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
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
            onClick={onApply}
            className="rounded-lg bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#8fb2cf]">
        {label}
      </label>
      <input value={value} onChange={onChange} placeholder={placeholder} className="field" />
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

function JobCard({ job, isSaved, isPremiumUser, onApply, onToggleSave, applying }) {
  const status = String(job?.status || 'open').toLowerCase();
  const isClosed = status === 'closed';
  const isFilled = status === 'filled';
  const hasApplied = Boolean(job?.hasApplied);
  const companyName = job?.company?.name || 'Company';
  const skills = Array.isArray(job?.skills) ? job.skills : [];

  return (
    <div className="bg-[#f8fbf6] dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4 sm:p-6 hover:border-[#588157] dark:hover:border-[#3ba9d6] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6] rounded-lg flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold text-[#3a5a40] dark:text-white">{job?.title || 'Untitled job'}</h3>
              <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass(status)}`}>
                {formatJobStatus(status)}
              </span>
            </div>
            <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mb-2">{companyName}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#344e41] dark:text-[#b8d4e8]">
              {job?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
              )}
              {job?.type && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 rounded">
                  {job.type}
                </span>
              )}
              {job?.salary && <span className="font-semibold text-[#588157] dark:text-[#3ba9d6]">{job.salary}</span>}
              {isPremiumUser && Number.isFinite(Number(job?.matchPercentage)) ? (
                <span className="px-2 py-1 rounded bg-[#eef6ee] text-[#31572c] dark:bg-[#14304d] dark:text-[#dcecff] text-xs font-semibold">
                  Match {Number(job.matchPercentage)}%
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">{job?.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}</span>
      </div>

      {job?.description && (
        <p className="mb-4 text-sm text-[#344e41] dark:text-[#b8d4e8] line-clamp-3">{job.description}</p>
      )}

      {!job?.acceptsApplications ? (
        <p className="mb-3 text-xs text-[#9a3412] dark:text-[#fdba74]">{job?.availabilityLabel || 'This listing is no longer accepting applications.'}</p>
      ) : null}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill) => (
            <span key={skill} className="px-3 py-1 bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#344e41] dark:text-white text-xs font-medium rounded-full">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col min-[420px]:flex-row gap-3">
        <button
          type="button"
          onClick={() => onApply?.(job)}
          disabled={isClosed || isFilled || hasApplied || applying}
          className="flex-1 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClosed ? 'Closed' : isFilled ? 'Filled' : hasApplied ? 'Applied' : applying ? 'Applying...' : 'Apply Now'}
        </button>
        <button
          type="button"
          onClick={() => onToggleSave?.(job)}
          className={`px-4 py-2 border rounded-lg transition-colors min-[420px]:w-auto w-full min-[420px]:px-4 ${
            isSaved
              ? 'border-[#588157] bg-[#eef6ee] text-[#3a5a40] dark:border-[#3ba9d6] dark:bg-[#14304d] dark:text-[#dcecff]'
              : 'border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f]'
          }`}
          aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
