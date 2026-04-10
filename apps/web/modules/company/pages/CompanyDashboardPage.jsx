import React, { useMemo, useState } from 'react';
import { Briefcase, Users, BarChart3, PlusCircle, WalletCards, Search, MapPin, ChevronDown, ArrowDownUp } from 'lucide-react';
import StatsCard from '@companyComponents/CompanyStatsCard';
import { useCompanyAnalytics, useCompanyJobs } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, formatJobStatus, navigate } from '@companyFeatures/companyUtils';

function OverviewIconAction({ icon: Icon, label, onClick, variant = 'default' }) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type="button"
      onClick={onClick}
      className={isPrimary
        ? 'inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#588157] dark:border-[#3ba9d6] bg-[#3a5a40] dark:bg-[#1f6f96] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#344e41] dark:hover:bg-[#2d8bb8] hover:shadow-lg hover:shadow-black/10'
        : 'inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] px-4 py-2.5 text-sm font-semibold text-[#3a5a40] dark:text-white transition-all hover:-translate-y-0.5 hover:border-[#588157] dark:hover:border-[#3ba9d6] hover:bg-[#f8fbf5] dark:hover:bg-[#1e3a5f]'}
    >
      <Icon className={isPrimary ? 'w-4 h-4 text-white' : 'w-4 h-4 text-[#588157] dark:text-[#7fd0ee]'} />
      <span>{label}</span>
    </button>
  );
}

