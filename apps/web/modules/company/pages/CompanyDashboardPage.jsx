import React, { useMemo, useState } from 'react';
import { Briefcase, PlusCircle, WalletCards, Search, MapPin, ChevronDown, ArrowDownUp } from 'lucide-react';
import { useCompanyJobs } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, formatJobStatus, navigate } from '@companyFeatures/companyUtils';

function OverviewIconAction({ icon: Icon, label, onClick, variant = 'default' }) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type="button"
      onClick={onClick}
      className={isPrimary
        ? 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#588157] dark:border-[#3ba9d6] bg-[#3a5a40] dark:bg-[#1f6f96] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#344e41] dark:hover:bg-[#2d8bb8] hover:shadow-lg hover:shadow-black/10'
        : 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[#f8fbf6] dark:bg-[#162842] px-4 py-2.5 text-sm font-semibold text-[#3a5a40] dark:text-white transition-all hover:-translate-y-0.5 hover:border-[#588157] dark:hover:border-[#3ba9d6] hover:bg-[#f8fbf5] dark:hover:bg-[#1e3a5f]'}
    >
      <Icon className={isPrimary ? 'h-4 w-4 text-white' : 'h-4 w-4 text-[#588157] dark:text-[#7fd0ee]'} />
      <span>{label}</span>
    </button>
  );
}

