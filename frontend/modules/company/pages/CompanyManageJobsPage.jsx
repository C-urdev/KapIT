import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ChevronDown, MapPin, PlusCircle, Search, X } from 'lucide-react';
import { CompanyPeriodControl, CompanyStatStrip } from '@companyComponents/CompanyWorkspaceControls';
import { companyAPI } from '@companyFeatures/companyAPI';
import { useCompanyAnalytics, useCompanyJobs } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, formatJobStatus, formatSkills, navigate, openCompanyPaymentPopup } from '@companyFeatures/companyUtils';
import { PAYMENT_CANCEL_MESSAGE_TYPE, PAYMENT_FINISH_MESSAGE_TYPE, PAYMENT_MESSAGE_TYPE, STORAGE_KEY } from '@companyPages/CompanyPostJobPaymentPage';
import ConfirmModal from '@sharedComponents/ui/ConfirmModal';
import TimedInfoPopup from '@sharedComponents/ui/TimedInfoPopup';
import ManageJobsSkeleton from '../../../components/shared/skeletons/ManageJobsSkeleton';
import { useToast } from '@sharedComponents/ui/ToastProvider';

const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

const extractPreAssessment = (job) => {
  const payload = job?.draft_payload && typeof job.draft_payload === 'object' ? job.draft_payload : {};
  const fromPayload = payload?.preAssessment && typeof payload.preAssessment === 'object' ? payload.preAssessment : null;
  return fromPayload || {
    enabled: false,
    instructions: '',
    questions: [],
  };
};

const extractHiringWorkflow = (job) => {
  const payload = job?.draft_payload && typeof job.draft_payload === 'object' ? job.draft_payload : {};
  const workflow = payload?.hiringWorkflow && typeof payload.hiringWorkflow === 'object' ? payload.hiringWorkflow : {};
  return {
    ats: String(workflow.ats || '').trim(),
    hiringTimeline: String(workflow.hiringTimeline || '').trim(),
    mustHaves: String(workflow.mustHaves || '').trim(),
    dealbreakers: String(workflow.dealbreakers || '').trim(),
  };
};

