import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, ChevronDown, ChevronLeft, ChevronRight, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { getJobsFeed, getSavedJobs } from '@sharedServices/authService';
import { formatJobStatus, statusBadgeClass } from '@companyFeatures/companyUtils';
import { useToast } from '@sharedComponents/ui/ToastProvider';
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
const SWIPE_THRESHOLD_PX = 56;
const MAX_DRAG_OFFSET_PX = 120;
const isInteractiveTarget = (target) => (
  Boolean(target?.closest?.('button, a, input, select, textarea, [role="button"]'))
);
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
  const toast = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterPopupPosition, setFilterPopupPosition] = useState({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const filterPopupRef = useRef(null);
  const filterButtonRef = useRef(null);
  const swipeStartXRef = useRef(null);
  const touchDraggingRef = useRef(false);
  const pointerStartXRef = useRef(null);
  const mouseDraggingRef = useRef(false);
  const lastAutoOpenRef = useRef('');
  const animationTimeoutRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [animOffsetX, setAnimOffsetX] = useState(0);
  const [animOpacity, setAnimOpacity] = useState(1);
  const [animDurationMs, setAnimDurationMs] = useState(220);
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
    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      if (finishTimeoutRef.current) {
        window.clearTimeout(finishTimeoutRef.current);
      }
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

  useEffect(() => {
    setActiveIndex((current) => Math.max(0, Math.min(current, Math.max(0, jobs.length - 1))));
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

  const currentJob = jobs[activeIndex] || null;

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

  const goPrev = () => {
    if (jobs.length <= 1) return;
    setActiveIndex((current) => (current - 1 + jobs.length) % jobs.length);
  };

  const goNext = () => {
    if (jobs.length <= 1) return;
    setActiveIndex((current) => (current + 1) % jobs.length);
  };

  const resetCardPosition = () => {
    setAnimDurationMs(180);
    setAnimOffsetX(0);
    setAnimOpacity(1);
    setDragDeltaX(0);
  };

  const animateSwipeTo = (direction) => {
    if (jobs.length <= 1) {
      resetCardPosition();
      return;
    }

    const outgoingOffset = direction > 0 ? -MAX_DRAG_OFFSET_PX : MAX_DRAG_OFFSET_PX;
    const incomingOffset = direction > 0 ? MAX_DRAG_OFFSET_PX : -MAX_DRAG_OFFSET_PX;

    setAnimDurationMs(180);
    setAnimOffsetX(outgoingOffset);
    setAnimOpacity(0.12);
    setDragDeltaX(0);

    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = window.setTimeout(() => {
      if (direction > 0) {
        goNext();
      } else {
        goPrev();
      }

      setAnimDurationMs(0);
      setAnimOffsetX(incomingOffset);
      setAnimOpacity(0.18);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setAnimDurationMs(240);
          setAnimOffsetX(0);
          setAnimOpacity(1);
        });
      });

      if (finishTimeoutRef.current) {
        window.clearTimeout(finishTimeoutRef.current);
      }
      finishTimeoutRef.current = window.setTimeout(() => {
        setAnimDurationMs(220);
        setAnimOffsetX(0);
        setAnimOpacity(1);
      }, 250);
    }, 180);
  };

  const handleSwipeStart = (event) => {
    if (isInteractiveTarget(event.target)) {
      swipeStartXRef.current = null;
      touchDraggingRef.current = false;
      return;
    }
    swipeStartXRef.current = event.touches?.[0]?.clientX ?? null;
    touchDraggingRef.current = swipeStartXRef.current != null;
    if (touchDraggingRef.current) {
      setIsDraggingCard(true);
    }
  };

  const handleSwipeMove = (event) => {
    if (!touchDraggingRef.current) {
      return;
    }
    const startX = swipeStartXRef.current;
    const currentX = event.touches?.[0]?.clientX ?? startX;
    if (startX == null || currentX == null) {
      return;
    }
    const deltaX = currentX - startX;
    const boundedDelta = Math.max(-MAX_DRAG_OFFSET_PX, Math.min(MAX_DRAG_OFFSET_PX, deltaX));
    setDragDeltaX(boundedDelta);
  };

  const handleSwipeEnd = (event) => {
    if (!touchDraggingRef.current) {
      return;
    }
    touchDraggingRef.current = false;
    setIsDraggingCard(false);
    const startX = swipeStartXRef.current;
    swipeStartXRef.current = null;
    if (startX == null) {
      return;
    }
    const endX = event.changedTouches?.[0]?.clientX ?? startX;
    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
      resetCardPosition();
      return;
    }
    if (deltaX < 0) {
      animateSwipeTo(1);
      return;
    }
    animateSwipeTo(-1);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || isInteractiveTarget(event.target)) {
      return;
    }
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Ignore unsupported pointer capture.
    }
    pointerStartXRef.current = event.clientX;
    mouseDraggingRef.current = true;
    setIsDraggingCard(true);
  };

  const handlePointerMove = (event) => {
    if (!mouseDraggingRef.current || pointerStartXRef.current == null) {
      return;
    }
    const deltaX = event.clientX - pointerStartXRef.current;
    const boundedDelta = Math.max(-MAX_DRAG_OFFSET_PX, Math.min(MAX_DRAG_OFFSET_PX, deltaX));
    setDragDeltaX(boundedDelta);
  };

  const handlePointerUp = (event) => {
    if (!mouseDraggingRef.current) {
      return;
    }
    mouseDraggingRef.current = false;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Ignore unsupported pointer capture.
    }
    const startX = pointerStartXRef.current;
    pointerStartXRef.current = null;
    setIsDraggingCard(false);
    if (startX == null) {
      return;
    }
    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
      resetCardPosition();
      return;
    }
    if (deltaX < 0) {
      animateSwipeTo(1);
      return;
    }
    animateSwipeTo(-1);
  };

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
              <div className="flex w-full items-center rounded-xl border border-[#a3b18a] bg-[#fcfdf8] px-1.5 min-[420px]:px-2 py-1.5 min-[420px]:py-2 transition-colors focus-within:ring-2 focus-within:ring-[#588157] dark:border-[#444d57] dark:bg-[#1a1d20] dark:focus-within:ring-[#6f9b74]">
                <input
                  value={filters.q}
                  onChange={(event) => handleFilterChange('q', event.target.value)}
                  placeholder="Search jobs..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 min-[420px]:px-4 py-2 text-[#344e41] outline-none placeholder:text-[#6b7c6a] dark:text-white dark:placeholder:text-[#adb5be]"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#3a5a40] px-3 min-[420px]:px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#344e41] hover:shadow-md hover:shadow-[#344e41]/15 dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] dark:hover:shadow-[#6f9b74]/20"
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
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#a8b892] bg-[#fcfdf8] px-3 min-[420px]:px-4 py-3 min-[420px]:py-3.5 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:bg-[#1a1d20] dark:text-white dark:hover:bg-[#353c44]"
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
        <div className="bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl p-6">
          <p className="text-[#344e41] dark:text-[#d0d7dd]">
            {hasActiveFilters ? 'No jobs matched your current filters yet. Try broadening the search.' : 'No jobs available right now.'}
          </p>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#5f6f52] dark:text-[#a8b1ba]">
              {activeIndex + 1} of {jobs.length}
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-[980px] items-center justify-center gap-3 md:gap-6 lg:gap-10">
            <button
              type="button"
              onClick={() => animateSwipeTo(-1)}
              disabled={jobs.length <= 1}
              aria-label="Previous job"
              className="hidden md:inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#a3b18a] bg-[#f8fbf6] text-[#344e41] transition-colors hover:bg-[#eef6ee] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#444d57] dark:bg-[#22272b] dark:text-[#eceff2] dark:hover:bg-[#353c44]"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  animateSwipeTo(-1);
                }
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  animateSwipeTo(1);
                }
              }}
              onTouchStart={handleSwipeStart}
              onTouchMove={handleSwipeMove}
              onTouchEnd={handleSwipeEnd}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                pointerStartXRef.current = null;
                mouseDraggingRef.current = false;
                touchDraggingRef.current = false;
                setIsDraggingCard(false);
                resetCardPosition();
              }}
              className={`w-full max-w-[700px] outline-none focus-visible:ring-2 focus-visible:ring-[#588157] rounded-2xl select-none ${isDraggingCard ? 'cursor-grabbing' : 'cursor-grab'}`}
              aria-label="Swipe left or right to browse jobs"
            >
              <div
                style={{
                  transform: `translateX(${animOffsetX + dragDeltaX}px)`,
                  opacity: animOpacity,
                  transitionProperty: 'transform, opacity',
                  transitionDuration: `${animDurationMs}ms`,
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <SquareJobCard
                  job={currentJob}
                  profileCompleted={Boolean(user?.profileCompleted)}
                  onViewCompany={handleOpenCompany}
                  onMoreInfo={handleOpenDetail}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => animateSwipeTo(1)}
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

function SquareJobCard({ job, profileCompleted = false, onViewCompany, onMoreInfo }) {
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
    <article className="aspect-square w-full rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] p-5 shadow-sm transition-colors dark:border-[#353c44] dark:bg-[#22272b] sm:p-7">
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
    </article>
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
