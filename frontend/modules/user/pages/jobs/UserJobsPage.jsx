import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, ChevronDown, ChevronLeft, ChevronRight, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { getJobsFeed, getSavedJobs } from '@sharedServices/authService';
import { formatJobStatus, statusBadgeClass } from '@companyFeatures/companyUtils';
import { syncApplicationsForUser } from '@userFeatures/activity/userActivityStorage';
import JobsSkeleton from '../../../../components/shared/skeletons/JobsSkeleton';

const EMPTY_FILTERS = {
  q: '',
  location: '',
  jobType: '',
  workPreference: '',
  skill: '',
  salaryCurrency: '',
  salaryRange: '',
  experienceLevel: '',
};

const JOB_TYPE_OPTIONS = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
];

const WORK_PREFERENCE_OPTIONS = [
  { value: 'fully-remote', label: 'Fully remote' },
  { value: 'asynchronous-remote', label: 'Asynchronous remote' },
  { value: 'on-site', label: 'On-site' },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];

const SALARY_CURRENCY_OPTIONS = ['PHP', 'USD', 'EUR'];
const SALARY_RANGE_OPTIONS = {
  PHP: [
    'PHP 25,000-40,000 / month',
    'PHP 40,000-60,000 / month',
    'PHP 60,000-90,000 / month',
    'PHP 90,000-130,000 / month',
    'PHP 130,000-180,000 / month',
    'PHP 180,000-250,000 / month',
    'PHP 250,000-350,000 / month',
  ],
  USD: [
    'USD 800-1,200 / month',
    'USD 1,200-1,800 / month',
    'USD 1,800-2,500 / month',
    'USD 2,500-3,500 / month',
    'USD 3,500-5,000 / month',
    'USD 5,000-7,000 / month',
    'USD 7,000-10,000 / month',
  ],
  EUR: [
    'EUR 700-1,100 / month',
    'EUR 1,100-1,700 / month',
    'EUR 1,700-2,400 / month',
    'EUR 2,400-3,300 / month',
    'EUR 3,300-4,700 / month',
    'EUR 4,700-6,500 / month',
    'EUR 6,500-9,000 / month',
  ],
};