const formatJobDate = (value) => {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const statusTabs = ['open', 'draft', 'filled', 'closed'];

export default function CompanyManageJobsPage() {
  const { jobs, loading, error, refetch } = useCompanyJobs();
  const [rangeDays, setRangeDays] = useState(30);
  const { analytics } = useCompanyAnalytics({ days: rangeDays });
  const [actionJobId, setActionJobId] = useState(null);
  const toast = useToast();
  const [displayJobs, setDisplayJobs] = useState([]);
  const [detailsJob, setDetailsJob] = useState(null);
  const [deleteJob, setDeleteJob] = useState(null);
  const [activeTab, setActiveTab] = useState('open');
  const [titleQuery, setTitleQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [sortBy, setSortBy] = useState('posting_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    setDisplayJobs(Array.isArray(jobs) ? jobs : []);
  }, [jobs]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      const syncPaymentState = async () => {
        if (event.data?.type === PAYMENT_MESSAGE_TYPE) {
          window.localStorage.removeItem(STORAGE_KEY);
          toast.success('Payment confirmed and the job was published successfully.');
          await refetch();
          return;
        }
        if (event.data?.type === PAYMENT_FINISH_MESSAGE_TYPE) {
          navigate(COMPANY_PATHS.jobs);
          window.focus();
          return;
        }
        if (event.data?.type === PAYMENT_CANCEL_MESSAGE_TYPE) {
          toast.info('Payment was canceled or closed. The saved draft is still unpublished so you can retry anytime.');
        }
      };

      Promise.resolve(syncPaymentState()).catch((paymentError) => {
        console.error('Company payment message handling failed:', paymentError);
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch, toast]);

  const summary = useMemo(() => ({
    open: Number(analytics?.openJobs || 0),
    draft: Number(analytics?.draftJobs || 0),
    filled: Number(analytics?.filledJobs || 0),
    closed: Number(analytics?.closedJobs || 0),
  }), [analytics]);

  const statusMetrics = useMemo(() => statusTabs.map((statusKey) => ({
    label: formatJobStatus(statusKey),
    value: Number(summary[statusKey] || 0),
    sublabel: statusKey === 'open'
      ? `${Number(analytics?.newApplicantsInRange || 0)} new applicants. Last ${rangeDays} days`
      : 'Live company data',
  })), [analytics?.newApplicantsInRange, rangeDays, summary]);

  const filteredJobs = useMemo(() => {
    const normalizedTitle = titleQuery.trim().toLowerCase();
    const normalizedLocation = locationQuery.trim().toLowerCase();

    const next = displayJobs.filter((job) => {
      const status = String(job?.status || '').toLowerCase();
      const isDraft = status === 'draft' || String(job?.posting_payment_status || '').toLowerCase() !== 'paid';
      const matchesTab = activeTab === 'draft'
        ? isDraft
        : status === activeTab;
      const matchesTitle = !normalizedTitle || String(job?.title || '').toLowerCase().includes(normalizedTitle);
      const matchesLocation = !normalizedLocation || String(job?.location || '').toLowerCase().includes(normalizedLocation);
      return matchesTab && matchesTitle && matchesLocation;
    });

    next.sort((left, right) => {
      if (sortBy === 'title') {
        const comparison = String(left?.title || '').localeCompare(String(right?.title || ''));
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      if (sortBy === 'applicants') {
        const leftApplicants = Number(left?.applicant_count || left?.applicantCount || 0);
        const rightApplicants = Number(right?.applicant_count || right?.applicantCount || 0);
        return sortOrder === 'asc' ? leftApplicants - rightApplicants : rightApplicants - leftApplicants;
      }

      const leftTime = new Date(left?.created_at || left?.createdAt || 0).getTime();
      const rightTime = new Date(right?.created_at || right?.createdAt || 0).getTime();
      return sortOrder === 'asc' ? leftTime - rightTime : rightTime - leftTime;
    });

    return next;
  }, [activeTab, displayJobs, locationQuery, sortBy, sortOrder, titleQuery]);

  const handleClose = async (job) => {
    if (!job?.id) return;
    setActionJobId(job.id);
    try {
      const data = await companyAPI.updateJobStatus(job.id, 'closed');
      setDisplayJobs((currentJobs) => currentJobs.map((currentJob) => (
        currentJob.id === job.id
          ? {
            ...currentJob,
            ...(data?.job || {}),
            status: 'closed',
          }
          : currentJob
      )));
      toast.info(`Closed "${job.title}".`);
      await refetch();
    } catch (err) {
      toast.error(err?.message || 'Failed to close job.');
    } finally {
      setActionJobId(null);
    }
  };

  const handleReopen = async (job) => {
    if (!job?.id) return;
    setActionJobId(job.id);
    try {
      const repostDraft = {
        title: String(job?.title || '').trim(),
        description: String(job?.description || '').trim(),
        salary: String(job?.salary || '').trim(),
        location: String(job?.location || '').trim(),
        type: String(job?.type || '').trim(),
        skills: formatSkills(job?.skills),
        ...extractHiringWorkflow(job),
        preAssessment: extractPreAssessment(job),
      };

      if (!repostDraft.title || !repostDraft.description) {
        throw new Error('This job is missing required details for reposting.');
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(repostDraft));
      const openInCurrentTab = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
      if (openInCurrentTab) {
        navigate(COMPANY_PATHS.postJobPayment);
      } else {
        const paymentWindow = openCompanyPaymentPopup();
        if (!paymentWindow) {
          navigate(COMPANY_PATHS.postJobPayment);
        }
      }
      toast.info(`Reposting "${job.title}" requires payment again. Complete the merchant payment to publish it.`);
    } catch (err) {
      toast.error(err?.message || 'Failed to start reposting job.');
    } finally {
      setActionJobId(null);
    }
  };

  const handlePayNow = async (job) => {
    if (!job?.id) return;
    setActionJobId(job.id);
    try {
      const draftPayload = {
        jobId: job.id,
        title: String(job?.title || '').trim(),
        description: String(job?.description || '').trim(),
        salary: String(job?.salary || '').trim(),
        location: String(job?.location || '').trim(),
        type: String(job?.type || '').trim(),
        skills: formatSkills(job?.skills),
        ...extractHiringWorkflow(job),
        preAssessment: extractPreAssessment(job),
      };

      if (!draftPayload.title || !draftPayload.description) {
        throw new Error('This draft job is missing required details for payment.');
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPayload));
      const openInCurrentTab = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
      if (openInCurrentTab) {
        navigate(COMPANY_PATHS.postJobPayment);
      } else {
        const paymentWindow = openCompanyPaymentPopup();
        if (!paymentWindow) {
          navigate(COMPANY_PATHS.postJobPayment);
        }
      }
      toast.info(`Draft saved for "${job.title}". Complete payment in the merchant window to publish it.`);
    } catch (err) {
      toast.error(err?.message || 'Failed to open payment for this draft job.');
    } finally {
      setActionJobId(null);
    }
  };

  const handleDelete = async (job) => {
    if (!job?.id) return;
    const previousJobs = displayJobs;
    setActionJobId(job.id);
    setDeleteJob(null);
    setDisplayJobs((currentJobs) => currentJobs.filter((currentJob) => currentJob.id !== job.id));
    try {
      await companyAPI.deleteJob(job.id);
      toast.success(`Deleted "${job.title}" from your listings and database.`);
      refetch({ force: true, silent: true }).catch(() => {});
    } catch (err) {
      setDisplayJobs(previousJobs);
      toast.error(err?.message || 'Failed to delete job.');
    } finally {
      setActionJobId(null);
    }
  };

  const emptyState = !loading && filteredJobs.length === 0;

  return (
    <div className="company-workspace-page space-y-6">
      <TimedInfoPopup
        title="Manage live and draft jobs"
        message="This page is for publishing operations. Drafts stay here until payment is completed, and closed or filled roles can still be reviewed or reposted from the same workspace."
        dismissKey="manage_jobs_workspace_direction"
      />

      <div className="company-workspace-page-header">
        <div>
          <h1 className="company-workspace-page-title">Jobs</h1>
          <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Review publishing status, applicants, and plan details across every role.</p>
        </div>
        <div className="company-workspace-header-actions">
          <CompanyPeriodControl value={rangeDays} options={RANGE_OPTIONS} onChange={setRangeDays} />
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.postJob)}
            className="company-workspace-primary-button inline-flex items-center gap-2 px-4"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Post a job</span>
          </button>
        </div>
      </div>

      <section className="company-analytics-board">
        <CompanyStatStrip metrics={statusMetrics} loading={loading} />

        <div className="company-analytics-board-section p-4">
          <div className="company-workspace-tab-row">
            {statusTabs.map((statusKey) => (
              <button
                key={statusKey}
                type="button"
                onClick={() => setActiveTab(statusKey)}
                data-active={activeTab === statusKey}
                className="company-workspace-tab-button"
              >
                {formatJobStatus(statusKey)} ({Number(summary[statusKey] || 0)})
              </button>
            ))}
          </div>
        </div>

        <div className="company-analytics-board-section p-4">
          <div className="company-workspace-toolbar company-workspace-filter-strip grid-cols-1 min-[520px]:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(160px,0.75fr)_minmax(160px,0.75fr)]">
            <label className="company-workspace-control flex min-w-0 items-center gap-2.5 px-3.5">
              <Search className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)]" />
              <input
                value={titleQuery}
                onChange={(event) => setTitleQuery(event.target.value)}
                placeholder="Search job titles"
                className="w-full bg-transparent text-sm text-[var(--workspace-text-strong)] outline-none placeholder:text-[var(--workspace-text-muted)]"
              />
            </label>

            <label className="company-workspace-control flex min-w-0 items-center gap-2.5 px-3.5">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)]" />
              <input
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder="Search locations"
                className="w-full bg-transparent text-sm text-[var(--workspace-text-strong)] outline-none placeholder:text-[var(--workspace-text-muted)]"
              />
            </label>

            <label className="company-workspace-control flex min-w-0 items-center gap-2.5 overflow-hidden px-3.5">
              <Search className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)]" />
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full appearance-none bg-transparent text-sm text-[var(--workspace-text-strong)] outline-none">
                <option value="posting_date">Posting date</option>
                <option value="title">Job title</option>
                <option value="applicants">Applicants</option>
              </select>
              <ChevronDown className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)]" />
            </label>

            <label className="company-workspace-control flex min-w-0 items-center gap-2.5 overflow-hidden px-3.5">
              <ArrowDownUp className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)]" />
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="w-full appearance-none bg-transparent text-sm text-[var(--workspace-text-strong)] outline-none">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
              <ChevronDown className="h-4 w-4 shrink-0 text-[var(--workspace-text-muted)]" />
            </label>
          </div>
        </div>

        {error ? <p className="company-analytics-board-section p-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="company-analytics-board-section p-4">
          {loading ? (
            <ManageJobsSkeleton />
          ) : emptyState ? (
            <div className="company-workspace-empty-quiet p-8 text-center">
              <p>{displayJobs.length === 0 ? 'No job listings yet. Use Post a job to create your first role.' : 'No jobs match the current filters.'}</p>
            </div>
          ) : (
            <>
              <div className="company-workspace-table-header hidden grid-cols-[minmax(0,1.85fr)_0.8fr_0.75fr_0.75fr_0.7fr_1.2fr] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-[0.05em] xl:grid">
                <div>Role</div>
                <div>Status</div>
                <div>Applicants</div>
                <div>Plan</div>
                <div>Posted</div>
                <div>Actions</div>
              </div>

              <div className="mt-3 overflow-hidden rounded-lg border border-[var(--workspace-border)]">
                {filteredJobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    actionLoading={actionJobId === job.id}
                    onViewDetails={setDetailsJob}
                    onClose={handleClose}
                    onReopen={handleReopen}
                    onPayNow={handlePayNow}
                    onDelete={setDeleteJob}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {detailsJob ? <JobDetailsModal job={detailsJob} onClose={() => setDetailsJob(null)} /> : null}

      <ConfirmModal
        open={Boolean(deleteJob)}
        title="Delete job posting?"
        message={deleteJob ? `Delete "${deleteJob.title}"? This will also remove it from the database.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setDeleteJob(null)}
        onConfirm={() => handleDelete(deleteJob)}
      />
    </div>
  );
}

function JobRow({ job, actionLoading, onViewDetails, onClose, onReopen, onDelete, onPayNow }) {
  const status = String(job?.status || 'open').toLowerCase();
  const isOpen = status === 'open';
  const isDraft = status === 'draft' || String(job?.posting_payment_status || '').toLowerCase() !== 'paid';
  const applicants = Number(job?.applicant_count || job?.applicantCount || 0);
  const planPrice = Number(job?.posting_plan_price || job?.pay_per_use_fee || 0);
  const planDuration = String(job?.posting_plan_duration || '').trim();

  return (
    <div className="company-analytics-row grid grid-cols-1 gap-3 p-4 xl:grid-cols-[minmax(0,1.85fr)_0.8fr_0.75fr_0.75fr_0.7fr_1.2fr] xl:items-center xl:gap-4">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-[var(--workspace-text-strong)]">{job?.title || 'Untitled job'}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--workspace-text-muted)]">
          {job?.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </span>
          ) : null}
          {job?.type ? <span>{job.type}</span> : null}
        </div>
      </div>

      <div className="text-sm font-medium text-[var(--workspace-text)]">{formatJobStatus(status)}</div>
      <div className="text-sm font-semibold tabular-nums text-[var(--workspace-text-strong)]">{applicants}</div>
      <div className="text-sm text-[var(--workspace-text)]">{planPrice > 0 ? `PHP ${planPrice.toLocaleString()}` : 'Plan saved'}{planDuration ? ` / ${planDuration}` : ''}</div>
      <div className="text-sm text-[var(--workspace-text-muted)]">{formatJobDate(job?.created_at || job?.createdAt)}</div>

      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
        <button type="button" onClick={() => onViewDetails?.(job)} className="company-workspace-secondary-button px-3">
          Details
        </button>
        {isOpen ? (
          <button type="button" onClick={() => onClose(job)} disabled={actionLoading} className="company-workspace-secondary-button px-3 disabled:opacity-60">
            {actionLoading ? 'Updating...' : 'Close'}
          </button>
        ) : null}
        {isDraft ? (
          <button type="button" onClick={() => onPayNow(job)} disabled={actionLoading} className="company-workspace-primary-button px-3 disabled:opacity-60">
            {actionLoading ? 'Opening...' : 'Pay now'}
          </button>
        ) : null}
        {!isOpen && !isDraft ? (
          <button type="button" onClick={() => onReopen(job)} disabled={actionLoading} className="company-workspace-primary-button px-3 disabled:opacity-60">
            {actionLoading ? 'Reopening...' : 'Repost'}
          </button>
        ) : null}
        <button type="button" onClick={() => onDelete(job)} disabled={actionLoading} className="company-workspace-secondary-button inline-flex items-center gap-1.5 px-3 text-[var(--workspace-danger)] disabled:opacity-60">
          <X className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

function JobDetailsModal({ job, onClose }) {
  const skills = Array.isArray(job?.skills) ? job.skills : [];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close job details" />
      <div className="company-workspace-panel relative max-h-[85vh] w-full max-w-4xl overflow-y-auto p-6 shadow-[var(--workspace-elevated-shadow)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-[var(--workspace-text-strong)]">{job?.title || 'Untitled job'}</h3>
            <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Full posting details saved for this listing.</p>
          </div>
          <button type="button" onClick={onClose} className="company-workspace-secondary-button inline-flex h-10 w-10 items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailBlock label="Location" value={job?.location || 'Not specified'} />
          <DetailBlock label="Type" value={job?.type || 'Not specified'} />
          <DetailBlock label="Salary" value={job?.salary || 'Not specified'} />
          <DetailBlock
            label="Posting plan"
            value={job?.posting_plan_duration ? `${job.posting_plan_duration} / PHP ${Number(job?.posting_plan_price || 0).toLocaleString()}` : 'Selected during merchant payment'}
          />
          <DetailBlock label="Applicants" value={String(Number(job?.applicant_count || job?.applicantCount || 0))} />
          <DetailBlock label="Status" value={formatJobStatus(job?.status || 'open')} />
        </div>

        <div className="company-workspace-panel-subtle mt-6 p-5">
          <div className="text-sm font-semibold text-[var(--workspace-text-strong)]">Description</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--workspace-text)]">{job?.description || 'No description saved.'}</p>
        </div>

        <div className="company-workspace-panel-subtle mt-6 p-5">
          <div className="text-sm font-semibold text-[var(--workspace-text-strong)]">Skills</div>
          {skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-surface)] px-2.5 py-1 text-xs text-[var(--workspace-text)]">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--workspace-text-muted)]">No skills saved.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="company-workspace-panel-subtle px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--workspace-text-muted)]">{label}</div>
      <div className="mt-1 text-sm font-medium text-[var(--workspace-text-strong)]">{value}</div>
    </div>
  );
}
