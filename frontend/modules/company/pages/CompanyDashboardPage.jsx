import React, { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock, UserPlus, Users } from 'lucide-react';
import { CompanyPeriodSelect, CompanyStatStrip } from '@companyComponents/CompanyWorkspaceControls';
import { useCompanyAnalytics, useCompanyJobs } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, formatJobStatus, navigate } from '@companyFeatures/companyUtils';
import { clearCompanyPostJobFormDraft } from '@companyFeatures/postJobDraftStorage';
import TimedInfoPopup from '@sharedComponents/ui/TimedInfoPopup';

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
];

const STATUS_LABELS = {
  pending: 'Awaiting review',
  reviewed: 'Reviewed',
  accepted: 'Hired',
  rejected: 'Rejected',
  open: 'Open jobs',
  draft: 'Draft jobs',
  filled: 'Filled jobs',
  closed: 'Closed jobs',
};

const formatCompactDate = (value) => {
  if (!value) return 'No date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No date';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const formatDelta = (current, previous) => {
  const safeCurrent = Number(current || 0);
  const safePrevious = Number(previous || 0);
  const diff = safeCurrent - safePrevious;
  if (diff === 0) return { label: 'No change', direction: 'neutral' };
  return {
    label: `${diff > 0 ? '+' : ''}${diff} vs prior`,
    direction: diff > 0 ? 'up' : 'down',
  };
};

const buildLinePath = (entries, maxValue) => {
  const safeEntries = entries.length > 1 ? entries : [{ count: 0 }, { count: 0 }];
  const width = 720;
  const height = 220;
  const top = 24;
  const bottom = 32;
  const usableHeight = height - top - bottom;
  const denominator = Math.max(safeEntries.length - 1, 1);

  return safeEntries
    .map((entry, index) => {
      const x = Math.round((index / denominator) * width);
      const y = Math.round(top + usableHeight - (Number(entry?.count || 0) / maxValue) * usableHeight);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};

const buildAreaPath = (entries, maxValue) => {
  const safeEntries = entries.length > 1 ? entries : [{ count: 0 }, { count: 0 }];
  const width = 720;
  const height = 220;
  const top = 24;
  const bottom = 32;
  const usableHeight = height - top - bottom;
  const denominator = Math.max(safeEntries.length - 1, 1);
  const baseY = top + usableHeight;

  const points = safeEntries.map((entry, index) => {
    const x = Math.round((index / denominator) * width);
    const y = Math.round(top + usableHeight - (Number(entry?.count || 0) / maxValue) * usableHeight);
    return { x, y };
  });

  let path = `M ${points[0].x} ${baseY}`;
  points.forEach((point) => {
    path += ` L ${point.x} ${point.y}`;
  });
  path += ` L ${points[points.length - 1].x} ${baseY} Z`;
  return path;
};

export default function CompanyDashboardPage() {
  const [rangeDays, setRangeDays] = useState(30);
  const { jobs, loading: jobsLoading, error: jobsError } = useCompanyJobs();
  const { analytics, loading: analyticsLoading, error: analyticsError } = useCompanyAnalytics({ days: rangeDays });

  const activeJobs = useMemo(() => {
    return [...jobs]
      .sort((left, right) => {
        const leftTime = new Date(left?.created_at || left?.createdAt || 0).getTime();
        const rightTime = new Date(right?.created_at || right?.createdAt || 0).getTime();
        return rightTime - leftTime;
      })
      .slice(0, 6);
  }, [jobs]);

  const applicantsDelta = useMemo(() => formatDelta(analytics?.newApplicantsInRange, analytics?.previousPeriod?.newApplicantsInRange), [analytics]);

  const metrics = useMemo(() => {
    return [
      {
        label: 'Open jobs',
        value: Number(analytics?.openJobs || 0),
        icon: <BriefcaseBusiness />,
        sublabel: `${Number(analytics?.draftJobs || 0)} drafts waiting to publish`,
      },
      {
        label: 'New applicants',
        value: Number(analytics?.newApplicantsInRange || 0),
        icon: <UserPlus />,
        trend: applicantsDelta,
        sublabel: `Last ${rangeDays} days`,
      },
      {
        label: 'Awaiting review',
        value: Number(analytics?.applicantsAwaitingReview || 0),
        icon: <Clock />,
        sublabel: `${Number(analytics?.totalApplicants || 0)} total applicants`,
      },
      {
        label: 'Filled roles',
        value: Number(analytics?.filledJobs || 0),
        icon: <CheckCircle2 />,
        sublabel: analytics?.averageDaysOpen == null ? 'No close-time data yet' : `${analytics.averageDaysOpen} avg days open`,
      },
    ];
  }, [analytics, rangeDays, applicantsDelta]);

  const jobStatusRows = useMemo(() => {
    const source = analytics?.jobsByStatus || {};
    return ['open', 'draft', 'filled', 'closed']
      .map((key) => ({
        key,
        label: STATUS_LABELS[key] || key,
        value: Number(source[key] || 0),
      }))
      .filter((item) => item.value > 0 || item.key === 'open');
  }, [analytics?.jobsByStatus]);

  const applicantStatusRows = useMemo(() => {
    const source = analytics?.applicantsByStatus || {};
    return ['pending', 'reviewed', 'accepted', 'rejected']
      .map((key) => ({
        key,
        label: STATUS_LABELS[key] || key,
        value: Number(source[key] || 0),
      }))
      .filter((item) => item.value > 0 || item.key === 'pending');
  }, [analytics?.applicantsByStatus]);

  const chartMax = useMemo(() => {
    const values = Array.isArray(analytics?.applicationsOverTime)
      ? analytics.applicationsOverTime.map((entry) => Number(entry?.count || 0))
      : [];
    return Math.max(...values, 1);
  }, [analytics?.applicationsOverTime]);

  const timeline = useMemo(() => (
    Array.isArray(analytics?.applicationsOverTime) ? analytics.applicationsOverTime : []
  ), [analytics?.applicationsOverTime]);

  const chartPath = useMemo(() => buildLinePath(timeline, chartMax), [chartMax, timeline]);
  const areaPath = useMemo(() => buildAreaPath(timeline, chartMax), [chartMax, timeline]);

  const handleStartFreshPostJob = () => {
    clearCompanyPostJobFormDraft();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('company-post-job-draft');
    }
    navigate(COMPANY_PATHS.postJob);
  };

  const showEmptyState = !jobsLoading && !analyticsLoading && Number(analytics?.totalJobs || 0) === 0;

  return (
    <div className="company-workspace-page space-y-6">
      <TimedInfoPopup
        title="Hiring workspace"
        message="This overview is meant to help you spot what needs attention quickly. Use Jobs for publishing operations, Applicants for candidate review, and Talent Search when you want to source proactively."
        dismissKey="company_hiring_workspace_direction"
      />

      <div className="company-workspace-page-heading-row">
        <div>
          <h1 className="company-workspace-page-title">Hiring overview</h1>
          <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Track what needs attention across roles, applicants, and hiring activity.</p>
        </div>
        <CompanyPeriodSelect
          value={rangeDays}
          options={RANGE_OPTIONS}
          onChange={setRangeDays}
          label="Dashboard date range"
        />
      </div>
      {jobsError ? <p className="text-sm text-red-600 dark:text-red-400">{jobsError}</p> : null}
      {analyticsError ? <p className="text-sm text-red-600 dark:text-red-400">{analyticsError}</p> : null}

      {showEmptyState ? (
        <section className="company-workspace-empty-quiet p-10">
          <div className="empty-icon">
            <BriefcaseBusiness />
          </div>
          <h2 className="text-xl font-semibold text-[var(--workspace-text-strong)]">No hiring activity yet</h2>
          <p className="mt-1 max-w-md text-sm text-[var(--workspace-text-muted)]">
            Start with your first role, then this overview will show applicant flow, role status, and hiring progress.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={handleStartFreshPostJob} className="company-workspace-primary-button px-4">
              Post a job
            </button>
            <button type="button" onClick={() => navigate(COMPANY_PATHS.search)} className="company-workspace-secondary-button px-4">
              Search developers
            </button>
          </div>
        </section>
      ) : (
        <section className="company-analytics-board">
          <CompanyStatStrip metrics={metrics} loading={analyticsLoading} />

          <div className="company-analytics-board-section grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
            <article className="company-analytics-muted-panel p-5 xl:border-r xl:border-[var(--workspace-border)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="company-workspace-section-title">Applicant flow</h2>
                  <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">New applications across the selected period.</p>
                </div>
                <span className="company-analytics-kicker">{rangeDays} days</span>
              </div>

              <div className="company-analytics-chart mt-4">
                <svg viewBox="0 0 720 220" role="img" aria-label="Applications over time">
                  <defs>
                    <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--workspace-primary)" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="var(--workspace-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[24, 65, 106, 147, 188].map((y) => (
                    <line key={y} x1="0" x2="720" y1={y} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 8" />
                  ))}
                  <path d={areaPath} fill="url(#chartAreaGrad)" className="company-chart-area" />
                  <path d={chartPath} fill="none" stroke="var(--workspace-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="company-chart-line-animated" />
                </svg>
                <div className="mt-1 flex justify-between text-xs tabular-nums text-[var(--workspace-text-muted)]">
                  <span>{formatCompactDate(timeline[0]?.day)}</span>
                  <span>{formatCompactDate(timeline[Math.floor((timeline.length - 1) / 2)]?.day)}</span>
                  <span>{formatCompactDate(timeline[timeline.length - 1]?.day)}</span>
                </div>
              </div>
            </article>

            <article className="p-5">
              <h2 className="company-workspace-section-title">Hiring pipeline</h2>
              <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Role and applicant status in one view.</p>

              <div className="mt-5 space-y-6">
                <StatusList title="Jobs" rows={jobStatusRows} />
                <StatusList title="Applicants" rows={applicantStatusRows} />
              </div>
            </article>
          </div>

          <div className="company-analytics-board-section p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="company-workspace-section-title">Active roles</h2>
                <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Recent openings with direct shortcuts into jobs and applicants.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(COMPANY_PATHS.jobs)}
                className="company-workspace-secondary-button inline-flex items-center gap-2 px-4"
              >
                <span>Open Jobs</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="company-workspace-table-header mt-5 hidden grid-cols-[minmax(0,2fr)_0.8fr_0.8fr_0.7fr_0.8fr] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-[0.05em] xl:grid">
              <div>Role</div>
              <div>Status</div>
              <div>Applicants</div>
              <div>Posted</div>
              <div>Action</div>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--workspace-border)]">
              {activeJobs.map((job) => (
                <div key={job.id} className="company-analytics-row grid grid-cols-1 gap-3 p-4 xl:grid-cols-[minmax(0,2fr)_0.8fr_0.8fr_0.7fr_0.8fr] xl:items-center xl:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--workspace-text-strong)]">{job?.title || 'Untitled job'}</p>
                    <p className="mt-1 truncate text-sm text-[var(--workspace-text-muted)]">{job?.location || 'No location added'}</p>
                  </div>
                  <div>
                    <span className="company-workspace-status-badge" data-status={String(job?.status || 'open').toLowerCase()}>
                      {formatJobStatus(job?.status || 'open')}
                    </span>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-[var(--workspace-text-strong)]">
                    {Number(job?.applicant_count || job?.applicantCount || 0)}
                  </div>
                  <div className="text-sm text-[var(--workspace-text-muted)]">{formatCompactDate(job?.created_at || job?.createdAt)}</div>
                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <button type="button" onClick={() => navigate(COMPANY_PATHS.jobs)} className="company-workspace-secondary-button px-3">
                      Manage
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set('job', String(job?.id || ''));
                        params.set('title', String(job?.title || ''));
                        navigate(`${COMPANY_PATHS.applicants}?${params.toString()}`);
                      }}
                      className="company-workspace-primary-button inline-flex items-center gap-2 px-3"
                    >
                      <Users className="h-4 w-4" />
                      <span>Applicants</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StatusList({ title, rows }) {
  const maxValue = Math.max(...rows.map((row) => Number(row?.value || 0)), 1);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--workspace-text-muted)]">{title}</p>
      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-[var(--workspace-text)]">{row.label}</span>
                <span className="text-sm font-semibold tabular-nums text-[var(--workspace-text-strong)]">{row.value}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--workspace-surface-subtle)]">
                <div
                  className="company-pipeline-bar h-2.5 rounded-full transition-all duration-500 ease-out"
                  data-status={row.key}
                  style={{ width: `${Math.max(8, Math.round((Number(row.value || 0) / maxValue) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
