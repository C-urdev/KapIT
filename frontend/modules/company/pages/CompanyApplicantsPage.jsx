import React, { useMemo, useState } from 'react';
import { LayoutList, Layers3 } from 'lucide-react';
import { useSearchParams } from '@shared/hooks/useAppRouter';
import ApplicantCard from '@companyComponents/CompanyApplicantCard';
import { CompanyStatStrip } from '@companyComponents/CompanyWorkspaceControls';
import { companyAPI } from '@companyFeatures/companyAPI';
import { useCompanyAnalytics, useCompanyApplicants } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import { useToast } from '@sharedComponents/ui/ToastProvider';
import TimedInfoPopup from '@sharedComponents/ui/TimedInfoPopup';
import { getPublicProfile, getStoredUser } from '@sharedServices/authService';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';

const VIEW_OPTIONS = [
  { value: 'list', label: 'List', icon: LayoutList },
  { value: 'grouped', label: 'Grouped', icon: Layers3 },
];

const STATUS_ORDER = ['pending', 'reviewed', 'accepted', 'rejected'];
const STATUS_LABELS = {
  pending: 'Awaiting review',
  reviewed: 'Reviewed',
  accepted: 'Hired',
  rejected: 'Rejected',
};

const normalizeApplicantStatus = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === 'applied') return 'pending';
  if (raw === 'reviewing' || raw === 'on_hold' || raw === 'on hold') return 'reviewed';
  if (raw === 'hired' || raw === 'joined') return 'accepted';
  if (raw === 'declined') return 'rejected';
  return raw;
};

