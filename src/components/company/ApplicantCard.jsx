import React from 'react';
import { MapPin, FileText, User } from 'lucide-react';
import { statusBadgeClass } from '@features/company/companyUtils';

export default function ApplicantCard({ applicant, onViewProfile, onMessage }) {
  const user = applicant?.user || {};
  const name = user.username || user.email || 'Applicant';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-5 transition-colors duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] text-[#3a5a40] dark:text-white overflow-hidden flex items-center justify-center font-bold shrink-0 transition-colors duration-300">
            {user.profileImage ? <img src={user.profileImage} alt={`${name} profile`} className="w-full h-full object-cover" /> : initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#3a5a40] dark:text-white truncate">{name}</p>
            <p className="text-xs text-[#4b5563] dark:text-[#b8d4e8] truncate">{user.desiredJob || 'IT Professional'}</p>
            {user.address && (
              <p className="mt-1 text-xs text-[#344e41] dark:text-[#b8d4e8] inline-flex items-center gap-1 truncate">
                <MapPin className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                {user.address}
              </p>
            )}
            <p className="mt-2 text-xs text-[#344e41] dark:text-[#b8d4e8]">
              Applied to <span className="font-semibold text-[#3a5a40] dark:text-white">{applicant?.job?.title || 'Job'}</span>
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass(applicant?.status)}`}>
          {applicant?.status || 'pending'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
      </div>
    </div>
  );
}
