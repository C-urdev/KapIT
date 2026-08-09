import React from 'react';
import { MapPin, FileText, User, CheckCircle2, XCircle, Eye, Briefcase } from 'lucide-react';
import { statusBadgeClass, formatJobStatus } from '@companyFeatures/companyUtils';
import CompanyOverflowMenu from '@companyComponents/CompanyOverflowMenu';
import ResumeOpenChoiceModal from '@sharedComponents/modals/ResumeOpenChoiceModal';
import { resumeService } from '@sharedServices/resumeService';

export default function CompanyApplicantCard({
  applicant,
  onViewProfile,
  onOpenReview,
  onMessage,
  onHire,
  onReject,
  onReview,
  actionLoading,
}) {
  const user = applicant?.user || {};
  const name = user.username || user.email || 'Applicant';
  const jobTitle = applicant?.job?.title || 'Job';
  const location = user.address || 'No location added';
  const role = user.desiredJob || 'IT Professional';
  const resumeUrl = applicant?.resumeUrl;
  const resumeId = applicant?.resumeId;
  const resumeHref = resumeId ? `/resume/${encodeURIComponent(resumeId)}` : resumeUrl;
  const openResumeInNewTab = () => {
    if (!resumeHref) return;
    window.open(resumeHref, '_blank', 'noopener,noreferrer');
  };
  const downloadResume = async () => {
    if (!resumeHref) return;

    if (!resumeId) {
      const a = document.createElement('a');
      a.href = resumeHref;
      a.download = '';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    try {
      const data = await resumeService.getResume(resumeId);
      const resume = data?.resume || {};
      const signedUrl = resume.signed_pdf_url || resume.signed_docx_url || resumeHref;
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = '';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      const a = document.createElement('a');
      a.href = resumeHref;
      a.download = '';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };
  const jobStatus = String(applicant?.job?.status || 'open').toLowerCase();
  const applicantStatus = String(applicant?.status || 'pending').toLowerCase();
  const isOpen = jobStatus === 'open';
  const isFilled = jobStatus === 'filled';
  const isAccepted = applicantStatus === 'accepted';
  const isRejected = applicantStatus === 'rejected';
  const isReviewed = applicantStatus === 'reviewed';
  const aiMatch = applicant?.ai?.matchPercentage;
  const aiAtsScore = applicant?.ai?.atsScore;
  const canReview = !actionLoading && isOpen && !isAccepted && !isRejected && !isReviewed && !isFilled;
  const canReject = !actionLoading && isOpen && !isAccepted && !isRejected && !isFilled;
  const canHire = !actionLoading && isOpen && !isAccepted && !isRejected && !isFilled;
  const [resumeChoiceOpen, setResumeChoiceOpen] = React.useState(false);

  return (
    <>
      <div className="rounded-2xl border border-[#d6d3c9] bg-[#f8fbf6] p-5 shadow-sm shadow-black/5 transition-colors dark:border-[#444d57] dark:bg-[#22272b] xl:hidden">
        <div className="flex items-start gap-3">
          <Avatar user={user} name={name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[1.05rem] font-bold text-[#31572c] dark:text-white">{name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#425466] dark:text-[#d0d7dd]">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-4 w-4 text-[#588157] dark:text-[#f0c766]" />
                {role}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#588157] dark:text-[#f0c766]" />
                {location}
              </span>
              {Number.isFinite(Number(aiMatch)) ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6ee] px-2 py-0.5 text-xs font-semibold text-[#31572c] dark:bg-[#2a2f35] dark:text-[#eceff2]">
                  Match {Number(aiMatch)}%
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoBlock label="Applied to" value={jobTitle} sublabel="Applied role" />
          <InfoBlock label="Job status" value={formatJobStatus(jobStatus)} sublabel="Current listing" />
          <StatusBlock applicantStatus={applicantStatus} />
        </div>

        <div className="mt-4">
          <ActionRow
            applicant={applicant}
            user={user}
            resumeUrl={resumeHref}
            actionLoading={actionLoading}
            canReview={canReview}
            canReject={canReject}
            canHire={canHire}
            isReviewed={isReviewed}
            isRejected={isRejected}
            isAccepted={isAccepted}
            onViewProfile={onViewProfile}
            onMessage={onMessage}
            onReview={onReview}
            onReject={onReject}
            onHire={onHire}
            wrap
            onOpenResumeChoice={() => setResumeChoiceOpen(true)}
          />
        </div>

        {!isAccepted && isFilled ? (
          <p className="mt-3 text-xs text-[#9a3412] dark:text-[#fdba74]">This job was already filled. Reopen the job from Manage Jobs to hire for the same role again.</p>
        ) : null}
      </div>

      <div className="company-workspace-panel hidden p-6 xl:grid xl:grid-cols-[minmax(0,1.7fr)_0.95fr_0.9fr_0.95fr_minmax(17.5rem,1.35fr)] xl:items-center xl:gap-6">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <Avatar user={user} name={name} />
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onOpenReview?.(applicant)}
                className="block max-w-full truncate text-left text-[1.05rem] font-semibold text-[var(--workspace-text-strong)] transition-colors duration-150 hover:text-[var(--workspace-primary)]"
              >
                {name}
              </button>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--workspace-text-muted)]">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-[#588157] dark:text-[#f0c766]" />
                  {role}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#588157] dark:text-[#f0c766]" />
                  {location}
                </span>
                {Number.isFinite(Number(aiMatch)) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6ee] px-2 py-0.5 text-xs font-semibold text-[#31572c] dark:bg-[#2a2f35] dark:text-[#eceff2]">
                    Match {Number(aiMatch)}% • ATS {Number(aiAtsScore || 0)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div>
          <InfoBlock value={jobTitle} sublabel="Applied role" />
        </div>
        <div>
          <InfoBlock value={formatJobStatus(jobStatus)} sublabel="Current listing" />
        </div>
        <div className="min-w-0 justify-self-start">
          <StatusBlock applicantStatus={applicantStatus} desktop />
        </div>
        <div className="min-w-0 justify-self-stretch">
          <DesktopApplicantActions
            applicant={applicant}
            user={user}
            resumeUrl={resumeHref}
            actionLoading={actionLoading}
            canReject={canReject}
            canHire={canHire}
            onMessage={onMessage}
            onReject={onReject}
            onHire={onHire}
            onOpenReview={onOpenReview}
            onOpenResumeChoice={() => setResumeChoiceOpen(true)}
          />
        </div>
      </div>
      <ResumeOpenChoiceModal
        isOpen={resumeChoiceOpen}
        title="Open Applicant Resume"
        onClose={() => setResumeChoiceOpen(false)}
        onView={() => {
          setResumeChoiceOpen(false);
          openResumeInNewTab();
        }}
        onDownload={async () => {
          setResumeChoiceOpen(false);
          await downloadResume();
        }}
      />
    </>
  );
}

function Avatar({ user, name }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#93a977] bg-[#f7faf3] font-bold text-[#31572c] transition-colors duration-300 dark:border-[#444d57] dark:bg-[#353c44] dark:text-white">
      {user.profileImage ? <img src={user.profileImage} alt={`${name} profile`} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
    </div>
  );
}

function InfoBlock({ label, value, sublabel }) {
  return (
    <div>
      {label ? <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#b3bcc5]">{label}</p> : null}
      <p className={`font-semibold text-[#31572c] dark:text-white ${label ? 'mt-1 text-base' : 'text-base'}`}>{value}</p>
      {sublabel ? <p className="mt-1 text-sm text-[#4b5563] dark:text-[#d0d7dd]">{sublabel}</p> : null}
    </div>
  );
}

function StatusBlock({ applicantStatus, desktop = false }) {
  return (
    <div className={desktop ? 'flex justify-start' : ''}>
      {!desktop ? <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#b3bcc5]">Applicant status</p> : null}
      <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${statusBadgeClass(applicantStatus)} ${desktop ? '' : 'mt-1'}`}>
        {applicantStatus}
      </span>
    </div>
  );
}

function ActionRow({
  applicant,
  user,
  resumeUrl,
  actionLoading,
  canReview,
  canReject,
  canHire,
  isReviewed,
  isRejected,
  isAccepted,
  onViewProfile,
  onMessage,
  onReview,
  onReject,
  onHire,
  onOpenResumeChoice,
  wrap = false,
}) {
  const compactActionClass = wrap ? 'w-full min-[420px]:w-auto justify-center' : 'min-w-[5.5rem] justify-center';
  const desktopLayoutClass = wrap ? 'flex-wrap' : 'grid w-full grid-cols-3';

  return (
    <div className={`flex items-center gap-2 ${desktopLayoutClass}`}>
      {resumeUrl ? (
        <button
          type="button"
          onClick={onOpenResumeChoice}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#a3b18a] px-2.5 py-2 text-xs font-medium text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44] xl:px-3 xl:text-sm ${compactActionClass}`}
        >
          <FileText className="h-4 w-4 shrink-0 text-[#588157] dark:text-[#f0c766]" />
          Resume
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onViewProfile?.(user)}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#a3b18a] px-2.5 py-2 text-xs font-medium text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44] xl:px-3 xl:text-sm ${compactActionClass}`}
      >
        <User className="h-4 w-4 shrink-0 text-[#588157] dark:text-[#f0c766]" />
        Profile
      </button>
      <button
        type="button"
        onClick={() => onMessage?.(user)}
        disabled={actionLoading}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3a5a40] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#344e41] disabled:opacity-60 dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] xl:px-3 xl:text-sm ${compactActionClass}`}
      >
        {actionLoading ? 'Wait...' : 'Message'}
      </button>
      <button
        type="button"
        onClick={() => onReview?.(applicant)}
        disabled={!canReview}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#a3b18a] px-2.5 py-2 text-xs font-medium text-[#344e41] transition-colors hover:bg-[#f5f5f2] disabled:opacity-60 dark:border-[#444d57] dark:text-white dark:hover:bg-[#353c44] xl:px-3 xl:text-sm ${compactActionClass}`}
      >
        <Eye className="h-4 w-4 shrink-0 text-[#588157] dark:text-[#f0c766]" />
        {isReviewed ? 'Reviewed' : actionLoading ? 'Saving...' : 'Review'}
      </button>
      <button
        type="button"
        onClick={() => onReject?.(applicant)}
        disabled={!canReject}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 px-2.5 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-950/20 xl:px-3 xl:text-sm ${compactActionClass}`}
      >
        <XCircle className="h-4 w-4 shrink-0" />
        {isRejected ? 'Rejected' : actionLoading ? 'Saving...' : 'Reject'}
      </button>
      <button
        type="button"
        onClick={() => onHire?.(applicant)}
        disabled={!canHire}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#2f6b4f] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#285b44] disabled:opacity-60 dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] xl:px-3 xl:text-sm ${compactActionClass}`}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        {isAccepted ? 'Hired' : actionLoading ? 'Hiring...' : 'Hire'}
      </button>
    </div>
  );
}

function DesktopApplicantActions({
  applicant,
  user,
  resumeUrl,
  actionLoading,
  canReject,
  canHire,
  onMessage,
  onReject,
  onHire,
  onOpenReview,
  onOpenResumeChoice,
}) {
  const name = user.username || user.email || 'applicant';

  return (
    <div className="company-applicant-desktop-actions">
      {resumeUrl ? (
        <button
          type="button"
          onClick={onOpenResumeChoice}
          className="company-workspace-secondary-button px-3"
        >
          Resume
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => onOpenReview?.(applicant)}
        className="company-workspace-primary-button px-4"
      >
        Review application
      </button>
      <CompanyOverflowMenu
        label={`More actions for ${name}`}
        items={[
          {
            key: 'message',
            label: 'Message',
            onSelect: () => onMessage?.(user),
            disabled: actionLoading,
          },
          {
            key: 'hire',
            label: 'Hire',
            onSelect: () => onHire?.(applicant),
            disabled: !canHire,
          },
          {
            key: 'reject',
            label: 'Reject',
            onSelect: () => onReject?.(applicant),
            danger: true,
            disabled: !canReject,
          },
        ]}
      />
    </div>
  );
}
