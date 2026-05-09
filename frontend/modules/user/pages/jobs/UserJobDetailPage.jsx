import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bookmark, Building2, MapPin } from 'lucide-react';
import { useToast } from '@sharedComponents/ui/ToastProvider';
import { applyToJob, removeSavedJob, saveJob } from '@sharedServices/authService';
import { formatJobStatus, statusBadgeClass } from '@companyFeatures/companyUtils';
import { saveApplicationForUser } from '@userFeatures/activity/userActivityStorage';

export default function UserJobDetailPage({
  user,
  job,
  onBack,
  onOpenCompanyProfile,
  onJobMutation,
  onOpenPreAssessment,
}) {
  const [currentJob, setCurrentJob] = useState(job || null);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    setCurrentJob(job || null);
    setApplying(false);
    setSaving(false);
    setError('');
  }, [job]);

  const status = String(currentJob?.status || 'open').toLowerCase();
  const isClosed = status === 'closed';
  const isFilled = status === 'filled';
  const hasApplied = Boolean(currentJob?.hasApplied);
  const isSaved = Boolean(currentJob?.isSaved);
  const acceptsApplications = currentJob?.acceptsApplications !== false;
  const applyDisabled = applying || hasApplied || isClosed || isFilled || !acceptsApplications;
  const skillList = useMemo(
    () => (Array.isArray(currentJob?.skills) ? currentJob.skills : []),
    [currentJob]
  );
  const isPremiumUser = Boolean(user?.isPremium);
  const canTakePreAssessment = isPremiumUser && hasApplied;

  const handleApply = async () => {
    if (!currentJob?.id || applyDisabled) {
      return;
    }

    setApplying(true);
    setError('');

    try {
      await applyToJob(currentJob.id);
      saveApplicationForUser(user, {
        jobId: currentJob.id,
        title: currentJob?.title || 'Untitled job',
        location: currentJob?.location || '',
        type: currentJob?.type || '',
        salary: currentJob?.salary || '',
        status: 'pending',
        company: currentJob?.company || {},
        appliedAt: new Date().toISOString(),
      });
      setCurrentJob((prev) => ({ ...(prev || {}), hasApplied: true }));
      onJobMutation?.(currentJob.id, { hasApplied: true });
      toast.success('Application sent successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to apply to job.');
    } finally {
      setApplying(false);
    }
  };

  const handleToggleSave = async () => {
    const jobId = Number(currentJob?.id);
    if (!Number.isInteger(jobId) || jobId <= 0 || saving) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isSaved) {
        await removeSavedJob(jobId);
        setCurrentJob((prev) => ({ ...(prev || {}), isSaved: false }));
        onJobMutation?.(jobId, { isSaved: false });
        toast.info('Removed from Saved Jobs.');
      } else {
        await saveJob(jobId);
        setCurrentJob((prev) => ({ ...(prev || {}), isSaved: true }));
        onJobMutation?.(jobId, { isSaved: true });
        toast.success('Saved to Saved Jobs.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to update saved jobs.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentJob?.id) {
    return (
      <div className="mx-auto w-full max-w-[min(100%,1040px)] rounded-xl border border-[#a3b18a] bg-[#f8fbf6] p-6 dark:border-[#353c44] dark:bg-[#22272b]">
        <p className="text-sm text-[#344e41] dark:text-[#d0d7dd]">Job details are not available.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-lg bg-[#3a5a40] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[min(100%,1240px)] space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#a3b18a] text-[#344e41] transition-colors hover:bg-[#f1f5eb] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
          aria-label="Back to jobs"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <article className="flex min-h-[640px] flex-col rounded-lg border border-[#a3b18a] bg-[#f8fbf6] p-5 shadow-sm dark:border-[#353c44] dark:bg-[#22272b] sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-3">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#588157] to-[#3a5a40] text-white dark:from-[#82ad86] dark:to-[#6f9b74]">
              {currentJob?.company?.logo ? (
                <img
                  src={currentJob.company.logo}
                  alt={`${currentJob?.company?.name || 'Company'} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[#3a5a40] dark:text-white">{currentJob?.title || 'Untitled job'}</h1>
                <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass(status)}`}>
                  {formatJobStatus(status)}
                </span>
                {currentJob?.createdAt ? (
                  <span className="rounded-full bg-[#eef6ee] px-3 py-1 text-xs text-[#5f6f52] dark:bg-[#2a2f35] dark:text-[#a8b1ba]">
                    Posted {new Date(currentJob.createdAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-[#344e41] dark:text-[#d0d7dd]">{currentJob?.company?.name || 'Company'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#344e41] dark:text-[#d0d7dd]">
                {currentJob?.location ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef6ee] px-3 py-1 dark:bg-[#2a2f35]">
                    <MapPin className="h-4 w-4" />
                    {currentJob.location}
                  </span>
                ) : null}
                {currentJob?.type ? (
                  <span className="rounded-full bg-[#eef6ee] px-3 py-1 dark:bg-[#2a2f35]">{currentJob.type}</span>
                ) : null}
                {currentJob?.salary ? (
                  <span className="rounded-full bg-[#eef6ee] px-3 py-1 font-semibold dark:bg-[#2a2f35]">{currentJob.salary}</span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saving}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${
                isSaved
                  ? 'border-[#588157] bg-[#eef6ee] text-[#3a5a40] dark:border-[#6f9b74] dark:bg-[#2a2f35] dark:text-[#eceff2]'
                  : 'border-[#a3b18a] text-[#344e41] hover:bg-[#f1f5eb] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]'
              }`}
              aria-label={isSaved ? 'Remove saved job' : 'Save job'}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <section className="mb-5">
          <h2 className="text-base font-semibold text-[#3a5a40] dark:text-white">Job Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#344e41] dark:text-[#d0d7dd]">
            {currentJob?.description || 'No description provided yet.'}
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#3a5a40] dark:text-white">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {skillList.length > 0 ? skillList.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-[#c8d5b9] bg-[#eef6ee] px-3 py-1 text-xs font-medium text-[#344e41] dark:border-[#444d57] dark:bg-[#2a2f35] dark:text-[#eceff2]"
              >
                {skill}
              </span>
            )) : <p className="text-sm text-[#344e41] dark:text-[#d0d7dd]">No specific skills listed.</p>}
          </div>
        </section>
        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="mt-auto flex w-full items-end gap-3 pt-8">
          <button
            type="button"
            onClick={handleApply}
            disabled={applyDisabled}
            className="flex-[1.7] rounded-md border border-transparent bg-[#3a5a40] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
          >
            {isClosed ? 'Closed' : isFilled ? 'Filled' : hasApplied ? 'Applied' : applying ? 'Applying...' : 'Apply'}
          </button>
          {currentJob?.company?.name ? (
            <button
              type="button"
              onClick={() => onOpenCompanyProfile?.(currentJob)}
              className="flex-[0.72] rounded-md border border-[#a3b18a] px-4 py-3.5 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#f1f5eb] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44]"
            >
              View Company
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onOpenPreAssessment?.(currentJob)}
          disabled={!canTakePreAssessment}
          title={
            !isPremiumUser
              ? 'Upgrade to Premium to unlock pre-assessment'
              : hasApplied
                ? 'Take Pre-Assessment'
                : 'Apply first to unlock pre-assessment'
          }
          className={`mt-3 w-full rounded-md px-6 py-3.5 text-sm font-semibold transition-colors ${
            canTakePreAssessment
              ? 'border border-[#3a5a40] text-[#3a5a40] hover:bg-[#eef6ee] dark:border-[#82ad86] dark:text-[#cfe7d2] dark:hover:bg-[#2a2f35]'
              : 'cursor-not-allowed border border-[#d4a373] bg-[#f5ebe0] text-[#7f5539] dark:border-[#8a6547] dark:bg-[#2c2520] dark:text-[#f0c766]'
          }`}
        >
          {!isPremiumUser
            ? 'Upgrade to Premium to unlock pre-assessment'
            : hasApplied
              ? 'Take Pre-Assessment'
              : 'Apply first to unlock pre-assessment'}
        </button>
      </article>
    </div>
  );
}
