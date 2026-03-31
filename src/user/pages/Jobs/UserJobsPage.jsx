import React, { useEffect, useMemo, useState } from 'react';
import { Filter, MapPin, Building, Bookmark } from 'lucide-react';
import { applyToJob, getJobsFeed } from '@sharedServices/authService';
import { formatJobStatus, statusBadgeClass } from '@companyFeatures/companyUtils';
import { isJobSavedForUser, saveApplicationForUser, syncApplicationsForUser, toggleSavedJobForUser } from '@userFeatures/activity/userActivityStorage';

export default function JobsPage({ userType, user }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    let canceled = false;

    const safeLoadJobs = async ({ silent = false } = {}) => {
      if (!silent && !canceled) {
        setLoading(true);
      }
      if (!canceled) {
        setError('');
        if (!silent) {
          setFeedback('');
        }
      }
      try {
        const result = await getJobsFeed();
        if (!canceled) {
          const nextJobs = Array.isArray(result) ? result : [];
          syncApplicationsForUser(user, nextJobs);
          setJobs(nextJobs);
        }
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

    const handleWindowFocus = () => {
      safeLoadJobs({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        safeLoadJobs({ silent: true });
      }
    };

    safeLoadJobs();
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const intervalId = window.setInterval(() => {
      safeLoadJobs({ silent: true });
    }, 30000);

    return () => {
      canceled = true;
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [user]);

  const handleApply = async (job) => {
    if (!job?.id || job?.hasApplied) {
      return;
    }

    setApplyingJobId(job.id);
    setError('');
    setFeedback('');

    try {
      await applyToJob(job.id);
      saveApplicationForUser(user, {
        jobId: job.id,
        title: job?.title || 'Untitled job',
        location: job?.location || '',
        type: job?.type || '',
        salary: job?.salary || '',
        status: 'pending',
        company: job?.company || {},
        appliedAt: new Date().toISOString(),
      });
      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id
            ? { ...currentJob, hasApplied: true }
            : currentJob
        )
      );
      setFeedback(`Your application for "${job.title}" was sent to ${job?.company?.name || 'the company'}.`);
    } catch (err) {
      setError(err?.message || 'Failed to apply to job.');
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleToggleSave = (job) => {
    const nextSavedJobs = toggleSavedJobForUser(user, job);
    const saved = nextSavedJobs.some((entry) => Number(entry?.id) === Number(job?.id));
    setFeedback(saved ? `"${job.title}" was saved to your Saved Jobs.` : `"${job.title}" was removed from Saved Jobs.`);
  };

  const summaryText = useMemo(() => {
    if (userType === 'employee') {
      const closedCount = jobs.filter((job) => String(job?.status || '').toLowerCase() === 'closed').length;
      return closedCount > 0
        ? 'Browse live company postings. Closed jobs are marked clearly so you know they are no longer accepting applicants.'
        : 'Find your next opportunity in tech';
    }
    return 'Manage your job postings';
  }, [jobs, userType]);

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">
          {userType === 'employee' ? 'Browse Jobs' : 'Posted Jobs'}
        </h1>
        <p className="text-[#344e41] dark:text-[#b8d4e8]">{summaryText}</p>
      </div>

      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#588157] dark:text-[#3ba9d6] rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f]">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>
          <div className="px-4 py-2 bg-white dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg text-sm text-[#344e41] dark:text-white">
            All Locations
          </div>
          <div className="px-4 py-2 bg-white dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg text-sm text-[#344e41] dark:text-white">
            All Statuses
          </div>
        </div>
      </div>

      {feedback && <p className="mb-4 text-sm text-[#3a5a40] dark:text-[#7fd0ee]">{feedback}</p>}
      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading jobs...</p>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-6">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">No jobs available right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              user={user}
              onApply={handleApply}
              onToggleSave={handleToggleSave}
              applying={applyingJobId === job.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, user, onApply, onToggleSave, applying }) {
  const status = String(job?.status || 'open').toLowerCase();
  const isClosed = status === 'closed';
  const isFilled = status === 'filled';
  const hasApplied = Boolean(job?.hasApplied);
  const companyName = job?.company?.name || 'Company';
  const skills = Array.isArray(job?.skills) ? job.skills : [];
  const isSaved = isJobSavedForUser(user, job?.id);

  return (
    <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4 sm:p-6 hover:border-[#588157] dark:hover:border-[#3ba9d6] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6] rounded-lg flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold text-[#3a5a40] dark:text-white">{job?.title || 'Untitled job'}</h3>
              <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass(status)}`}>
                {formatJobStatus(status)}
              </span>
            </div>
            <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mb-2">{companyName}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#344e41] dark:text-[#b8d4e8]">
              {job?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
              )}
              {job?.type && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 rounded">
                  {job.type}
                </span>
              )}
              {job?.salary && <span className="font-semibold text-[#588157] dark:text-[#3ba9d6]">{job.salary}</span>}
            </div>
          </div>
        </div>
        <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">{job?.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}</span>
      </div>

      {job?.description && (
        <p className="mb-4 text-sm text-[#344e41] dark:text-[#b8d4e8] line-clamp-3">{job.description}</p>
      )}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill) => (
            <span key={skill} className="px-3 py-1 bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#344e41] dark:text-white text-xs font-medium rounded-full">
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onApply?.(job)}
          disabled={isClosed || isFilled || hasApplied || applying}
          className="flex-1 bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClosed ? 'Closed' : isFilled ? 'Filled' : hasApplied ? 'Applied' : applying ? 'Applying...' : 'Apply Now'}
        </button>
        <button
          type="button"
          onClick={() => onToggleSave?.(job)}
          className={`px-4 py-2 border rounded-lg transition-colors ${
            isSaved
              ? 'border-[#588157] bg-[#eef6ee] text-[#3a5a40] dark:border-[#3ba9d6] dark:bg-[#14304d] dark:text-[#dcecff]'
              : 'border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f]'
          }`}
          aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}