const normalizeTitle = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const resolveJobId = (value) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
};
const wrapIndex = (index, length) => {
  if (!Number.isInteger(length) || length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
};
const SWIPE_THRESHOLD_PX = 72;
const SWIPE_EXIT_DISTANCE_PX = 180;
const DECK_PREVIEW_OFFSET = 14;
const DECK_PREVIEW_SCALE = 0.965;
const DECK_SUBTLE_SCALE = 0.93;
const applyStateToJob = (job, savedJobIds, jobCardStateById) => {
  const jobId = resolveJobId(job?.id);
  if (!jobId) {
    return job;
  }
  const overrides = jobCardStateById?.[jobId] || {};
  return {
    ...job,
    hasApplied: typeof overrides.hasApplied === 'boolean' ? overrides.hasApplied : Boolean(job?.hasApplied),
    isSaved: typeof overrides.isSaved === 'boolean' ? overrides.isSaved : savedJobIds.includes(jobId),
  };
};

export default function UserJobsPage({
  userType,
  user,
  jobCardStateById = {},
  onOpenCompanyProfile,
  onOpenJobDetail,
}) {
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterPopupPosition, setFilterPopupPosition] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(0);
  const filterPopupRef = useRef(null);
  const filterButtonRef = useRef(null);
  const lastAutoOpenRef = useRef('');
  const savedJobIdsRef = useRef(savedJobIds);

  useEffect(() => {
    savedJobIdsRef.current = savedJobIds;
  }, [savedJobIds]);

  useEffect(() => {
    let canceled = false;

    const safeLoadJobs = async ({ silent = false } = {}) => {
      if (!silent && !canceled) {
        setLoading(true);
      }
      if (!canceled) {
        setError('');
      }

      try {
        const jobsData = await getJobsFeed(appliedFilters);
        if (canceled) {
          return;
        }

        const knownSavedIds = savedJobIdsRef.current || [];
        const nextJobs = (Array.isArray(jobsData?.jobs) ? jobsData.jobs : [])
          .map((job) => applyStateToJob(job, knownSavedIds, jobCardStateById));
        syncApplicationsForUser(user, nextJobs);
        setJobs(nextJobs);
        setActiveIndex((current) => Math.max(0, Math.min(current, Math.max(0, nextJobs.length - 1))));
        setSwipeDirection(0);

        void getSavedJobs()
          .then((savedJobs) => {
            if (canceled) {
              return;
            }
            const nextSavedIds = savedJobs
              .map((entry) => resolveJobId(entry?.id))
              .filter((id) => Number.isInteger(id));
            setSavedJobIds(nextSavedIds);
            const jobsWithSavedState = (Array.isArray(jobsData?.jobs) ? jobsData.jobs : [])
              .map((job) => applyStateToJob(job, nextSavedIds, jobCardStateById));
            setJobs(jobsWithSavedState);
          })
          .catch(() => {});
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

    safeLoadJobs();
    const handleWindowFocus = () => safeLoadJobs({ silent: true });
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        safeLoadJobs({ silent: true });
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = window.setInterval(() => safeLoadJobs({ silent: true }), 30000);

    return () => {
      canceled = true;
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [appliedFilters, jobCardStateById, user]);

  useEffect(() => {
    setJobs((current) => current.map((job) => applyStateToJob(job, savedJobIds, jobCardStateById)));
  }, [jobCardStateById, savedJobIds]);

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

  useEffect(() => {
    setActiveIndex((current) => Math.max(0, Math.min(current, Math.max(0, jobs.length - 1))));
    setSwipeDirection(0);
  }, [jobs.length]);

  useEffect(() => {
    const query = normalizeTitle(appliedFilters.q);
    if (!query || loading || jobs.length === 0) {
      return;
    }

    const exactMatches = jobs.filter((job) => normalizeTitle(job?.title) === query);
    if (exactMatches.length !== 1) {
      return;
    }

    const job = exactMatches[0];
    const marker = `${query}:${job.id}`;
    if (lastAutoOpenRef.current === marker) {
      return;
    }

    lastAutoOpenRef.current = marker;
    onOpenJobDetail?.(job);
  }, [appliedFilters.q, jobs, loading, onOpenJobDetail]);

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value || '').trim()),
    [appliedFilters]
  );

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      if (key === 'salaryCurrency') {
        return { ...current, salaryCurrency: value, salaryRange: '' };
      }
      return { ...current, [key]: value };
    });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const nextFilters = {
      q: String(filters.q || '').trim(),
      location: String(filters.location || '').trim(),
      jobType: String(filters.jobType || '').trim(),
      workPreference: String(filters.workPreference || '').trim(),
      skill: String(filters.skill || '').trim(),
      salaryCurrency: String(filters.salaryCurrency || '').trim(),
      salaryRange: String(filters.salaryRange || '').trim(),
      experienceLevel: String(filters.experienceLevel || '').trim(),
    };
    setAppliedFilters(nextFilters);
    setShowAdvancedFilters(false);
    if (!nextFilters.q) {
      lastAutoOpenRef.current = '';
    }
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setShowAdvancedFilters(false);
    lastAutoOpenRef.current = '';
  };

  const advanceJob = useCallback((direction) => {
    if (jobs.length <= 1) {
      return;
    }

    setSwipeDirection(direction);
    setActiveIndex((current) => wrapIndex(current + direction, jobs.length));
  }, [jobs.length]);

  const handleCardDragEnd = useCallback((_event, info) => {
    const offsetX = Number(info?.offset?.x || 0);
    if (Math.abs(offsetX) < SWIPE_THRESHOLD_PX) {
      return;
    }

    advanceJob(offsetX < 0 ? 1 : -1);
  }, [advanceJob]);

  const currentJobIndex = jobs.length > 0 ? wrapIndex(activeIndex, jobs.length) : 0;
  const prevJobIndex = jobs.length > 0 ? wrapIndex(currentJobIndex - 1, jobs.length) : 0;
  const nextJobIndex = jobs.length > 0 ? wrapIndex(currentJobIndex + 1, jobs.length) : 0;
  const currentJob = jobs[currentJobIndex] || null;
  const deckJobs = useMemo(() => {
    if (!jobs.length) {
      return [];
    }

    if (jobs.length === 1) {
      return [{
        index: currentJobIndex,
        job: jobs[currentJobIndex],
        position: 'current',
      }];
    }

    if (jobs.length === 2) {
      const previewIndex = nextJobIndex === currentJobIndex ? prevJobIndex : nextJobIndex;
      return [
        {
          index: currentJobIndex,
          job: jobs[currentJobIndex],
          position: 'current',
        },
        {
          index: previewIndex,
          job: jobs[previewIndex],
          position: 'front',
        },
      ];
    }

    return [
      {
        index: prevJobIndex,
        job: jobs[prevJobIndex],
        position: 'back',
      },
      {
        index: currentJobIndex,
        job: jobs[currentJobIndex],
        position: 'current',
      },
      {
        index: nextJobIndex,
        job: jobs[nextJobIndex],
        position: 'front',
      },
    ];
  }, [currentJobIndex, jobs, nextJobIndex, prevJobIndex]);

  const handleOpenCompany = () => {
    if (!currentJob) {
      return;
    }
    onOpenCompanyProfile?.(currentJob);
  };

  const handleOpenDetail = () => {
    if (!currentJob) {
      return;
    }
    onOpenJobDetail?.(currentJob);
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,1040px)] space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white">
          {userType === 'employee' ? 'Browse Jobs' : 'Posted Jobs'}
        </h1>
      </div>

      <form onSubmit={handleSearch} className="p-0">
        <div className={`flex flex-col ${hasActiveFilters ? 'gap-4' : 'gap-3'}`}>
          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
            <div className="min-w-0 flex-1">
              <div className="flex w-full items-center rounded-2xl border border-white/40 bg-white/70 px-2 py-2 shadow-[0_10px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all focus-within:shadow-[0_10px_20px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#1a1d20]/70">
                <input
                  value={filters.q}
                  onChange={(event) => handleFilterChange('q', event.target.value)}
                  placeholder="Search jobs..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 min-[420px]:px-4 py-2 text-[#344e41] outline-none placeholder:text-[#6b7c6a] dark:text-white dark:placeholder:text-[#adb5be]"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2d4632] hover:shadow-lg dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
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
                className="inline-flex h-full items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/70 px-4 py-3 text-[15px] font-semibold text-[#4a6b57] shadow-[0_10px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#1a1d20]/70 dark:text-[#a8b1ba] dark:hover:bg-[#353c44]/70"
                aria-expanded={showAdvancedFilters}
                aria-controls="job-search-filters-modal"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#588157] dark:text-[#f0c766]" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <ActiveChip label="Keyword" value={appliedFilters.q} />
              <ActiveChip label="Location" value={appliedFilters.location} />
              <ActiveChip label="Job Type" value={appliedFilters.jobType} />
              <ActiveChip label="Work Preference" value={appliedFilters.workPreference} />
              <ActiveChip label="Skills" value={appliedFilters.skill} />
              <ActiveChip label="Salary Currency" value={appliedFilters.salaryCurrency} />
              <ActiveChip label="Salary Range" value={appliedFilters.salaryRange} />
              <ActiveChip label="Experience" value={appliedFilters.experienceLevel} />
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

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {loading ? (
        <JobsSkeleton />
      ) : jobs.length === 0 ? (
        <div className="rounded-3xl border border-white/40 bg-white/70 p-12 text-center shadow-[0_20px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#22272b]/70">
          <p className="text-[15px] text-[#4a6b57] dark:text-[#a8b1ba]">
            {hasActiveFilters ? 'No jobs matched your current filters yet. Try broadening the search.' : 'No jobs available right now.'}
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5f6f52] dark:text-[#a8b1ba]">
              {currentJobIndex + 1} of {jobs.length}
            </p>
            <p className="text-xs text-[#5f6f52] dark:text-[#a8b1ba]">
              Swipe the top card left or right to move through the feed.
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-[980px] items-center justify-center gap-3 md:gap-6 lg:gap-10">
            <button
              type="button"
              onClick={() => advanceJob(-1)}
              disabled={jobs.length <= 1}
              aria-label="Previous job"
              className="hidden md:inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#a3b18a] bg-[#f8fbf6] text-[#344e41] transition-colors hover:bg-[#eef6ee] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#444d57] dark:bg-[#22272b] dark:text-[#eceff2] dark:hover:bg-[#353c44]"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <motion.div
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  advanceJob(-1);
                }
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  advanceJob(1);
                }
              }}
              className="relative w-full max-w-[700px] rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#588157]"
              aria-label="Swipe left or right to browse jobs"
            >
              <div className="relative aspect-square w-full select-none">
                <div className="absolute inset-0">
                  <AnimatePresence initial={false} mode="popLayout">
                    {deckJobs.map(({ job, position }) => {
                      const isCurrent = position === 'current';
                      const stackClasses = position === 'current'
                        ? 'z-30'
                        : position === 'front'
                          ? 'z-20'
                          : 'z-10';

                      return (
                        <motion.div
                          key={job.id}
                          layout
                          className={`absolute inset-0 ${stackClasses}`}
                          initial={position === 'current'
                            ? {
                              opacity: 0,
                              x: swipeDirection > 0 ? 120 : -120,
                              scale: 0.96,
                              rotate: swipeDirection > 0 ? 7 : -7,
                            }
                            : false}
                          animate={{
                            opacity: isCurrent ? 1 : position === 'front' ? 0.6 : 0.34,
                            x: isCurrent ? 0 : position === 'front' ? DECK_PREVIEW_OFFSET : -DECK_PREVIEW_OFFSET,
                            y: isCurrent ? 0 : position === 'front' ? DECK_PREVIEW_OFFSET * 1.4 : DECK_PREVIEW_OFFSET * 0.75,
                            scale: isCurrent ? 1 : position === 'front' ? DECK_PREVIEW_SCALE : DECK_SUBTLE_SCALE,
                            rotate: isCurrent ? 0 : position === 'front' ? 2.5 : -2.5,
                          }}
                          exit={{
                            opacity: 0,
                            x: swipeDirection > 0 ? -SWIPE_EXIT_DISTANCE_PX : SWIPE_EXIT_DISTANCE_PX,
                            scale: 0.94,
                            rotate: swipeDirection > 0 ? -10 : 10,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 320,
                            damping: 30,
                            mass: 0.9,
                          }}
                          style={{
                            pointerEvents: isCurrent ? 'auto' : 'none',
                            touchAction: isCurrent ? 'pan-y' : 'none',
                          }}
                        >
                          <SquareJobCard
                            job={job}
                            profileCompleted={Boolean(user?.profileCompleted)}
                            onViewCompany={isCurrent ? handleOpenCompany : undefined}
                            onMoreInfo={isCurrent ? handleOpenDetail : undefined}
                            draggable={isCurrent}
                            onDragEnd={isCurrent ? handleCardDragEnd : undefined}
                          />
                          {!isCurrent && (
                            <div className="absolute inset-0 rounded-2xl bg-transparent" aria-hidden="true" />
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            <button
              type="button"
              onClick={() => advanceJob(1)}
              disabled={jobs.length <= 1}
              aria-label="Next job"
              className="hidden md:inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#a3b18a] bg-[#f8fbf6] text-[#344e41] transition-colors hover:bg-[#eef6ee] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#444d57] dark:bg-[#22272b] dark:text-[#eceff2] dark:hover:bg-[#353c44]"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </section>
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
              jobType: String(filters.jobType || '').trim(),
              workPreference: String(filters.workPreference || '').trim(),
              skill: String(filters.skill || '').trim(),
              salaryCurrency: String(filters.salaryCurrency || '').trim(),
              salaryRange: String(filters.salaryRange || '').trim(),
              experienceLevel: String(filters.experienceLevel || '').trim(),
            });
            setShowAdvancedFilters(false);
          }}
        />
      ) : null}
    </div>
  );
}

