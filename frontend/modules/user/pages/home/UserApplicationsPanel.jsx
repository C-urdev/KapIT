import React from 'react';
import { Building2, FileCheck2, MapPin } from 'lucide-react';

export default function UserApplicationsPanel({ applications = [], embedded = false }) {
  const [activeTab, setActiveTab] = React.useState('all');
  const safeApplications = Array.isArray(applications) ? applications : [];

  const tabs = [
    { key: 'all', label: 'All', count: safeApplications.length },
    { key: 'pending', label: 'Pending', count: safeApplications.filter((a) => (a.status || 'pending').toLowerCase() === 'pending').length },
    { key: 'accepted', label: 'Accepted', count: safeApplications.filter((a) => ['accepted', 'hired'].includes((a.status || '').toLowerCase())).length },
    { key: 'rejected', label: 'Rejected', count: safeApplications.filter((a) => ['rejected', 'declined'].includes((a.status || '').toLowerCase())).length },
  ];

  const filtered = activeTab === 'all'
    ? safeApplications
    : safeApplications.filter((a) => (a.status || 'pending').toLowerCase() === activeTab);

  const statusStyle = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'accepted' || s === 'hired') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    if (s === 'rejected' || s === 'declined') return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300';
    if (s === 'reviewing' || s === 'interview') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-[#eef6ee] text-[#3a5a40] dark:bg-[#2a2f35] dark:text-[#e2b94d]';
  };

  return (
    <div
      className={`w-full rounded-3xl border border-white/40 bg-white/70 shadow-[0_20px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#22272b]/70 ${
        embedded ? '' : 'mx-auto max-w-[min(100%,820px)]'
      }`}
    >
      {!embedded ? (
        <div className="px-5 pb-3 pt-5">
          <h2 className="text-[22px] font-bold tracking-tight text-[#1c2b1f] dark:text-white">Applications</h2>
        </div>
      ) : null}

      <div className="border-b border-white/40 px-4 py-3 dark:border-white/10 sm:px-5">
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-nowrap sm:items-center sm:overflow-x-auto sm:pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex w-full items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors max-[360px]:px-1.5 sm:w-auto sm:shrink-0 sm:px-4 sm:text-[13px]
                ${activeTab === tab.key
                  ? 'bg-[#3a5a40] text-white shadow-md dark:bg-[#6f9b74]'
                  : 'bg-white/50 text-[#3a5a40] hover:bg-white hover:shadow-sm dark:bg-[#1a1d20]/50 dark:text-[#eceff2] dark:hover:bg-[#353c44]'
                }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 text-[10px] ${activeTab === tab.key ? 'bg-white/20' : 'bg-[#3a5a40]/10 dark:bg-white/10'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 sm:py-20">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/50 shadow-sm dark:bg-[#1a1d20]/50">
            <FileCheck2 className="h-10 w-10 text-[#588157] dark:text-[#6f9b74]" />
          </div>
          <p className="max-w-[260px] text-center text-[15px] font-medium text-[#4a6b57] dark:text-[#a8b1ba]">
            {activeTab === 'all' ? 'No applications yet. Start applying to jobs.' : `No ${activeTab} applications.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2 p-4 sm:p-5">
          {filtered.map((application) => (
            <div
              key={application.jobId}
              className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-[#1a1d20]/50 dark:hover:bg-[#22272b]/80"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef6ee] text-[#3a5a40] dark:bg-[#2b3138] dark:text-[#e9c86b]">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-[15px] font-semibold leading-tight text-[#1c2b1f] dark:text-white">
                    {application.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-sm text-[#6b7c6a] dark:text-[#b3bcc5]">
                    {application.company?.name || 'Company'}
                  </p>
                </div>
              </div>

              <span className={`mt-3 inline-flex self-start rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.06em] ${statusStyle(application.status)}`}>
                {application.status || 'pending'}
              </span>

              <div className="mt-3 flex flex-wrap gap-2">
                {application.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#5f6f52] dark:text-[#a8b1ba]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {application.location}
                  </span>
                )}
                {application.type && (
                  <span className="rounded-full bg-[#eef6ee] px-2.5 py-0.5 text-xs font-medium text-[#3a5a40] dark:bg-[#2b3138] dark:text-[#e9c86b]">
                    {application.type}
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-[#9aa8ad] dark:text-[#adb5be]">
                {new Date(application.appliedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
