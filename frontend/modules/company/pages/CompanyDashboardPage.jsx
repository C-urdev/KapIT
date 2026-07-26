import React, { useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, PlusCircle, Search, Users } from 'lucide-react';
import { CompanyPeriodControl, CompanyStatStrip } from '@companyComponents/CompanyWorkspaceControls';
import { useCompanyAnalytics, useCompanyJobs } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, formatJobStatus, navigate } from '@companyFeatures/companyUtils';
import { clearCompanyPostJobFormDraft } from '@companyFeatures/postJobDraftStorage';
import TimedInfoPopup from '@sharedComponents/ui/TimedInfoPopup';

const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
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
  if (diff === 0) return 'No change';
  return `${diff > 0 ? '+' : ''}${diff} vs previous period`;
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

  const metrics = useMemo(() => {
    return [
      {
        label: 'Open jobs',
        value: Number(analytics?.openJobs || 0),
        sublabel: `${Number(analytics?.draftJobs || 0)} drafts waiting to publish`,
      },
      {
        label: 'New applicants',
        value: Number(analytics?.newApplicantsInRange || 0),
        sublabel: `Last ${rangeDays} days. ${formatDelta(analytics?.newApplicantsInRange, analytics?.previousPeriod?.newApplicantsInRange)}`,
      },
      {
        label: 'Awaiting review',
        value: Number(analytics?.applicantsAwaitingReview || 0),
        sublabel: `${Number(analytics?.totalApplicants || 0)} total applicants`,
      },
      {
        label: 'Filled roles',
        value: Number(analytics?.filledJobs || 0),
        sublabel: analytics?.averageDaysOpen == null ? 'No close-time data yet' : `${analytics.averageDaysOpen} avg days open`,
      },
    ];
  }, [analytics, rangeDays]);

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

      <div className="company-workspace-page-header">
        <div>
          <h1 className="company-workspace-page-title">Hiring overview</h1>
          <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Track what needs attention across roles, applicants, and hiring activity.</p>
        </div>

        <div className="company-workspace-header-actions">
          <CompanyPeriodControl value={rangeDays} options={RANGE_OPTIONS} onChange={setRangeDays} />
          <button type="button" onClick={handleStartFreshPostJob} className="company-workspace-primary-button inline-flex items-center gap-2 px-4">
            <PlusCircle className="h-4 w-4" />
            <span>Post a job</span>
          </button>
          <button type="button" onClick={() => navigate(COMPANY_PATHS.search)} className="company-workspace-secondary-button inline-flex items-center gap-2 px-4">
            <Search className="h-4 w-4" />
            <span>Search developers</span>
          </button>
        </div>
      </div>

      {jobsError ? <p className="text-sm text-red-600 dark:text-red-400">{jobsError}</p> : null}
      {analyticsError ? <p className="text-sm text-red-600 dark:text-red-400">{analyticsError}</p> : null}

      {showEmptyState ? (
        <section className="company-workspace-empty-quiet p-10">
          <div className="mx-auto max-w-xl text-center">
            <BriefcaseBusiness className="mx-auto h-10 w-10 text-[var(--workspace-text-muted)]" />
            <h2 className="mt-4 text-xl font-semibold text-[var(--workspace-text-strong)]">No hiring activity yet</h2>
            <p className="mt-2 text-sm text-[var(--workspace-text-muted)]">
              Start with your first role, then this overview will show applicant flow, role status, and hiring progress.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={handleStartFreshPostJob} className="company-workspace-primary-button px-4">
                Post a job
              </button>
              <button type="button" onClick={() => navigate(COMPANY_PATHS.search)} className="company-workspace-secondary-button px-4">
                Search developers
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <CompanyStatStrip metrics={metrics} loading={analyticsLoading} />

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.95fr)]">
            <article className="company-workspace-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="company-workspace-section-title">Applications over time</h2>
                  <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">New applicant volume in the selected range.</p>
                </div>
                <span className="rounded-full bg-[var(--workspace-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--workspace-primary)]">
                  {rangeDays} day view
                </span>
              </div>

              <div className="mt-5 grid h-[220px] grid-cols-[repeat(auto-fit,minmax(28px,1fr))] items-end gap-2">
                {(analytics?.applicationsOverTime || []).map((entry) => {
                  const count = Number(entry?.count || 0);
                  const height = Math.max(count > 0 ? Math.round((count / chartMax) * 180) : 6, count > 0 ? 18 : 6);
                  return (
                    <div key={entry.day} className="flex min-w-0 flex-col items-center gap-2">
                      <span className="text-[11px] font-semibold tabular-nums text-[var(--workspace-text-strong)]">{count}</span>
                      <div className="flex h-[180px] w-full items-end">
                        <div
                          className="w-full rounded-t-md bg-[var(--workspace-primary)]"
                          style={{ height: `${height}px`, opacity: count === 0 ? 0.28 : 1 }}
                          title={`${entry.day}: ${count} applications`}
                        />
                      </div>
                      <span className="text-[11px] text-[var(--workspace-text-muted)]">{formatCompactDate(entry.day)}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="company-workspace-panel p-5">
              <h2 className="company-workspace-section-title">Hiring pipeline</h2>
              <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Role and applicant status at a glance.</p>

              <div className="mt-5 space-y-5">
                <StatusList title="Jobs" rows={jobStatusRows} accentClass="bg-[var(--workspace-primary)]" />
                <StatusList title="Applicants" rows={applicantStatusRows} accentClass="bg-[#4f7d60]" />
              </div>
            </article>
          </section>

          <section className="company-workspace-panel p-5">
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

            <div className="mt-3 space-y-3">
              {activeJobs.map((job) => (
                <div key={job.id} className="company-workspace-panel-subtle grid grid-cols-1 gap-3 p-4 xl:grid-cols-[minmax(0,2fr)_0.8fr_0.8fr_0.7fr_0.8fr] xl:items-center xl:gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[var(--workspace-text-strong)]">{job?.title || 'Untitled job'}</p>
                    <p className="mt-1 truncate text-sm text-[var(--workspace-text-muted)]">{job?.location || 'No location added'}</p>
                  </div>
                  <div className="text-sm font-medium text-[var(--workspace-text)]">{formatJobStatus(job?.status || 'open')}</div>
                  <div className="text-sm font-semibold tabular-nums text-[var(--workspace-text-strong)]">
                    {Number(job?.applicant_count || job?.applicantCount || 0)}
                  </div>
                  <div className="text-sm text-[var(--workspace-text-muted)]">{formatCompactDate(job?.created_at || job?.createdAt)}</div>
                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(COMPANY_PATHS.jobs)}
                      className="company-workspace-secondary-button px-3"
                    >
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
          </section>
        </>
      )}
    </div>
  );
}

function StatusList({ title, rows, accentClass }) {
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
              <div className="mt-2 h-2 rounded-full bg-[var(--workspace-surface-subtle)]">
                <div
                  className={`h-2 rounded-full ${accentClass}`}
                  style={{ width: `${Math.max(10, Math.round((Number(row.value || 0) / maxValue) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
