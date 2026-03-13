import React from 'react';
import { BarChart3, Briefcase, Users } from 'lucide-react';
import StatsCard from '@components/company/StatsCard';
import { useCompanyAnalytics } from '@features/company/companyHooks';

export default function CompanyAnalytics() {
  const { analytics, loading, error, refetch } = useCompanyAnalytics();

  const statuses = analytics?.applicantsByStatus || {};
  const statusEntries = Object.entries(statuses);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Hiring analytics</h2>
          <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">Monitor applicant volume and pipeline health.</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="px-4 py-2.5 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Total jobs" value={loading ? '—' : analytics?.totalJobs ?? 0} icon={Briefcase} />
        <StatsCard label="Total applicants" value={loading ? '—' : analytics?.totalApplicants ?? 0} icon={Users} />
        <StatsCard label="Pipeline statuses" value={loading ? '—' : statusEntries.length} icon={BarChart3} />
      </div>

      <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-6 transition-colors duration-300">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Applicants by status</h3>
        <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">Counts across all jobs.</p>

        {loading ? (
          <p className="mt-4 text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading…</p>
        ) : statusEntries.length === 0 ? (
          <p className="mt-4 text-sm text-[#344e41] dark:text-[#b8d4e8]">No applicant status data yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {statusEntries.map(([status, count]) => (
              <div key={status} className="rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#0f2139] p-4 transition-colors duration-300">
                <div className="text-xs font-semibold text-[#4b5563] dark:text-[#b8d4e8] uppercase">{status}</div>
                <div className="mt-2 text-2xl font-extrabold text-[#3a5a40] dark:text-white">{count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