function OverviewTab({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${active ? 'border-[#3a5a40] bg-[#3a5a40] text-white dark:border-[#3ba9d6] dark:bg-[#3ba9d6] dark:text-[#0a1628]' : 'border-[#d6d3c9] bg-[#f8fbf6] text-[#3a5a40] hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:hover:bg-[#1e3a5f]'}`}
    >
      {label} ({count})
    </button>
  );
}

function FilterInput({ icon: Icon, value, onChange, placeholder }) {
  return (
    <label className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#162842] px-3.5 py-2.5 shadow-sm shadow-black/5 transition-colors focus-within:border-[#588157] dark:focus-within:border-[#3ba9d6]">
      <Icon className="h-4 w-4 shrink-0 text-[#588157] dark:text-[#7fd0ee]" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-[#344e41] outline-none placeholder:text-[#6b7280] dark:text-white dark:placeholder:text-[#9fb4ca]"
      />
    </label>
  );
}

function FilterSelect({ icon: Icon, label, value, onChange, children }) {
  return (
    <label className="flex min-w-0 items-center gap-2.5 overflow-hidden rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#162842] px-3.5 py-2.5 shadow-sm shadow-black/5 transition-colors focus-within:border-[#588157] dark:focus-within:border-[#3ba9d6]">
      <Icon className="h-4 w-4 shrink-0 text-[#588157] dark:text-[#7fd0ee]" />
      <span className="hidden shrink-0 text-sm font-semibold text-[#3a5a40] dark:text-white min-[420px]:inline">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="min-w-0 w-full flex-1 appearance-none truncate bg-transparent pr-5 text-sm text-[#344e41] outline-none dark:text-white"
      >
        {children}
      </select>
      <ChevronDown className="h-4 w-4 shrink-0 text-[#6b7280] dark:text-[#9fb4ca]" />
    </label>
  );
}

function formatJobDate(value) {
  if (!value) return 'No posting date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No posting date';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function CompactJobRow({ job, onManage, onOpenApplicants }) {
  const applicants = Number(job?.applicant_count || job?.applicantCount || 0);
  const status = String(job?.status || 'open').toLowerCase();
  const statusDot = status === 'open' ? 'bg-emerald-500' : status === 'closed' ? 'bg-amber-500' : status === 'draft' ? 'bg-[#8ea18c]' : 'bg-sky-500';
  const planPrice = Number(job?.posting_plan_price || job?.pay_per_use_fee || 0);
  const planDuration = String(job?.posting_plan_duration || '').trim();

  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl bg-[#f8fbf6] dark:bg-[#162842] p-4 shadow-sm shadow-black/5 lg:grid-cols-[minmax(0,2.2fr)_0.9fr_0.8fr_0.9fr_0.8fr] lg:items-center lg:gap-5 lg:p-5">
      <div className="min-w-0">
        <p className="truncate text-[1.05rem] font-bold text-[#3a5a40] dark:text-white">{job?.title || 'Untitled job'}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#4b5563] dark:text-[#b8d4e8]">
          {job?.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
              {job.location}
            </span>
          ) : null}
          {job?.type ? (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
              {job.type}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-[#6b7280] dark:text-[#9fb4ca]">Posted: {formatJobDate(job?.created_at || job?.createdAt)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:contents">
        <div className="rounded-xl bg-[#f8fbf6] px-3 py-2.5 dark:bg-[#102235] lg:rounded-none lg:bg-transparent lg:p-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca] lg:hidden">Candidates</p>
          <p className="text-lg font-bold text-[#31572c] dark:text-white">{applicants}</p>
          <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Applicants</p>
        </div>

        <div className="rounded-xl bg-[#f8fbf6] px-3 py-2.5 dark:bg-[#102235] lg:rounded-none lg:bg-transparent lg:p-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca] lg:hidden">Posting Plan</p>
          <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">
            {planPrice > 0 ? `PHP ${planPrice.toLocaleString()}` : 'Plan saved'}
          </p>
          <p className="text-xs text-[#4b5563] dark:text-[#b8d4e8]">{planDuration || 'Selected in merchant'}</p>
        </div>

        <div className="rounded-xl bg-[#f8fbf6] px-3 py-2.5 dark:bg-[#102235] lg:rounded-none lg:bg-transparent lg:p-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca] lg:hidden">Job Status</p>
          <button
            type="button"
            onClick={() => {
              if (status === 'open') onOpenApplicants?.(job);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#fbfcfa] dark:bg-[#102235] px-3 py-2 text-sm text-[#344e41] dark:text-white disabled:cursor-not-allowed disabled:opacity-80"
            disabled={status !== 'open'}
            aria-label={status === 'open' ? 'Open applicants list for this job' : 'Job status'}
            title={status === 'open' ? 'Open applicants for this job' : undefined}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
            <span>{formatJobStatus(status)}</span>
            <ChevronDown className="h-4 w-4 text-[#6b7280] dark:text-[#9fb4ca]" />
          </button>
        </div>

        <div className="rounded-xl bg-[#f8fbf6] px-3 py-2.5 dark:bg-[#102235] lg:rounded-none lg:bg-transparent lg:p-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca] lg:hidden">Action</p>
          <button
            type="button"
            onClick={() => onManage(job)}
            className="rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f8fbf6] px-4 py-2.5 text-sm font-medium text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:bg-[#162842] dark:text-white dark:hover:bg-[#1e3a5f]"
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDashboardPage() {
  const { jobs, loading: jobsLoading, error: jobsError } = useCompanyJobs();
  const [statusTab, setStatusTab] = useState('open');
  const [titleQuery, setTitleQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [sortBy, setSortBy] = useState('posting_date');
  const [sortOrder, setSortOrder] = useState('desc');

  const openJobs = useMemo(() => jobs.filter((job) => String(job?.status || '').toLowerCase() === 'open'), [jobs]);
  const draftJobs = useMemo(() => jobs.filter((job) => String(job?.status || '').toLowerCase() === 'draft' || String(job?.posting_payment_status || '').toLowerCase() !== 'paid'), [jobs]);
  const closedJobs = useMemo(() => jobs.filter((job) => {
    const status = String(job?.status || '').toLowerCase();
    return status !== 'open' && status !== 'draft';
  }), [jobs]);
  const jobsByStatus = useMemo(() => jobs.reduce((acc, job) => {
    const status = String(job?.status || '').toLowerCase() || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}), [jobs]);
  const totalApplicants = useMemo(
    () => jobs.reduce((sum, job) => sum + Number(job?.applicant_count || job?.applicantCount || 0), 0),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    const source = statusTab === 'open' ? openJobs : statusTab === 'draft' ? draftJobs : closedJobs;
    const normalizedTitle = titleQuery.trim().toLowerCase();
    const normalizedLocation = locationQuery.trim().toLowerCase();

    const nextJobs = source.filter((job) => {
      const matchesTitle = !normalizedTitle || String(job?.title || '').toLowerCase().includes(normalizedTitle);
      const matchesLocation = !normalizedLocation || String(job?.location || '').toLowerCase().includes(normalizedLocation);
      return matchesTitle && matchesLocation;
    });

    nextJobs.sort((a, b) => {
      if (sortBy === 'title') {
        const compare = String(a?.title || '').localeCompare(String(b?.title || ''));
        return sortOrder === 'asc' ? compare : -compare;
      }

      const aTime = new Date(a?.created_at || a?.createdAt || 0).getTime();
      const bTime = new Date(b?.created_at || b?.createdAt || 0).getTime();
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });

    return nextJobs;
  }, [closedJobs, draftJobs, locationQuery, openJobs, sortBy, sortOrder, statusTab, titleQuery]);
  const overviewGraphData = useMemo(
    () => [
      { label: 'Total jobs', value: Number(jobs.length), color: '#3a5a40' },
      { label: 'Open jobs', value: Number(jobsByStatus.open ?? 0), color: '#6d9273' },
      { label: 'Filled jobs', value: Number(jobsByStatus.filled ?? 0), color: '#93b18e' },
      { label: 'Total applicants', value: Number(totalApplicants), color: '#588157' },
    ],
    [jobs.length, jobsByStatus.filled, jobsByStatus.open, totalApplicants],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#3a5a40] dark:text-white">Overview</h2>
        </div>
        <div className="ml-auto flex w-auto flex-wrap items-center justify-end gap-2">
          <OverviewIconAction icon={PlusCircle} label="Post a job" variant="primary" onClick={() => navigate(COMPANY_PATHS.postJob)} />
          <OverviewIconAction icon={Search} label="Search developers" onClick={() => navigate(COMPANY_PATHS.search)} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[linear-gradient(135deg,#f8fbf5,#edf5ea)] dark:bg-[linear-gradient(135deg,#16304a,#102235)] p-3.5 sm:p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="rounded-lg sm:rounded-xl bg-[#f8fbf6]/80 dark:bg-[#0f2139] p-2 sm:p-3 border border-[#d6d3c9] dark:border-[#2a4a6f]">
            <WalletCards className="w-4 h-4 sm:w-5 sm:h-5 text-[#3a5a40] dark:text-[#7fd0ee]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#3a5a40] dark:text-white">Pay before posting</h3>
            <p className="mt-1 text-[13px] sm:text-sm text-[#344e41] dark:text-[#dcecff]">Before you post a job, payment is required and the listing goes live only after the selected plan is confirmed.</p>
            <p className="mt-1 text-[13px] sm:text-sm text-[#344e41] dark:text-[#dcecff]">Reposting an old job also opens the merchant payment page again, so every live listing follows the same plan-selection flow.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[#f8fbf6] dark:bg-[#162842] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Applicants snapshot graph</h3>
        <SummaryGraph data={jobsLoading ? [] : overviewGraphData} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <OverviewTab active={statusTab === 'open'} label="Open" count={openJobs.length} onClick={() => setStatusTab('open')} />
          <OverviewTab active={statusTab === 'draft'} label="Draft" count={draftJobs.length} onClick={() => setStatusTab('draft')} />
          <OverviewTab active={statusTab === 'closed'} label="Closed" count={closedJobs.length} onClick={() => setStatusTab('closed')} />
        </div>

        <div className="grid grid-cols-1 gap-2.5 min-[520px]:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(160px,0.72fr)_minmax(160px,0.72fr)]">
          <FilterInput icon={Search} value={titleQuery} onChange={(event) => setTitleQuery(event.target.value)} placeholder="Search job titles" />
          <FilterInput icon={MapPin} value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} placeholder="Search locations" />
          <FilterSelect icon={Search} label="Sort by" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="posting_date">Posting date</option>
            <option value="title">Job title</option>
          </FilterSelect>
          <FilterSelect icon={ArrowDownUp} label="Order" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </FilterSelect>
        </div>

        <div className="hidden lg:grid grid-cols-[minmax(0,2.2fr)_0.9fr_0.8fr_0.9fr_0.8fr] gap-5 rounded-2xl bg-[#f5f5f2] dark:bg-[#102235] px-5 py-4 text-sm font-semibold text-[#344e41] dark:text-[#dcecff]">
          <div>Job Title</div>
          <div>Candidates</div>
          <div>Posting Plan</div>
          <div>Job Status</div>
          <div>Action</div>
        </div>

        {jobsError && <p className="text-sm text-red-600 dark:text-red-400">{jobsError}</p>}
        {jobsLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[120px] lg:h-[88px] w-full rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[#f8fbf6] dark:bg-[#162842] p-6 transition-colors duration-300">
            <p className="text-[#344e41] dark:text-[#b8d4e8]">No jobs match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.slice(0, 8).map((job) => (
              <CompactJobRow
                key={job.id}
                job={job}
                onManage={() => navigate(COMPANY_PATHS.jobs)}
                onOpenApplicants={(selectedJob) => {
                  const params = new URLSearchParams();
                  params.set('job', String(selectedJob?.id || ''));
                  if (selectedJob?.title) {
                    params.set('title', String(selectedJob.title));
                  }
                  navigate(`${COMPANY_PATHS.applicants}?${params.toString()}`);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryGraph({ data }) {
  if (!data.length) {
    return (
      <div className="mt-5 grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-5 animate-pulse">
        <div className="flex justify-center">
          <div className="h-28 w-28 sm:h-40 sm:w-40 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5" />
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-full max-w-xs rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5" />
          ))}
        </div>
      </div>
    );
  }
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const safeTotal = total > 0 ? total : 1;
  let currentAngle = 0;
  const gradientStops = data
    .map((item) => {
      const angle = (item.value / safeTotal) * 360;
      const start = currentAngle;
      const end = currentAngle + angle;
      currentAngle = end;
      return `${item.color} ${start}deg ${end}deg`;
    })
    .join(', ');

  return (
    <div className="mt-5 grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-5">
      <div className="flex justify-center">
        <div className="h-28 w-28 sm:h-40 sm:w-40" role="img" aria-label="Overview summary donut chart">
          <div className="h-full w-full rounded-full" style={{ background: `conic-gradient(${gradientStops || '#d1d5db 0deg 360deg'})` }} />
        </div>
      </div>
      <div className="space-y-2.5">
        {data.map((item) => {
          const percent = Math.round((item.value / safeTotal) * 100);
          return (
            <div key={item.label} className="flex items-center justify-between rounded-xl border border-[#d6d3c9] px-3 py-2 dark:border-[#2a4a6f]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs sm:text-sm font-medium text-[#344e41] dark:text-[#dcecff]">{item.label}</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#3a5a40] dark:text-white">
                {item.value} <span className="text-[11px] font-medium text-[#6b7280] dark:text-[#9fb4ca]">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
