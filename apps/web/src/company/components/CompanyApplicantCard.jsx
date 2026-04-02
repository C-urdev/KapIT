import React from 'react';
import { MapPin, FileText, User, CheckCircle2, XCircle, Eye, Briefcase } from 'lucide-react';
import { statusBadgeClass, formatJobStatus } from '@companyFeatures/companyUtils';

export default function CompanyApplicantCard({ applicant, onViewProfile, onMessage, onHire, onReject, onReview, actionLoading }) {
  const user = applicant?.user || {};
  const name = user.username || user.email || 'Applicant';
  const jobTitle = applicant?.job?.title || 'Job';
  const location = user.address || 'No location added';
  const role = user.desiredJob || 'IT Professional';
  const resumeUrl = applicant?.resumeUrl;
  const jobStatus = String(applicant?.job?.status || 'open').toLowerCase();
  const applicantStatus = String(applicant?.status || 'pending').toLowerCase();
  const isFilled = jobStatus === 'filled';
  const isAccepted = applicantStatus === 'accepted';
  const isRejected = applicantStatus === 'rejected';
  const isReviewed = applicantStatus === 'reviewed';
  const canReview = !actionLoading && !isAccepted && !isReviewed;
  const canReject = !actionLoading && !isAccepted && !isRejected;
  const canHire = !actionLoading && !isAccepted && !isRejected && !isFilled;

  return (
    <>
      <div className="rounded-2xl border border-[#d6d3c9] bg-white p-5 shadow-sm shadow-black/5 transition-colors dark:border-[#2a4a6f] dark:bg-[#162842] xl:hidden">
        <div className="flex items-start gap-3">
          <Avatar user={user} name={name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[1.05rem] font-bold text-[#31572c] dark:text-white">{name}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#425466] dark:text-[#b8d4e8]">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
                {role}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
                {location}
              </span>
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
            resumeUrl={resumeUrl}
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
          />
        </div>

        {!isAccepted && isFilled ? (
          <p className="mt-3 text-xs text-[#9a3412] dark:text-[#fdba74]">This job was already filled. Reopen the job from Manage Jobs to hire for the same role again.</p>
        ) : null}
      </div>

      <div className="hidden rounded-2xl border border-[#d6d3c9] bg-white p-6 shadow-sm shadow-black/5 transition-colors dark:border-[#2a4a6f] dark:bg-[#162842] xl:grid xl:grid-cols-[minmax(0,1.8fr)_0.95fr_0.9fr_0.95fr_minmax(0,1.5fr)] xl:items-center xl:gap-8">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <Avatar user={user} name={name} />
            <div className="min-w-0">
              <p className="truncate text-[1.05rem] font-bold text-[#31572c] dark:text-white">{name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#425466] dark:text-[#b8d4e8]">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
                  {role}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
                  {location}
                </span>
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
        <div className="min-w-0 justify-self-end">
          <ActionRow
            applicant={applicant}
            user={user}
            resumeUrl={resumeUrl}
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
          />
        </div>
      </div>
    </>
  );
}

function Avatar({ user, name }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#93a977] bg-[#f7faf3] font-bold text-[#31572c] transition-colors duration-300 dark:border-[#2a4a6f] dark:bg-[#1e3a5f] dark:text-white">
      {user.profileImage ? <img src={user.profileImage} alt={`${name} profile`} className="h-full w-full object-cover" /> : name.charAt(0).toUpperCase()}
    </div>
  );
}

function InfoBlock({ label, value, sublabel }) {
  return (
    <div>
      {label ? <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca]">{label}</p> : null}
      <p className={`font-semibold text-[#31572c] dark:text-white ${label ? 'mt-1 text-base' : 'text-base'}`}>{value}</p>
      {sublabel ? <p className="mt-1 text-sm text-[#4b5563] dark:text-[#b8d4e8]">{sublabel}</p> : null}
    </div>
  );
}

function StatusBlock({ applicantStatus, desktop = false }) {
  return (
    <div className={desktop ? 'flex justify-start' : ''}>
      {!desktop ? <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#9fb4ca]">Applicant status</p> : null}
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
  wrap = false,
}) {
  return (
    <div className={`flex gap-2 ${wrap ? 'flex-wrap' : 'flex-wrap xl:flex-nowrap xl:justify-end'}`}>
      {resumeUrl ? (
        <a
          href={resumeUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#a3b18a] px-2.5 py-2 text-xs font-medium text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f] xl:px-3 xl:text-sm"
        >
          <FileText className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
          Resume
        </a>
      ) : null}
      <button
        type="button"
        onClick={() => onViewProfile?.(user)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#a3b18a] px-2.5 py-2 text-xs font-medium text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f] xl:px-3 xl:text-sm"
      >
        <User className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
        Profile
      </button>
      <button
        type="button"
        onClick={() => onMessage?.(user)}
        disabled={actionLoading}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#3a5a40] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#344e41] disabled:opacity-60 dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] xl:px-3 xl:text-sm"
      >
        {actionLoading ? 'Wait...' : 'Message'}
      </button>
      <button
        type="button"
        onClick={() => onReview?.(applicant)}
        disabled={!canReview}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#a3b18a] px-2.5 py-2 text-xs font-medium text-[#344e41] transition-colors hover:bg-[#f5f5f2] disabled:opacity-60 dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f] xl:px-3 xl:text-sm"
      >
        <Eye className="h-4 w-4 text-[#588157] dark:text-[#7fd0ee]" />
        {isReviewed ? 'Reviewed' : actionLoading ? 'Saving...' : 'Review'}
      </button>
      <button
        type="button"
        onClick={() => onReject?.(applicant)}
        disabled={!canReject}
        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-2.5 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-950/20 xl:px-3 xl:text-sm"
      >
        <XCircle className="h-4 w-4" />
        {isRejected ? 'Rejected' : actionLoading ? 'Saving...' : 'Reject'}
      </button>
      <button
        type="button"
        onClick={() => onHire?.(applicant)}
        disabled={!canHire}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#2f6b4f] px-2.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#285b44] disabled:opacity-60 dark:bg-[#278bb6] dark:hover:bg-[#3ba9d6] xl:px-3 xl:text-sm"
      >
        <CheckCircle2 className="h-4 w-4" />
        {isAccepted ? 'Hired' : actionLoading ? 'Hiring...' : 'Hire'}
      </button>
    </div>
  );
}