function SquareJobCard({ job, profileCompleted = false, onViewCompany, onMoreInfo, draggable = false, onDragEnd }) {
  if (!job) {
    return null;
  }

  const status = String(job?.status || 'open').toLowerCase();
  const rawMatchPercentage = Number(job?.matchPercentage);
  const hasServerMatchPercentage = Number.isFinite(rawMatchPercentage) && rawMatchPercentage >= 0;
  const matchPercentage = hasServerMatchPercentage
    ? Math.max(0, Math.min(100, Math.round(rawMatchPercentage)))
    : null;
  const fitPrefix = 'You fit this job';
  const isProfileCompleted = Boolean(profileCompleted);
  const rawDataGaps = Array.isArray(job?.matchDetails?.dataGaps) ? job.matchDetails.dataGaps : [];
  const fallbackDataGaps = !isProfileCompleted && rawDataGaps.length === 0
    ? [
      'Add at least 2 relevant skills',
      'Add a profile summary (at least 10 words)',
      'Add resume details (at least 12 words)',
    ]
    : [];
  const resolvedDataGaps = rawDataGaps.length ? rawDataGaps : fallbackDataGaps;
  const visibleDataGaps = resolvedDataGaps
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  const showNeutralFit = !hasServerMatchPercentage || !isProfileCompleted;
  const neutralFitTitle = !isProfileCompleted
    ? 'Complete profile to unlock fit %'
    : 'Analyzing compatibility';
  const neutralFitMessage = !isProfileCompleted
    ? 'Finish your Developer complete profile to view job fit percentage.'
    : 'We are still calculating your match details.';

  return (
    <motion.article
      drag={draggable ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      dragMomentum={false}
      onDragEnd={draggable ? onDragEnd : undefined}
      whileTap={draggable ? { scale: 0.995 } : undefined}
      className="aspect-square w-full cursor-grab rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-shadow active:cursor-grabbing hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#22272b]/70 sm:p-8"
      style={draggable ? { touchAction: 'pan-y' } : undefined}
    >
      <div className="flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#588157] to-[#3a5a40] text-white dark:from-[#82ad86] dark:to-[#6f9b74]">
              {job?.company?.logo ? (
                <img
                  src={job.company.logo}
                  alt={`${job?.company?.name || 'Company'} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="line-clamp-2 text-xl font-semibold text-[#3a5a40] dark:text-white">{job?.title || 'Untitled job'}</h3>
                <span className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass(status)}`}>
                  {formatJobStatus(status)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="line-clamp-1 text-sm text-[#344e41] dark:text-[#d0d7dd]">{job?.company?.name || 'Company'}</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-[#c8d5b9] bg-[#eef6ee] px-2.5 py-2 dark:border-[#4b5a4e] dark:bg-[#2a2f35]">
            {showNeutralFit ? (
              <div className="w-[172px]">
                <p className="text-[11px] font-semibold leading-tight text-[#3a5a40] dark:text-[#e9f3ea]">
                  {neutralFitTitle}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-[#56725e] dark:text-[#b8c5b8]">
                  {neutralFitMessage}
                </p>
                {!isProfileCompleted && visibleDataGaps.length ? (
                  <div className="mt-1.5">
                    <p className="text-[10px] font-semibold leading-tight text-[#3a5a40] dark:text-[#dce8de]">
                      Missing info:
                    </p>
                    <ul className="mt-0.5 space-y-0.5 text-[10px] leading-tight text-[#56725e] dark:text-[#b8c5b8]">
                      {visibleDataGaps.map((gap) => (
                        <li key={gap} className="break-words">
                          - {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div
                  className="relative grid h-11 w-11 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#3a5a40 ${matchPercentage}%, #d7e2ce ${matchPercentage}% 100%)`,
                  }}
                  aria-label={`${matchPercentage}% ${fitPrefix.toLowerCase()}`}
                  title={fitPrefix}
                >
                  <div className="grid h-[39px] w-[39px] place-items-center rounded-full bg-[#f8fbf6] text-[10px] font-bold leading-none text-[#3a5a40] dark:bg-[#22272b] dark:text-[#e9f3ea]">
                    <span>{matchPercentage}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold leading-tight text-[#3a5a40] dark:text-[#e9f3ea]">
                    {fitPrefix} {matchPercentage}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#344e41] dark:text-[#d0d7dd]">
          {job?.location ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6ee] px-2.5 py-1 dark:bg-[#2a2f35]">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
          ) : null}
          {job?.type ? <span className="rounded-full bg-[#eef6ee] px-2.5 py-1 dark:bg-[#2a2f35]">{job.type}</span> : null}
          {job?.salary ? <span className="rounded-full bg-[#eef6ee] px-2.5 py-1 font-semibold dark:bg-[#2a2f35]">{job.salary}</span> : null}
        </div>

        <div className="flex-1">
          <p className="line-clamp-6 text-sm leading-6 text-[#344e41] dark:text-[#d0d7dd]">
            {job?.description || 'No description provided yet.'}
          </p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
          <button
            type="button"
            onClick={onViewCompany}
            className="rounded-lg border border-[#a3b18a] px-4 py-2.5 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#f1f5eb] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
          >
            View Company
          </button>
          <button
            type="button"
            onClick={onMoreInfo}
            className="rounded-lg bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
          >
            More Info
          </button>
        </div>
      </div>
    </motion.article>
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

function FilterPopup({ popupRef, position, filters, onChange, onClose, onReset, onApply }) {
  const salaryRangeOptions = SALARY_RANGE_OPTIONS[filters.salaryCurrency] || [];

  return (
    <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close filters popup" />
      <div
        id="job-search-filters-modal"
        ref={popupRef}
        className="absolute z-10 w-[min(92vw,420px)] rounded-[24px] border border-[#d6d3c9] bg-[#f8fbf6] p-5 shadow-2xl shadow-black/15 transition-colors duration-300 dark:border-[#444d57] dark:bg-[#202428] dark:shadow-black/40"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c8d5b9] text-[#344e41] transition-colors hover:bg-[#f1f5eb] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
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
            placeholder="City, province..."
          />

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
              Job type
            </label>
            <SelectField value={filters.jobType} onChange={(event) => onChange('jobType', event.target.value)}>
              <option value="">All job types</option>
              {JOB_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
          </div>

          <Field
            label="Skills"
            value={filters.skill}
            onChange={(event) => onChange('skill', event.target.value)}
            placeholder="React, Node.js, QA..."
          />

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
              Work preference
            </label>
            <SelectField value={filters.workPreference} onChange={(event) => onChange('workPreference', event.target.value)}>
              <option value="">All work preferences</option>
              {WORK_PREFERENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
              Salary currency
            </label>
            <SelectField value={filters.salaryCurrency} onChange={(event) => onChange('salaryCurrency', event.target.value)}>
              <option value="">Any currency</option>
              {SALARY_CURRENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
              Salary range
            </label>
            <SelectField value={filters.salaryRange} onChange={(event) => onChange('salaryRange', event.target.value)}>
              <option value="">{filters.salaryCurrency ? 'All selected currency ranges' : 'Select a currency first (optional)'}</option>
              {salaryRangeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
              Experience level
            </label>
            <SelectField value={filters.experienceLevel} onChange={(event) => onChange('experienceLevel', event.target.value)}>
              <option value="">All experience levels</option>
              {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
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
            className="rounded-lg border border-[#a8b892] px-4 py-2.5 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-lg bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
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
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6f52] dark:text-[#a8b1ba]">
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
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6f52] dark:text-[#a8b1ba]" />
    </div>
  );
}
