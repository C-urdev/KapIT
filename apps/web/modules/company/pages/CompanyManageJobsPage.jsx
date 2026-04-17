import React, { useEffect, useMemo, useState } from 'react';
import JobCard from '@companyComponents/CompanyJobCard';
import { companyAPI } from '@companyFeatures/companyAPI';
import { useCompanyJobs } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, formatSkills, navigate } from '@companyFeatures/companyUtils';
import { PAYMENT_CANCEL_MESSAGE_TYPE, PAYMENT_MESSAGE_TYPE, STORAGE_KEY } from '@companyPages/CompanyPostJobPaymentPage';
import ConfirmModal from '@sharedComponents/ui/ConfirmModal';
import { X } from 'lucide-react';

export default function CompanyManageJobsPage() {
  const { jobs, loading, error, refetch } = useCompanyJobs();
  const [actionJobId, setActionJobId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [displayJobs, setDisplayJobs] = useState([]);
  const [detailsJob, setDetailsJob] = useState(null);
  const [deleteJob, setDeleteJob] = useState(null);

  useEffect(() => {
    setDisplayJobs(Array.isArray(jobs) ? jobs : []);
  }, [jobs]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      const syncPaymentState = async () => {
        if (event.data?.type === PAYMENT_MESSAGE_TYPE) {
          window.localStorage.removeItem(STORAGE_KEY);
          setFeedback('Payment confirmed and the job was published successfully.');
          await refetch();
          return;
        }
        if (event.data?.type === PAYMENT_CANCEL_MESSAGE_TYPE) {
          setFeedback('Payment was canceled or closed. The saved draft is still unpublished so you can retry anytime.');
        }
      };

      Promise.resolve(syncPaymentState()).catch((error) => {
        console.error('Company payment message handling failed:', error);
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch]);

  const summary = useMemo(() => ({
    open: displayJobs.filter((job) => job?.status === 'open').length,
    draft: displayJobs.filter((job) => job?.status === 'draft' || String(job?.posting_payment_status || '').toLowerCase() !== 'paid').length,
    filled: displayJobs.filter((job) => job?.status === 'filled').length,
    closed: displayJobs.filter((job) => job?.status === 'closed').length,
  }), [displayJobs]);
  const graphData = useMemo(
    () => [
      { label: 'Open', value: Number(summary.open), color: '#3a5a40' },
      { label: 'Draft', value: Number(summary.draft), color: '#588157' },
      { label: 'Filled', value: Number(summary.filled), color: '#7aa17b' },
      { label: 'Closed', value: Number(summary.closed), color: '#93b18e' },
    ],
    [summary.closed, summary.draft, summary.filled, summary.open],
  );

  const handleClose = async (job) => {
    if (!job?.id) return;
    setActionJobId(job.id);
    setFeedback('');
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
      setFeedback(`Closed "${job.title}".`);
      await refetch();
    } catch (err) {
      setFeedback(err?.message || 'Failed to close job.');
    } finally {
      setActionJobId(null);
    }
  };

  const handleReopen = async (job) => {
    if (!job?.id) return;
    setActionJobId(job.id);
    setFeedback('');
    try {
      const repostDraft = {
        title: String(job?.title || '').trim(),
        description: String(job?.description || '').trim(),
        salary: String(job?.salary || '').trim(),
        location: String(job?.location || '').trim(),
        type: String(job?.type || '').trim(),
        skills: formatSkills(job?.skills),
      };

      if (!repostDraft.title || !repostDraft.description) {
        throw new Error('This job is missing required details for reposting.');
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(repostDraft));
      const openInCurrentTab = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
      if (openInCurrentTab) {
        navigate(COMPANY_PATHS.postJobPayment);
      } else {
        const paymentWindow = window.open(COMPANY_PATHS.postJobPayment, 'company-post-job-payment', 'width=760,height=860,resizable=yes,scrollbars=yes');
        if (!paymentWindow) {
          navigate(COMPANY_PATHS.postJobPayment);
        } else {
          paymentWindow.focus();
        }
      }
      setFeedback(`Reposting "${job.title}" requires payment again. Complete the merchant payment to publish it.`);
    } catch (err) {
      setFeedback(err?.message || 'Failed to start reposting job.');
    } finally {
      setActionJobId(null);
    }
  };

  const handlePayNow = async (job) => {
    if (!job?.id) return;
    setActionJobId(job.id);
    setFeedback('');
    try {
      const draftPayload = {
        jobId: job.id,
        title: String(job?.title || '').trim(),
        description: String(job?.description || '').trim(),
        salary: String(job?.salary || '').trim(),
        location: String(job?.location || '').trim(),
        type: String(job?.type || '').trim(),
        skills: formatSkills(job?.skills),
      };

      if (!draftPayload.title || !draftPayload.description) {
        throw new Error('This draft job is missing required details for payment.');
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPayload));
      const openInCurrentTab = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
      if (openInCurrentTab) {
        navigate(COMPANY_PATHS.postJobPayment);
      } else {
        const paymentWindow = window.open(COMPANY_PATHS.postJobPayment, 'company-post-job-payment', 'width=760,height=860,resizable=yes,scrollbars=yes');
        if (!paymentWindow) {
          navigate(COMPANY_PATHS.postJobPayment);
        } else {
          paymentWindow.focus();
        }
      }
      setFeedback(`Draft saved for "${job.title}". Complete payment in the merchant window to publish it.`);
    } catch (err) {
      setFeedback(err?.message || 'Failed to open payment for this draft job.');
    } finally {
      setActionJobId(null);
    }
  };

  const handleDelete = async (job) => {
    if (!job?.id) return;
    setActionJobId(job.id);
    setFeedback('');
    try {
      await companyAPI.deleteJob(job.id);
      setFeedback(`Deleted "${job.title}" from your listings and database.`);
      await refetch();
    } catch (err) {
      setFeedback(err?.message || 'Failed to delete job.');
    } finally {
      setActionJobId(null);
      setDeleteJob(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Manage jobs</h2>
        </div>
        <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.postJob)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white text-sm font-semibold transition-colors"
          >
            Post job
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[linear-gradient(135deg,#f6fbf5,#edf5ea)] dark:bg-[linear-gradient(135deg,#16304a,#102235)] p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Manage persisted postings</h3>
        <p className="mt-2 text-sm text-[#344e41] dark:text-[#dcecff]">Every job listed here comes from the database. Unpaid jobs stay in draft until you use Pay now, while only paid jobs are published to developers.</p>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Jobs snapshot graph</h3>
        <SummaryGraph data={graphData} />
      </div>

      {feedback && <p className="text-sm text-[#3a5a40] dark:text-[#7fd0ee]">{feedback}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading jobs...</p>
      ) : displayJobs.length === 0 ? (
        <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-6 transition-colors duration-300">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">No job listings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayJobs.map((job) => (
            <JobCard
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
      )}

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

function SummaryGraph({ data }) {
  if (!data.length) {
    return <p className="mt-4 text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading graph data...</p>;
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
        <div className="h-28 w-28 sm:h-40 sm:w-40" role="img" aria-label="Manage jobs summary donut chart">
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

function JobDetailsModal({ job, onClose }) {
  const skills = Array.isArray(job?.skills) ? job.skills : [];

  return (
    <div className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close job details" />
      <div className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-6 shadow-2xl shadow-black/20 transition-colors duration-300">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">{job?.title || 'Untitled job'}</h3>
            <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">Full posting details saved for this listing.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Close job details"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailBlock label="Location" value={job?.location || 'Not specified'} />
          <DetailBlock label="Type" value={job?.type || 'Not specified'} />
          <DetailBlock label="Salary" value={job?.salary || 'Not specified'} />
          <DetailBlock
            label="Posting plan"
            value={
              job?.posting_plan_duration
                ? `${job.posting_plan_duration} | PHP ${Number(job?.posting_plan_price || 0).toLocaleString()}`
                : 'Selected during merchant payment'
            }
          />
          <DetailBlock label="Applicants" value={String(Number(job?.applicant_count || job?.applicantCount || 0))} />
          <DetailBlock label="Status" value={job?.status || 'open'} />
        </div>

        <div className="mt-6 rounded-2xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#102235] p-5">
          <div className="text-sm font-semibold text-[#3a5a40] dark:text-white">Description</div>
          <p className="mt-2 text-sm leading-7 text-[#344e41] dark:text-[#dcecff] whitespace-pre-wrap">{job?.description || 'No description saved.'}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#102235] p-5">
          <div className="text-sm font-semibold text-[#3a5a40] dark:text-white">Skills</div>
          {skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-full border border-[#a3b18a] dark:border-[#2a4a6f] bg-white dark:bg-[#0f2139] text-xs text-[#344e41] dark:text-white"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#344e41] dark:text-[#dcecff]">No skills saved.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#102235] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#588157] dark:text-[#7fd0ee]">{label}</div>
      <div className="mt-1 text-sm font-medium text-[#3a5a40] dark:text-white">{value}</div>
    </div>
  );
}
