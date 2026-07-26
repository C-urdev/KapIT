import React from 'react';
import { MapPin, Briefcase, Users, RotateCcw, Trash2, Eye, WalletCards } from 'lucide-react';
import { formatJobStatus, statusBadgeClass } from '@companyFeatures/companyUtils';

export default function CompanyJobCard({ job, onManage, onViewDetails, onClose, onReopen, onDelete, onPayNow, actionLoading }) {
  const status = String(job?.status || 'open').toLowerCase();
  const isOpen = status === 'open';
  const isDraft = status === 'draft' || String(job?.posting_payment_status || '').toLowerCase() !== 'paid';
  const applicants = Number(job?.applicant_count || job?.applicantCount || 0);

  return (
    <div className="company-workspace-panel rounded-2xl bg-[#f8fbf6] px-3.5 py-3.5 shadow-lg shadow-black/5 transition-colors duration-300 dark:bg-[#22272b] dark:shadow-black/20 sm:px-4 sm:py-4">
      <div className="flex flex-col 2xl:flex-row 2xl:items-center gap-3 2xl:gap-5">
        <div className="min-w-0 2xl:flex-[1_1_auto]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-[#3a5a40] dark:text-white truncate">{job?.title || 'Untitled job'}</h3>
            <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass(status)}`}>
              {formatJobStatus(status)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#344e41] dark:text-[#d0d7dd]">
            {job?.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4 text-[#588157] dark:text-[#6f9b74]" />
                {job.location}
              </span>
            ) : null}
            {job?.type ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="w-4 h-4 text-[#588157] dark:text-[#6f9b74]" />
                {job.type}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4 text-[#588157] dark:text-[#6f9b74]" />
              {applicants} applicants
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-stretch 2xl:justify-end gap-2 2xl:flex-[0_0_30%]">
          <button
            type="button"
            onClick={() => onViewDetails?.(job)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-[#a3b18a] dark:border-[#444d57] text-xs sm:text-sm text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#588157] dark:text-[#6f9b74]" />
            View details
          </button>
          {onManage ? (
            <button
              type="button"
              onClick={() => onManage(job)}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-[#a3b18a] dark:border-[#444d57] text-xs sm:text-sm text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
            >
              Manage
            </button>
          ) : null}
          {isOpen && onClose ? (
            <button
              type="button"
              onClick={() => onClose(job)}
              disabled={actionLoading}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-[#a3b18a] dark:border-[#444d57] text-xs sm:text-sm text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] disabled:opacity-60 transition-colors"
            >
              {actionLoading ? 'Updating...' : 'Close listing'}
            </button>
          ) : null}
          {isDraft && onPayNow ? (
            <button
              type="button"
              onClick={() => onPayNow(job)}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white text-xs sm:text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              <WalletCards className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {actionLoading ? 'Opening checkout...' : 'Pay now'}
            </button>
          ) : null}
          {!isOpen && !isDraft && onReopen ? (
            <button
              type="button"
              onClick={() => onReopen(job)}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white text-xs sm:text-sm font-semibold disabled:opacity-60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {actionLoading ? 'Reopening...' : 'Reopen'}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(job)}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs sm:text-sm disabled:opacity-60 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {actionLoading ? 'Deleting...' : 'Delete'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
