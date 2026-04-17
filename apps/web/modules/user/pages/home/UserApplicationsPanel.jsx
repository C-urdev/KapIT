import React from 'react';
import { Building2, FileCheck2, MapPin } from 'lucide-react';

export default function UserApplicationsPanel({ applications }) {
  const [activeTab, setActiveTab] = React.useState('all');

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const filtered = activeTab === 'all'
    ? applications
    : applications.filter((a) => (a.status || 'pending').toLowerCase() === activeTab);

  const statusStyle = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'accepted' || s === 'hired') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    if (s === 'rejected' || s === 'declined') return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300';
    if (s === 'reviewing' || s === 'interview') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-[#eef6ee] text-[#3a5a40] dark:bg-[#14304d] dark:text-[#7dc4ff]';
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,720px)] animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white dark:bg-[#162842] rounded-[32px] border border-[#d6d3c9] dark:border-[#2a4a6f] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.12)] dark:shadow-black/40 overflow-hidden mb-8">
      <div className="flex flex-col items-center justify-center pt-8 pb-2">
        <h2 className="text-[22px] font-extrabold text-[#1c2b1f] dark:text-white tracking-tight">Applications</h2>
        <div className="mt-1 h-1 w-8 rounded-full bg-[#3a5a40] dark:bg-[#3ba9d6] opacity-30" />
      </div>

      <div className="flex items-center justify-center gap-2 border-b border-[#f0f0f0] dark:border-[#1e3a5f] px-4 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative rounded-full px-5 py-2 text-[14px] font-bold transition-all
              ${activeTab === tab.key
                ? 'bg-[#3a5a40] text-white shadow-lg shadow-[#3a5a40]/20 dark:bg-[#3ba9d6] dark:shadow-[#3ba9d6]/20'
                : 'text-[#6b7c6a] dark:text-[#7d9ab8] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-full bg-[#f0f4ec] dark:bg-[#1e3a5f] flex items-center justify-center mb-4">
            <FileCheck2 className="h-8 w-8 text-[#a3b18a] dark:text-[#3ba9d6]" />
          </div>
          <p className="text-sm font-medium text-[#6b7c6a] dark:text-[#7d9ab8] text-center max-w-[220px]">
            {activeTab === 'all' ? 'No applications yet. Start applying to jobs.' : `No ${activeTab} applications.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-5">
          {filtered.map((application) => (
            <div
              key={application.jobId}
              className="relative bg-white dark:bg-[#1a2f45] rounded-2xl p-4 flex flex-col gap-3 shadow-sm border border-[#e8f0e2] dark:border-[#1e3a5f] hover:shadow-md hover:border-[#a3b18a] dark:hover:border-[#3ba9d6] transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6] shadow-sm">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-bold text-[#1c2b1f] dark:text-white leading-tight line-clamp-2">
                    {application.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#6b7c6a] dark:text-[#9fb4ca] line-clamp-1">
                    {application.company?.name || 'Company'}
                  </p>
                </div>
              </div>

              <span className={`self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle(application.status)}`}>
                {application.status || 'pending'}
              </span>

              <div className="mt-auto flex flex-wrap gap-1.5">
                {application.location && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-[#5f6f52] dark:text-[#8fb2cf]">
                    <MapPin className="h-3 w-3 shrink-0" /> {application.location}
                  </span>
                )}
                {application.type && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f0f4ec] dark:bg-[#1e3a5f] text-[#5f6f52] dark:text-[#8fb2cf]">
                    {application.type}
                  </span>
                )}
              </div>

              <p className="text-[10px] text-[#b0bec5] dark:text-[#5a7a96]">
                {new Date(application.appliedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
