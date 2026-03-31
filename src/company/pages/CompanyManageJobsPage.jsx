import React, { useEffect, useMemo, useState } from 'react';
import JobCard from '@companyComponents/CompanyJobCard';
import { companyAPI } from '@companyFeatures/companyAPI';
import { useCompanyJobs } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, formatSkills, navigate } from '@companyFeatures/companyUtils';
import { PAYMENT_CANCEL_MESSAGE_TYPE, PAYMENT_MESSAGE_TYPE, STORAGE_KEY } from '@companyPages/CompanyPostJobPaymentPage';
import ConfirmModal from '@sharedComponents/ui/ConfirmModal';

export default function ManageJobs() {
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
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
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

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch]);

  const summary = useMemo(() => ({
    open: displayJobs.filter((job) => job?.status === 'open').length,
    draft: displayJobs.filter((job) => job?.status === 'draft' || String(job?.posting_payment_status || '').toLowerCase() !== 'paid').length,
    filled: displayJobs.filter((job) => job?.status === 'filled').length,
    closed: displayJobs.filter((job) => job?.status === 'closed').length,
  }), [displayJobs]);

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
      const paymentWindow = window.open(COMPANY_PATHS.postJobPayment, 'company-post-job-payment', 'width=760,height=860,resizable=yes,scrollbars=yes');
      if (!paymentWindow) {
        window.localStorage.removeItem(STORAGE_KEY);
        throw new Error('The payment window was blocked. Please allow pop-ups and try again.');
      }

      paymentWindow.focus();
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
      const paymentWindow = window.open(COMPANY_PATHS.postJobPayment, 'company-post-job-payment', 'width=760,height=860,resizable=yes,scrollbars=yes');
      if (!paymentWindow) {
        throw new Error('The payment window was blocked. Please allow pop-ups and try again.');
      }

      paymentWindow.focus();
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
          <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">All posted jobs here are loaded from your database records, and deleting one removes it there too.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.postJob)}
            className="px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold transition-colors"
          >
            Post job
          </button>
          <button
            type="button"
            onClick={refetch}
            className="px-4 py-2.5 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Open" value={summary.open} />
        <SummaryCard label="Draft" value={summary.draft} />
        <SummaryCard label="Filled" value={summary.filled} />
        <SummaryCard label="Closed" value={summary.closed} />
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[linear-gradient(135deg,#f6fbf5,#edf5ea)] dark:bg-[linear-gradient(135deg,#16304a,#102235)] p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Manage persisted postings</h3>
        <p className="mt-2 text-sm text-[#344e41] dark:text-[#dcecff]">Every job listed here comes from the database. Unpaid jobs stay in draft until you use Pay now, while only paid jobs are published to developers.</p>
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

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-4 transition-colors duration-300">
      <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[#3a5a40] dark:text-white">{value}</p>
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
            className="px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            Close
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



