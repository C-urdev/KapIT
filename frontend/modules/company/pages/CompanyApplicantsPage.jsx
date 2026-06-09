import React, { useMemo, useState } from 'react';
import { useSearchParams } from '@shared/hooks/useAppRouter';
import ApplicantCard from '@companyComponents/CompanyApplicantCard';
import { companyAPI } from '@companyFeatures/companyAPI';
import { useCompanyAnalytics, useCompanyApplicants } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import { useToast } from '@sharedComponents/ui/ToastProvider';
import TimedInfoPopup from '@sharedComponents/ui/TimedInfoPopup';
import { getPublicProfile, getStoredUser } from '@sharedServices/authService';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';

export default function CompanyApplicantsPage() {
  const searchParams = useSearchParams();
  const viewer = getStoredUser();
  const { applicants, plan, loading, error, refetch } = useCompanyApplicants();
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useCompanyAnalytics();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionApplicantId, setActionApplicantId] = useState(null);
  const toast = useToast();
  const [rankingJobId, setRankingJobId] = useState(null);
  const selectedJobId = useMemo(
    () => String(searchParams?.get('job') || '').trim(),
    [searchParams],
  );
  const selectedJobTitleFromQuery = useMemo(
    () => String(searchParams?.get('title') || '').trim(),
    [searchParams],
  );
  const selectedJobTitle = useMemo(() => {
    if (!selectedJobId) {
      return '';
    }

    const fromList = applicants.find((item) => String(item?.job?.id || '') === selectedJobId)?.job?.title;
    if (fromList) {
      return String(fromList);
    }

    if (selectedJobTitleFromQuery) {
      return selectedJobTitleFromQuery;
    }

    return `Job #${selectedJobId}`;
  }, [applicants, selectedJobId, selectedJobTitleFromQuery]);
  const visibleApplicants = useMemo(() => {
    if (!selectedJobId) {
      return applicants;
    }
    return applicants.filter((item) => String(item?.job?.id || '') === selectedJobId);
  }, [applicants, selectedJobId]);
  const summaryValues = useMemo(
    () => [
      { label: 'Total jobs', value: selectedJobId ? 1 : Number(analytics?.totalJobs ?? 0), color: '#3a5a40' },
      { label: 'Total applicants', value: selectedJobId ? Number(visibleApplicants.length) : Number(analytics?.totalApplicants ?? applicants.length ?? 0), color: '#588157' },
    ],
    [analytics?.totalApplicants, analytics?.totalJobs, applicants.length, selectedJobId, visibleApplicants.length],
  );
  const pipelineData = useMemo(() => {
    const sourceApplicants = selectedJobId ? visibleApplicants : applicants;
    const grouped = sourceApplicants.reduce(
      (acc, item) => {
        const raw = String(item?.status || '').trim().toLowerCase();
        if (!raw || raw === 'pending' || raw === 'applied') {
          acc.applied += 1;
          return acc;
        }
        if (raw === 'reviewed' || raw === 'reviewing' || raw === 'on_hold' || raw === 'on hold') {
          acc.reviewing += 1;
          return acc;
        }
        if (raw === 'interviewed' || raw === 'interview' || raw === 'phone_screen' || raw === 'telephone' || raw === 'skill_check') {
          acc.interviewed += 1;
          return acc;
        }
        if (raw === 'accepted' || raw === 'hired' || raw === 'joined') {
          acc.hired += 1;
          return acc;
        }
        if (raw === 'rejected' || raw === 'declined') {
          acc.rejected += 1;
          return acc;
        }
        acc.other += 1;
        return acc;
      },
      { applied: 0, reviewing: 0, interviewed: 0, hired: 0, rejected: 0, other: 0 },
    );

    return [
      { label: 'Total', value: sourceApplicants.length, color: '#5f97bd' },
      { label: 'Applied', value: grouped.applied, color: '#7aa7c8' },
      { label: 'On hold / Reviewing', value: grouped.reviewing, color: '#6f9bb9' },
      { label: 'Interviewed', value: grouped.interviewed, color: '#8fb4d0' },
      { label: 'Hired', value: grouped.hired, color: '#6b9b68' },
      { label: 'Rejected / Declined', value: grouped.rejected, color: '#cf4a62' },
      { label: 'Other', value: grouped.other, color: '#9ca3af' },
    ];
  }, [selectedJobId, visibleApplicants, applicants]);

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
    try {
      await companyAPI.updateApplicantStatus(applicant.id, status);
      toast.success(successMessage);
      await Promise.all([refetch({ force: true }), refetchAnalytics({ force: true })]);
    } catch (err) {
      toast.error(err?.message || 'Failed to update applicant.');
    } finally {
      setActionApplicantId(null);
    }
  };

  const handleRankApplicants = async (jobId) => {
    if (!jobId) return;
    setRankingJobId(jobId);
    try {
      await companyAPI.rankApplicantsForJob(jobId);
      await refetch({ force: true });
      toast.info('Applicant ranking was refreshed for this job.');
    } catch (err) {
      toast.error(err?.message || 'Failed to rank applicants.');
    } finally {
      setRankingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      <TimedInfoPopup
        title="Hiring flow"
        message="Use Hire candidate when you make a selection. The job will be marked filled, and if you reopen the role later, it will go through the posting payment flow again before going live."
        dismissKey="applicants_hiring_flow"
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Applicants</h2>
          {selectedJobId ? (
            <p className="mt-1 text-sm text-[#4b5563] dark:text-[#d0d7dd]">
              Showing applicants for <span className="font-semibold text-[#3a5a40] dark:text-white">{selectedJobTitle}</span>
            </p>
          ) : null}
        </div>
        <div className="flex w-full sm:w-auto flex-wrap items-stretch sm:items-center gap-2">
          {plan?.isPremium ? (
            <button
              type="button"
              onClick={() => {
                const firstJobId = selectedJobId || visibleApplicants[0]?.job?.id;
                if (firstJobId) {
                  handleRankApplicants(firstJobId);
                }
              }}
              disabled={!(selectedJobId || visibleApplicants[0]?.job?.id) || rankingJobId != null}
              className="px-4 py-2.5 rounded-xl bg-[#2f6b4f] text-white font-semibold hover:bg-[#285b44] disabled:opacity-60 w-full min-[420px]:w-auto"
            >
              {rankingJobId ? 'Ranking...' : 'Refresh AI ranking'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#353c44] bg-[#f8fbf6] dark:bg-[#22272b] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Applicants snapshot graph</h3>
        <SummaryGraph data={analyticsLoading && !selectedJobId ? [] : summaryValues} />
      </div>
      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#353c44] bg-[#f8fbf6] dark:bg-[#22272b] p-5 shadow-lg shadow-black/5 dark:shadow-black/20 transition-colors duration-300">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">
          {selectedJobId ? 'Applicant pipeline' : 'Applicants pipeline'}
        </h3>
        <PipelineGraph data={pipelineData} />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {analyticsError && <p className="text-sm text-red-600 dark:text-red-400">{analyticsError}</p>}
      {loading ? (
        <p className="text-sm text-[#4b5563] dark:text-[#d0d7dd]">Loading applicants...</p>
      ) : visibleApplicants.length === 0 ? (
        <div className="rounded-xl border border-[#a3b18a] dark:border-[#353c44] bg-[#f8fbf6] dark:bg-[#22272b] p-6 transition-colors duration-300">
          <p className="text-[#344e41] dark:text-[#d0d7dd]">
            {selectedJobId ? `No applicants yet for ${selectedJobTitle}.` : 'No applicants yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden xl:grid xl:grid-cols-[minmax(0,1.7fr)_minmax(0,0.95fr)_0.9fr_0.95fr_minmax(17.5rem,1.35fr)] gap-6 rounded-2xl bg-[#f5f5f2] dark:bg-[#202428] px-6 py-4 text-sm font-semibold text-[#344e41] dark:text-[#eceff2]">
            <div>Candidate</div>
            <div>Applied To</div>
            <div>Job Status</div>
            <div>Applicant Status</div>
            <div className="text-center">Action</div>
          </div>
          {visibleApplicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              actionLoading={actionApplicantId === applicant.id}
              onViewProfile={handleViewProfile}
              onMessage={handleMessage}
              onReview={(current) => handleStatusUpdate(current, 'reviewed', `Marked ${current?.user?.username || 'applicant'} as reviewed.`)}
              onReject={(current) => handleStatusUpdate(current, 'rejected', `Rejected ${current?.user?.username || 'applicant'}.`)}
              onHire={(current) => handleStatusUpdate(current, 'accepted', `Hired ${current?.user?.username || 'applicant'}.`)}
            />
          ))}
        </div>
      )}

      {profile && (
        <Modal onClose={() => setProfile(null)}>
          {profileLoading ? (
            <p className="text-sm text-[#4b5563] dark:text-[#d0d7dd]">Loading profile...</p>
          ) : (
            <div className="bg-[#f8fbf6] dark:bg-[#1a1d20] rounded-xl border border-[#a3b18a] dark:border-[#444d57] p-4 transition-colors duration-300">
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
    return <p className="mt-4 text-sm text-[#4b5563] dark:text-[#d0d7dd]">Loading graph data...</p>;
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
    <div className="mt-5 grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-5">
      <div className="flex justify-center">
        <div className="h-28 w-28 sm:h-40 sm:w-40" role="img" aria-label="Applicants summary donut chart">
          <div className="h-full w-full rounded-full" style={donutStyle} />
        </div>
      </div>
      <div className="space-y-2.5">
        {data.map((item) => {
          const percent = Math.round((item.value / safeTotal) * 100);
          return (
            <div key={item.label} className="flex items-center justify-between rounded-xl border border-[#d6d3c9] px-3 py-2 dark:border-[#444d57]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs sm:text-sm font-medium text-[#344e41] dark:text-[#eceff2]">{item.label}</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#3a5a40] dark:text-white">
                {item.value} <span className="text-[11px] font-medium text-[#6b7280] dark:text-[#b3bcc5]">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineGraph({ data }) {
  const maxValue = Math.max(...data.map((item) => Number(item?.value || 0)), 1);

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-7 gap-3 rounded-2xl border border-[#d6d3c9] bg-[#f8fbf6] p-4 dark:border-[#444d57] dark:bg-[#202428]">
          {data.map((item) => {
            const value = Number(item?.value || 0);
            const barHeight = Math.max(value > 0 ? Math.round((value / maxValue) * 96) : 0, value > 0 ? 18 : 0);
            const isJoined = item.label.toLowerCase() === 'joined';
            const isDeclined = item.label.toLowerCase() === 'declined';
            return (
              <div key={item.label} className="flex flex-col items-center">
                <div className="h-6 text-xl leading-none font-semibold text-[#4b5563] dark:text-[#d0d7dd]">{value}</div>
                <div className="mt-1 flex h-24 w-full items-end justify-center">
                  {value > 0 ? (
                    <div
                      className="w-10 rounded-md shadow-sm"
                      style={{
                        height: `${barHeight}px`,
                        background: item.color,
                      }}
                    />
                  ) : (
                    <div className="h-1 w-10 rounded bg-[#d6d3c9] dark:bg-[#3b424b]" />
                  )}
                </div>
                <div
                  className={`mt-2 text-xs font-semibold leading-tight text-center ${
                    isDeclined ? 'text-[#cf4a62] dark:text-[#fda4af]' : isJoined ? 'text-[#6b9b68] dark:text-[#86efac]' : 'text-[#374151] dark:text-[#d0d7dd]'
                  }`}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#a3b18a] dark:border-[#353c44] bg-[#f8fbf6] dark:bg-[#22272b] shadow-2xl shadow-black/20 dark:shadow-black/50 transition-colors duration-300">
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
