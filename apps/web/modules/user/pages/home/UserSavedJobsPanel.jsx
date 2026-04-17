import React from 'react';
import { Bookmark, Building2, MapPin } from 'lucide-react';

export default function UserSavedJobsPanel({ savedJobs, savedPosts }) {
  const [activeTab, setActiveTab] = React.useState('all');

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'posts', label: 'Posts' },
  ];

  const showJobs = activeTab === 'all' || activeTab === 'jobs';
  const showPosts = activeTab === 'all' || activeTab === 'posts';
  const isEmpty = (showJobs ? savedJobs.length : 0) + (showPosts ? savedPosts.length : 0) === 0;

  return (
    <div className="mx-auto w-full max-w-[min(100%,720px)] animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#f8fbf6] dark:bg-[#162842] rounded-[32px] border border-[#d6d3c9] dark:border-[#2a4a6f] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.12)] dark:shadow-black/40 overflow-hidden mb-8">
      <div className="flex flex-col items-center justify-center pt-8 pb-2">
        <h2 className="text-[22px] font-extrabold text-[#1c2b1f] dark:text-white tracking-tight">Saved</h2>
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

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-full bg-[#f0f4ec] dark:bg-[#1e3a5f] flex items-center justify-center mb-4">
            <Bookmark className="h-8 w-8 text-[#a3b18a] dark:text-[#3ba9d6]" />
          </div>
          <p className="text-sm font-medium text-[#6b7c6a] dark:text-[#7d9ab8] text-center max-w-[220px]">
            Nothing saved yet. Bookmark job listings or posts to find them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-5">
          {showJobs && savedJobs.map((job) => (
            <div
              key={`job-${job.id}`}
              className="relative bg-[#f8fbf6] dark:bg-[#1a2f45] rounded-2xl p-4 flex flex-col gap-3 shadow-sm border border-[#e8f0e2] dark:border-[#1e3a5f] hover:shadow-md hover:border-[#a3b18a] dark:hover:border-[#3ba9d6] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6] shadow-sm">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13px] font-bold text-[#1c2b1f] dark:text-white leading-tight line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#6b7c6a] dark:text-[#9fb4ca] line-clamp-1">
                    {job.company?.name || 'Company'}
                  </p>
                </div>
              </div>

              {job.type && (
                <span className="self-start text-[10px] px-2.5 py-0.5 rounded-full bg-[#eef6ee] dark:bg-[#14304d] text-[#3a5a40] dark:text-[#7dc4ff] font-semibold">
                  {job.type}
                </span>
              )}

              <div className="mt-auto flex flex-wrap gap-1.5">
                {job.location && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-[#5f6f52] dark:text-[#8fb2cf]">
                    <MapPin className="h-3 w-3 shrink-0" /> {job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="text-[10px] font-semibold text-[#588157] dark:text-[#3ba9d6]">
                    {job.salary}
                  </span>
                )}
              </div>
            </div>
          ))}

          {showPosts && savedPosts.map((post) => (
            <div
              key={`post-${post.id}`}
              className="relative bg-[#f8fbf6] dark:bg-[#1a2f45] rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-[#e8f0e2] dark:border-[#1e3a5f] hover:shadow-md hover:border-[#a3b18a] dark:hover:border-[#3ba9d6] transition-all duration-200 cursor-pointer"
            >
              <span className="self-start text-[10px] px-2.5 py-0.5 rounded-full bg-[#f0f4ec] dark:bg-[#1e3a5f] text-[#588157] dark:text-[#7dc4ff] font-semibold uppercase tracking-wider">
                Post
              </span>
              <p className="text-[13px] text-[#1c2b1f] dark:text-white leading-relaxed line-clamp-5 flex-1">
                {post.content || 'No content'}
              </p>
              <p className="text-[10px] text-[#b0bec5] dark:text-[#5a7a96] mt-auto">
                {new Date(post.savedAt || post.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
