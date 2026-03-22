import React from 'react';
import { MapPin, FileText, User, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { statusBadgeClass, formatJobStatus } from '@companyFeatures/companyUtils';

export default function ApplicantCard({ applicant, onViewProfile, onMessage, onHire, onReject, onReview, actionLoading }) {
  const user = applicant?.user || {};
  const name = user.username || user.email || 'Applicant';
  const initial = name.charAt(0).toUpperCase();
  const jobStatus = String(applicant?.job?.status || 'open').toLowerCase();
  const isFilled = jobStatus === 'filled';
  const isAccepted = String(applicant?.status || '').toLowerCase() === 'accepted';

  return (
    <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 px-4 py-4 transition-colors duration-300">
      <div className="flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-5">
        <div className="flex items-start gap-3 min-w-0 xl:flex-[0_0_28%]">
          <div className="w-11 h-11 rounded-full bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] text-[#3a5a40] dark:text-white overflow-hidden flex items-center justify-center font-bold shrink-0 transition-colors duration-300">
            {user.profileImage ? <img src={user.profileImage} alt={`${name} profile`} className="w-full h-full object-cover" /> : initial}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-[#3a5a40] dark:text-white truncate">{name}</p>
            <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8] truncate">{user.desiredJob || 'IT Professional'}</p>
            {user.address && (
              <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8] inline-flex items-center gap-1 truncate">
                <MapPin className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                {user.address}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 xl:flex-[1_1_auto] min-w-0">
          <MetaBlock label="Applied to" value={applicant?.job?.title || 'Job'} />
          <MetaBlock label="Job status" value={formatJobStatus(applicant?.job?.status)} />
          <div className="flex items-center xl:justify-end">
            <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${statusBadgeClass(applicant?.status)}`}>
              {applicant?.status || 'pending'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap xl:justify-end gap-2 xl:flex-[0_0_38%]">
          {applicant?.resumeUrl && (
            <a
              href={applicant.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] text-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
              Resume
            </a>
          )}
          <button
            type="button"
            onClick={() => onViewProfile?.(user)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] text-sm transition-colors"
          >
            <User className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
            View Profile
          </button>
          <button
            type="button"
            onClick={() => onMessage?.(user)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white text-sm font-semibold transition-colors"
          >
            Message
          </button>
          <button
            type="button"
            onClick={() => onReview?.(applicant)}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] text-sm disabled:opacity-60 transition-colors"
          >
            <Eye className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
            {actionLoading ? 'Saving...' : 'Reviewed'}
          </button>
          <button
            type="button"
            onClick={() => onReject?.(applicant)}
            disabled={actionLoading || isAccepted}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-sm disabled:opacity-60 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
          <button
            type="button"
            onClick={() => onHire?.(applicant)}
            disabled={actionLoading || (isFilled && !isAccepted)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2f6b4f] hover:bg-[#285b44] dark:bg-[#278bb6] dark:hover:bg-[#3ba9d6] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isAccepted ? 'Hired' : actionLoading ? 'Hiring...' : 'Hire'}
          </button>
        </div>
      </div>

      {!isAccepted && isFilled && (
        <p className="mt-3 text-xs text-[#9a3412] dark:text-[#fdba74]">This job was already filled. Reopen the job from Manage Jobs to hire for the same role again.</p>
      )}
    </div>
  );
}

function MetaBlock({ label, value }) {
  return (
    <div className="rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#0f2139] px-3 py-2.5 min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#588157] dark:text-[#7fd0ee]">{label}</div>
      <div className="mt-1 text-sm font-medium text-[#3a5a40] dark:text-white truncate">{value}</div>
    </div>
  );
}



