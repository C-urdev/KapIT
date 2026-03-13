import React from 'react';
import JobCard from '@components/company/JobCard';
import { useCompanyJobs } from '@features/company/companyHooks';
import { COMPANY_PATHS, navigate } from '@features/company/companyUtils';

export default function ManageJobs() {
  const { jobs, loading, error, refetch } = useCompanyJobs();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Manage jobs</h2>
          <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">View and manage your job listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.postJob)}
            className="px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold transition-colors"
          >
            Post job
          </button>
          <button
            type="button"
            onClick={refetch}
            className="px-4 py-2.5 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-6 transition-colors duration-300">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">No job listings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
