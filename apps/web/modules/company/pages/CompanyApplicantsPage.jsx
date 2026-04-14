import React, { useMemo, useState } from 'react';
import ApplicantCard from '@companyComponents/CompanyApplicantCard';
import { companyAPI } from '@companyFeatures/companyAPI';
import { useCompanyAnalytics, useCompanyApplicants } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import { getPublicProfile, getStoredUser } from '@sharedServices/authService';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';

export default function CompanyApplicantsPage() {
  const viewer = getStoredUser();
  const { applicants, plan, loading, error, refetch } = useCompanyApplicants();
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useCompanyAnalytics();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionApplicantId, setActionApplicantId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [rankingJobId, setRankingJobId] = useState(null);
  const statuses = analytics?.applicantsByStatus || {};
  const statusEntries = Object.entries(statuses);
  const summaryValues = useMemo(
    () => [
      { label: 'Total jobs', value: Number(analytics?.totalJobs ?? 0), color: '#3a5a40' },
      { label: 'Total applicants', value: Number(analytics?.totalApplicants ?? applicants.length ?? 0), color: '#588157' },
      { label: 'Pipeline statuses', value: Number(statusEntries.length), color: '#7aa17b' },
    ],
    [analytics?.totalApplicants, analytics?.totalJobs, applicants.length, statusEntries.length],
  );

  const handleViewProfile = async (user) => {
    if (!user?.id) return;
    setProfileLoading(true);
    try {
      const data = await getPublicProfile(user.id);
      setProfile(data ? { ...user, ...data } : user);
    } catch {
      setProfile(user);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleMessage = (user) => {
    if (!user?.id) return;
    navigate(`${COMPANY_PATHS.messages}?contact=${encodeURIComponent(user.id)}`);
  };

  const handleStatusUpdate = async (applicant, status, successMessage) => {
    if (!applicant?.id) return;
    setActionApplicantId(applicant.id);
    setFeedback('');
    try {
      await companyAPI.updateApplicantStatus(applicant.id, status);
      setFeedback(successMessage);
      await Promise.all([refetch(), refetchAnalytics()]);
    } catch (err) {
      setFeedback(err?.message || 'Failed to update applicant.');
    } finally {
      setActionApplicantId(null);
    }
  };

  const handleRankApplicants = async (jobId) => {
    if (!jobId) return;
    setRankingJobId(jobId);
    setFeedback('');
    try {
      await companyAPI.rankApplicantsForJob(jobId);
      await refetch();
      setFeedback('Applicant ranking was refreshed for this job.');
    } catch (err) {
      setFeedback(err?.message || 'Failed to rank applicants.');
    } finally {
      setRankingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Applicants</h2>
        </div>
        <div className="flex w-full sm:w-auto flex-wrap items-stretch sm:items-center gap-2">
          {plan?.isPremium ? (
            <button
              type="button"
              onClick={() => {
                const firstJobId = applicants[0]?.job?.id;
                if (firstJobId) {
                  handleRankApplicants(firstJobId);
                }
              }}
              disabled={!applicants[0]?.job?.id || rankingJobId != null}
              className="px-4 py-2.5 rounded-xl bg-[#2f6b4f] text-white font-semibold hover:bg-[#285b44] disabled:opacity-60 w-full min-[420px]:w-auto"
            >
              {rankingJobId ? 'Ranking...' : 'Refresh AI ranking'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[linear-gradient(135deg,#f8fbf5,#edf5ea)] dark:bg-[linear-gradient(135deg,#16304a,#102235)] p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Hiring flow</h3>
        <p className="mt-2 text-sm text-[#344e41] dark:text-[#dcecff]">Use <span className="font-semibold text-[#3a5a40] dark:text-white">Hire candidate</span> when you make a selection. The job will be marked filled, and if you reopen the role later, it will go through the posting payment flow again before going live.</p>
        {plan?.isPremium ? <p className="mt-2 text-sm text-[#344e41] dark:text-[#dcecff]">Premium employer AI ranking is enabled. Match scores appear after refreshing the ranking for a job.</p> : null}
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Applicants snapshot graph</h3>
        <SummaryGraph data={analyticsLoading ? [] : summaryValues} />
        <div className="mt-5 border-t border-[#d6d3c9] dark:border-[#2a4a6f] pt-4">
          <h4 className="text-sm font-semibold text-[#3a5a40] dark:text-white">Pipeline overview</h4>
          {statusEntries.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {statusEntries.map(([status, count]) => (
                <div
                  key={status}
                  className="inline-flex items-center gap-2 rounded-full border border-[#cfdac1] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#0f2139] px-3 py-1.5 text-sm text-[#344e41] dark:text-[#dcecff]"
                >
                  <span className="font-semibold capitalize text-[#3a5a40] dark:text-white">{status}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#4b5563] dark:text-[#b8d4e8]">{analyticsLoading ? 'Loading status data...' : 'No applicant status data yet.'}</p>
          )}
        </div>
      </div>

      {feedback && <p className="text-sm text-[#3a5a40] dark:text-[#7fd0ee]">{feedback}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {analyticsError && <p className="text-sm text-red-600 dark:text-red-400">{analyticsError}</p>}
      {loading ? (
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading applicants...</p>
      ) : applicants.length === 0 ? (
        <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-6 transition-colors duration-300">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">No applicants yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden xl:grid xl:grid-cols-[minmax(0,1.7fr)_minmax(0,0.95fr)_0.9fr_0.95fr_minmax(17.5rem,1.35fr)] gap-6 rounded-2xl bg-[#f5f5f2] dark:bg-[#102235] px-6 py-4 text-sm font-semibold text-[#344e41] dark:text-[#dcecff]">
            <div>Candidate</div>
            <div>Applied To</div>
            <div>Job Status</div>
            <div>Applicant Status</div>
            <div className="text-center">Action</div>
          </div>
          {applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              actionLoading={actionApplicantId === applicant.id}
              onViewProfile={handleViewProfile}
              onMessage={handleMessage}
              onReview={(current) => handleStatusUpdate(current, 'reviewed', `Marked ${current?.user?.username || 'applicant'} as reviewed.`)}
              onReject={(current) => handleStatusUpdate(current, 'rejected', `Rejected ${current?.user?.username || 'applicant'}.`)}
              onHire={(current) => handleStatusUpdate(current, 'accepted', `Hired ${current?.user?.username || 'applicant'} and marked the job as filled.`)}
            />
          ))}
        </div>
      )}

      {profile && (
        <Modal onClose={() => setProfile(null)}>
          {profileLoading ? (
            <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading profile...</p>
          ) : (
            <div className="bg-white dark:bg-[#0f2139] rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] p-4 transition-colors duration-300">
              <PublicProfilePage
                profile={profile}
                onBack={() => setProfile(null)}
                onMessage={handleMessage}
                viewer={viewer}
                onMore={(currentProfile) => {
                  if (!currentProfile?.id) return;
                  setProfile(null);
                  navigate(`${COMPANY_PATHS.publicProfile}?id=${encodeURIComponent(currentProfile.id)}&from=${encodeURIComponent(COMPANY_PATHS.applicants)}`);
                }}
              />
            </div>
          )}
        </Modal>
      )}
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
  const donutStyle = {
    background: `conic-gradient(${gradientStops || '#d1d5db 0deg 360deg'})`,
  };

  return (
    <div className="mt-5 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
      <div className="flex justify-center md:justify-start">
        <div className="relative h-44 w-44" role="img" aria-label="Applicants summary donut chart">
          <div className="h-full w-full rounded-full" style={donutStyle} />
          <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-white text-center dark:bg-[#162842]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6b7280] dark:text-[#9fb4ca]">Total</p>
              <p className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">{total}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item) => {
          const percent = Math.round((item.value / safeTotal) * 100);
          return (
            <div key={item.label} className="flex items-center justify-between rounded-xl border border-[#d6d3c9] px-3 py-2 dark:border-[#2a4a6f]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium text-[#344e41] dark:text-[#dcecff]">{item.label}</span>
              </div>
              <div className="text-sm font-semibold text-[#3a5a40] dark:text-white">
                {item.value} <span className="text-xs font-medium text-[#6b7280] dark:text-[#9fb4ca]">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-2xl shadow-black/20 dark:shadow-black/50 transition-colors duration-300">
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}