function OverviewTab({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${active ? 'border-[#3a5a40] bg-[#3a5a40] text-white dark:border-[#3ba9d6] dark:bg-[#3ba9d6] dark:text-[#0a1628]' : 'border-[#d6d3c9] bg-white text-[#3a5a40] hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:hover:bg-[#1e3a5f]'}`}
    >
      {label} ({count})
    </button>
  );
}

function FilterInput({ icon: Icon, value, onChange, placeholder }) {
  return (
    <label className="flex min-w-0 items-center gap-3 rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-white dark:bg-[#162842] px-4 py-3 shadow-sm shadow-black/5 transition-colors focus-within:border-[#588157] dark:focus-within:border-[#3ba9d6]">
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
    <label className="flex min-w-0 items-center gap-3 rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-white dark:bg-[#162842] px-4 py-3 shadow-sm shadow-black/5 transition-colors focus-within:border-[#588157] dark:focus-within:border-[#3ba9d6]">
      <Icon className="h-4 w-4 shrink-0 text-[#588157] dark:text-[#7fd0ee]" />
      <span className="shrink-0 text-sm font-semibold text-[#3a5a40] dark:text-white">{label}</span>
      <select value={value} onChange={onChange} className="min-w-0 w-full bg-transparent text-sm text-[#344e41] outline-none dark:text-white">
        {children}
      </select>
    </label>
  );
}

function formatJobDate(value) {
  if (!value) return 'No posting date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No posting date';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function CompactJobRow({ job, onManage }) {
  const applicants = Number(job?.applicant_count || job?.applicantCount || 0);
  const status = String(job?.status || 'open').toLowerCase();
  const statusDot = status === 'open' ? 'bg-emerald-500' : status === 'closed' ? 'bg-amber-500' : status === 'draft' ? 'bg-slate-500' : 'bg-sky-500';
  const planPrice = Number(job?.posting_plan_price || job?.pay_per_use_fee || 0);
  const planDuration = String(job?.posting_plan_duration || '').trim();

  return (
    <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-white dark:bg-[#162842] p-5 shadow-sm shadow-black/5 lg:grid-cols-[minmax(0,2.2fr)_0.9fr_0.8fr_0.9fr_0.8fr] lg:items-center lg:gap-5">
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-[#3a5a40] dark:text-white">{job?.title || 'Untitled job'}</p>
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

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca] lg:hidden">Candidates</p>
        <p className="text-lg font-bold text-[#31572c] dark:text-white">{applicants}</p>
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Applicants</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca] lg:hidden">Posting Plan</p>
        <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">
          {planPrice > 0 ? `PHP ${planPrice.toLocaleString()}` : 'Plan saved'}
        </p>
        <p className="text-xs text-[#4b5563] dark:text-[#b8d4e8]">{planDuration || 'Selected in merchant'}</p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca] lg:hidden">Job Status</p>
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#fbfcfa] dark:bg-[#102235] px-3 py-2 text-sm text-[#344e41] dark:text-white">
          <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
          <span>{formatJobStatus(status)}</span>
          <ChevronDown className="h-4 w-4 text-[#6b7280] dark:text-[#9fb4ca]" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca] lg:hidden">Action</p>
        <button
          type="button"
          onClick={() => onManage(job)}
          className="rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-white px-4 py-2.5 text-sm font-medium text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:bg-[#162842] dark:text-white dark:hover:bg-[#1e3a5f]"
        >
          Manage
        </button>
      </div>
    </div>
  );
}

export default function CompanyDashboardPage() {
  const { analytics, loading: analyticsLoading, error: analyticsError } = useCompanyAnalytics();
  const { jobs, loading: jobsLoading, error: jobsError } = useCompanyJobs();
  const jobsByStatus = analytics?.jobsByStatus || {};
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#3a5a40] dark:text-white">Overview</h2>
        </div>
        <div className="flex w-full sm:w-auto flex-col min-[420px]:flex-row flex-wrap items-stretch sm:items-center justify-end gap-3 ml-auto">
          <OverviewIconAction icon={PlusCircle} label="Post a job" variant="primary" onClick={() => navigate(COMPANY_PATHS.postJob)} />
          <OverviewIconAction icon={Search} label="Search developers" onClick={() => navigate(COMPANY_PATHS.search)} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[linear-gradient(135deg,#f8fbf5,#edf5ea)] dark:bg-[linear-gradient(135deg,#16304a,#102235)] p-4 sm:p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white/80 dark:bg-[#0f2139] p-3 border border-[#d6d3c9] dark:border-[#2a4a6f]">
            <WalletCards className="w-5 h-5 text-[#3a5a40] dark:text-[#7fd0ee]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Pay before posting</h3>
            <p className="mt-1 text-sm text-[#344e41] dark:text-[#dcecff]">Before you post a job, payment is required and the listing goes live only after the selected plan is confirmed.</p>
            <p className="mt-1 text-sm text-[#344e41] dark:text-[#dcecff]">Reposting an old job also opens the merchant payment page again, so every live listing follows the same plan-selection flow.</p>
          </div>
        </div>
      </div>

      {analyticsError && <p className="text-sm text-red-600 dark:text-red-400">{analyticsError}</p>}
      <div className="grid grid-cols-1 min-[430px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard label="Total jobs" value={analyticsLoading ? '-' : analytics?.totalJobs ?? 0} icon={Briefcase} />
        <StatsCard label="Open jobs" value={analyticsLoading ? '-' : jobsByStatus.open ?? 0} icon={BarChart3} />
        <StatsCard label="Filled jobs" value={analyticsLoading ? '-' : jobsByStatus.filled ?? 0} icon={Users} />
        <StatsCard label="Total applicants" value={analyticsLoading ? '-' : analytics?.totalApplicants ?? 0} icon={Users} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          <OverviewTab active={statusTab === 'open'} label="Open" count={openJobs.length} onClick={() => setStatusTab('open')} />
          <OverviewTab active={statusTab === 'draft'} label="Draft" count={draftJobs.length} onClick={() => setStatusTab('draft')} />
          <OverviewTab active={statusTab === 'closed'} label="Closed" count={closedJobs.length} onClick={() => setStatusTab('closed')} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(180px,0.72fr)_minmax(180px,0.72fr)]">
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
          <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-6 transition-colors duration-300">
            <p className="text-[#344e41] dark:text-[#b8d4e8]">No jobs match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.slice(0, 8).map((job) => (
              <CompactJobRow key={job.id} job={job} onManage={() => navigate(COMPANY_PATHS.jobs)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}






