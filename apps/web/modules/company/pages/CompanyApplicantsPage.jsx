import React, { useState } from 'react';
import ApplicantCard from '@companyComponents/CompanyApplicantCard';
import { companyAPI } from '@companyFeatures/companyAPI';
import { useCompanyAnalytics, useCompanyApplicants } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import { getPublicProfile, getStoredUser } from '@sharedServices/authService';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';

export default function CompanyApplicantsPage() {
  const viewer = getStoredUser();
  const { applicants, loading, error, refetch } = useCompanyApplicants();
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useCompanyAnalytics();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionApplicantId, setActionApplicantId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const statuses = analytics?.applicantsByStatus || {};
  const statusEntries = Object.entries(statuses);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Applicants</h2>
        </div>
        <button
          type="button"
          onClick={async () => {
            await Promise.all([refetch(), refetchAnalytics()]);
          }}
          className="px-4 py-2.5 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryStat
          label="Total jobs"
          value={analyticsLoading ? '...' : analytics?.totalJobs ?? 0}
        />
        <SummaryStat
          label="Total applicants"
          value={analyticsLoading ? '...' : analytics?.totalApplicants ?? applicants.length}
        />
        <SummaryStat
          label="Pipeline statuses"
          value={analyticsLoading ? '...' : statusEntries.length}
        />
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Pipeline overview</h3>
          </div>
          {statusEntries.length > 0 ? (
            <div className="flex flex-wrap gap-2">
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
            <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">{analyticsLoading ? 'Loading status data...' : 'No applicant status data yet.'}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[linear-gradient(135deg,#f8fbf5,#edf5ea)] dark:bg-[linear-gradient(135deg,#16304a,#102235)] p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Hiring flow</h3>
        <p className="mt-2 text-sm text-[#344e41] dark:text-[#dcecff]">Use <span className="font-semibold text-[#3a5a40] dark:text-white">Hire candidate</span> when you make a selection. The job will be marked filled, and if you reopen the role later, it will go through the posting payment flow again before going live.</p>
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
          <div className="hidden xl:grid xl:grid-cols-[minmax(0,1.7fr)_minmax(0,0.95fr)_0.9fr_0.95fr_minmax(19rem,1.8fr)] gap-6 rounded-2xl bg-[#f5f5f2] dark:bg-[#102235] px-6 py-4 text-sm font-semibold text-[#344e41] dark:text-[#dcecff]">
            <div>Candidate</div>
            <div>Applied To</div>
            <div>Job Status</div>
            <div>Applicant Status</div>
            <div>Action</div>
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

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] px-5 py-4 shadow-lg shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#588157] dark:text-[#7fd0ee]">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-[#3a5a40] dark:text-white">{value}</div>
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