const buildStatusSummary = (sourceApplicants) => {
  return sourceApplicants.reduce((acc, applicant) => {
    const key = normalizeApplicantStatus(applicant?.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
};

export default function CompanyApplicantsPage() {
  const searchParams = useSearchParams();
  const viewer = getStoredUser();
  const { applicants, plan, loading, error, refetch } = useCompanyApplicants();
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useCompanyAnalytics({ days: 30 });
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [actionApplicantId, setActionApplicantId] = useState(null);
  const [rankingJobId, setRankingJobId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const toast = useToast();

  const selectedJobId = useMemo(() => String(searchParams?.get('job') || '').trim(), [searchParams]);
  const selectedJobTitleFromQuery = useMemo(() => String(searchParams?.get('title') || '').trim(), [searchParams]);

  const visibleApplicants = useMemo(() => {
    if (!selectedJobId) {
      return applicants;
    }
    return applicants.filter((item) => String(item?.job?.id || '') === selectedJobId);
  }, [applicants, selectedJobId]);

  const selectedJobTitle = useMemo(() => {
    if (!selectedJobId) return '';

    const fromList = applicants.find((item) => String(item?.job?.id || '') === selectedJobId)?.job?.title;
    if (fromList) return String(fromList);
    if (selectedJobTitleFromQuery) return selectedJobTitleFromQuery;
    return `Job #${selectedJobId}`;
  }, [applicants, selectedJobId, selectedJobTitleFromQuery]);

  const localStatusSummary = useMemo(() => buildStatusSummary(visibleApplicants), [visibleApplicants]);
  const globalStatusSummary = analytics?.applicantsByStatus || {};
  const statusSummary = selectedJobId ? localStatusSummary : globalStatusSummary;

  const metrics = useMemo(() => {
    const totalApplicants = selectedJobId ? visibleApplicants.length : Number(analytics?.totalApplicants || applicants.length || 0);
    const awaitingReview = Number(statusSummary.pending || 0);
    const reviewed = Number(statusSummary.reviewed || 0);
    const hired = Number(statusSummary.accepted || 0);
    return [
      { label: 'Applicants', value: totalApplicants, sublabel: selectedJobId ? 'For selected role' : 'Across all roles' },
      { label: 'Awaiting review', value: awaitingReview, sublabel: `${Number(statusSummary.rejected || 0)} rejected` },
      { label: 'Reviewed', value: reviewed, sublabel: selectedJobId ? 'Within selected role' : 'Across all roles' },
      { label: 'Hired', value: hired, sublabel: `${Number(statusSummary.accepted || 0)} accepted in current scope` },
    ];
  }, [analytics?.totalApplicants, applicants.length, selectedJobId, statusSummary, visibleApplicants.length]);

  const groupedApplicants = useMemo(() => {
    return STATUS_ORDER.map((statusKey) => ({
      key: statusKey,
      label: STATUS_LABELS[statusKey] || statusKey,
      items: visibleApplicants.filter((applicant) => normalizeApplicantStatus(applicant?.status) === statusKey),
    })).filter((group) => group.items.length > 0 || group.key === 'pending');
  }, [visibleApplicants]);

  const pipelineRows = useMemo(() => {
    return STATUS_ORDER.map((statusKey) => ({
      key: statusKey,
      label: STATUS_LABELS[statusKey] || statusKey,
      value: Number(statusSummary[statusKey] || 0),
    }));
  }, [statusSummary]);

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
    <div className="company-workspace-page space-y-6">
      <TimedInfoPopup
        title="Applicant review"
        message="Use this page for fast candidate review. Keep Jobs for publishing operations and use Talent Search when you want to source outside the current applicant pool."
        dismissKey="applicants_workspace_direction"
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="company-workspace-page-title">Applicants</h1>
          <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">
            {selectedJobId ? `Review applicants for ${selectedJobTitle}.` : 'Review candidate progress across active roles.'}
          </p>
        </div>

        <div className="company-workspace-tab-row">
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setViewMode(option.value)}
                data-active={viewMode === option.value}
                className="company-workspace-tab-button inline-flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span>{option.label}</span>
              </button>
            );
          })}
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
              className="company-workspace-primary-button px-4 disabled:opacity-60"
            >
              {rankingJobId ? 'Ranking...' : 'Refresh AI ranking'}
            </button>
          ) : null}
        </div>
      </div>

      <CompanyStatStrip metrics={metrics} loading={loading || analyticsLoading} />

      <section>
        <article className="company-workspace-panel p-5">
          <h2 className="company-workspace-section-title">Review flow</h2>
          <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Current candidate volume by stored applicant status.</p>
          <StatusRail rows={pipelineRows} />
        </article>
      </section>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {analyticsError ? <p className="text-sm text-red-600 dark:text-red-400">{analyticsError}</p> : null}

      {loading ? (
        <div className="company-workspace-empty-quiet p-8 text-center">
          <p>Loading applicants...</p>
        </div>
      ) : visibleApplicants.length === 0 ? (
        <div className="company-workspace-empty-quiet p-8 text-center">
          <p>{selectedJobId ? `No applicants yet for ${selectedJobTitle}.` : 'No applicants yet.'}</p>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-5">
          {groupedApplicants.map((group) => (
            <section key={group.key} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="company-workspace-section-title">{group.label}</h2>
                <span className="text-sm font-semibold tabular-nums text-[var(--workspace-text-muted)]">{group.items.length}</span>
              </div>
              <div className="space-y-4">
                {group.items.map((applicant) => (
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
            </section>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="company-workspace-table-header hidden gap-6 px-6 py-3 text-xs font-semibold uppercase tracking-[0.04em] xl:grid xl:grid-cols-[minmax(0,1.7fr)_minmax(0,0.95fr)_0.9fr_0.95fr_minmax(17.5rem,1.35fr)]">
            <div>Candidate</div>
            <div>Applied To</div>
            <div>Job Status</div>
            <div>Applicant Status</div>
            <div className="text-center">Actions</div>
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
            <p className="text-sm text-[var(--workspace-text-muted)]">Loading profile...</p>
          ) : (
            <div className="company-workspace-panel p-4">
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

function StatusRail({ rows }) {
  const maxValue = Math.max(...rows.map((row) => Number(row?.value || 0)), 1);

  return (
    <div className="mt-5 space-y-3">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-[var(--workspace-text)]">{row.label}</span>
            <span className="text-sm font-semibold tabular-nums text-[var(--workspace-text-strong)]">{row.value}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[var(--workspace-surface-subtle)]">
            <div
              className="h-2 rounded-full bg-[var(--workspace-primary)]"
              style={{ width: `${Math.max(10, Math.round((Number(row.value || 0) / maxValue) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Modal({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-2xl">
        <div className="p-1">{children}</div>
      </div>
    </div>
  );
}
