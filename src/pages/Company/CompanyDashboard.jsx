import React from 'react';
import { Briefcase, Users, BarChart3, PlusCircle, ChevronRight } from 'lucide-react';
import StatsCard from '@components/company/StatsCard';
import JobCard from '@components/company/JobCard';
import { useCompanyAnalytics, useCompanyJobs } from '@features/company/companyHooks';
import { COMPANY_PATHS, navigate } from '@features/company/companyUtils';

export default function CompanyDashboard() {
  const { analytics, loading: analyticsLoading, error: analyticsError } = useCompanyAnalytics();
  const { jobs, loading: jobsLoading, error: jobsError } = useCompanyJobs();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Overview</h2>
          <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">Track jobs, applicants, and hiring performance.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(COMPANY_PATHS.postJob)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Post a job
        </button>
      </div>

      {analyticsError && <p className="text-sm text-red-600 dark:text-red-400">{analyticsError}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Total jobs"
          value={analyticsLoading ? '—' : analytics?.totalJobs ?? 0}
          icon={Briefcase}
        />
        <StatsCard
          label="Total applicants"
          value={analyticsLoading ? '—' : analytics?.totalApplicants ?? 0}
          icon={Users}
        />
        <StatsCard
          label="Statuses tracked"
          value={analyticsLoading ? '—' : Object.keys(analytics?.applicantsByStatus || {}).length}
          icon={BarChart3}
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Recent job listings</h3>
        <button
          type="button"
          onClick={() => navigate(COMPANY_PATHS.jobs)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#588157] dark:text-[#3ba9d6] hover:underline transition-colors"
        >
          Manage jobs <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {jobsError && <p className="text-sm text-red-600 dark:text-red-400">{jobsError}</p>}
      {jobsLoading ? (
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-6 transition-colors duration-300">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">No jobs yet. Post your first job to start receiving applicants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {jobs.slice(0, 6).map((job) => (
            <JobCard key={job.id} job={job} onManage={() => navigate(COMPANY_PATHS.jobs)} />
          ))}
        </div>
      )}
    </div>
  );
}
