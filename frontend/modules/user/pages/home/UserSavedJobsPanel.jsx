import React from 'react';
import { Bookmark, Building2, MapPin } from 'lucide-react';

export default function UserSavedJobsPanel({ savedJobs = [], savedPosts = [], embedded = false }) {
  const [activeTab, setActiveTab] = React.useState('all');

  const safeJobs = Array.isArray(savedJobs) ? savedJobs : [];
  const safePosts = Array.isArray(savedPosts) ? savedPosts : [];

  const tabs = [
    { key: 'all', label: 'All', count: safeJobs.length + safePosts.length },
    { key: 'jobs', label: 'Jobs', count: safeJobs.length },
    { key: 'posts', label: 'Posts', count: safePosts.length },
  ];

  const showJobs = activeTab === 'all' || activeTab === 'jobs';
  const showPosts = activeTab === 'all' || activeTab === 'posts';
  const isEmpty = (showJobs ? safeJobs.length : 0) + (showPosts ? safePosts.length : 0) === 0;

  return (
    <div
      className={`w-full rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] shadow-sm shadow-black/5 dark:border-[#444d57] dark:bg-[#22272b] ${
        embedded ? '' : 'mx-auto max-w-[min(100%,820px)]'
      }`}
    >
      {!embedded ? (
        <div className="px-5 pb-3 pt-5">
          <h2 className="text-[22px] font-bold tracking-tight text-[#1c2b1f] dark:text-white">Saved</h2>
        </div>
      ) : null}

      <div className="border-b border-[#d8e3cc] px-4 py-3 dark:border-[#444d57] sm:px-5">
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-nowrap sm:items-center sm:overflow-x-auto sm:pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex w-full items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors max-[360px]:px-1.5 sm:w-auto sm:shrink-0 sm:px-4 sm:text-[13px]
              ${activeTab === tab.key
                ? 'bg-[#3a5a40] text-white dark:bg-[#6f9b74]'
                : 'bg-[#eef6ee] text-[#3a5a40] hover:bg-[#e3eee3] dark:bg-[#2b3138] dark:text-[#eceff2] dark:hover:bg-[#353c44]'
              }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 text-[11px] ${activeTab === tab.key ? 'bg-white/20' : 'bg-white/70 dark:bg-white/10'}`}>
              {tab.count}
            </span>
          </button>
        ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 sm:py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6ee] dark:bg-[#2b3138]">
            <Bookmark className="h-7 w-7 text-[#588157] dark:text-[#6f9b74]" />
          </div>
          <p className="max-w-[260px] text-center text-sm font-medium text-[#6b7c6a] dark:text-[#adb5be]">
            Nothing saved yet. Bookmark job listings or posts to find them here.
          </p>
        </div>
      ) : (
        <div className="space-y-2 p-4 sm:p-5">
          {showJobs && safeJobs.map((job) => (
            <div
              key={`job-${job.id}`}
              className="rounded-xl border border-[#d8e3cc] bg-[#f8fbf6] p-4 transition-colors hover:bg-[#f3f8f0] dark:border-[#444d57] dark:bg-[#22272b] dark:hover:bg-[#1b3250]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef6ee] text-[#3a5a40] dark:bg-[#2b3138] dark:text-[#e9c86b]">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-[15px] font-semibold leading-tight text-[#1c2b1f] dark:text-white">
                    {job.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-sm text-[#6b7c6a] dark:text-[#b3bcc5]">
                    {job.company?.name || 'Company'}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {job.type ? <span className="rounded-full bg-[#eef6ee] px-2.5 py-0.5 text-xs font-medium text-[#3a5a40] dark:bg-[#2b3138] dark:text-[#e9c86b]">{job.type}</span> : null}
                {job.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#5f6f52] dark:text-[#a8b1ba]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {job.location}
                  </span>
                )}
                {job.salary ? <span className="text-xs font-semibold text-[#588157] dark:text-[#6f9b74]">{job.salary}</span> : null}
              </div>
            </div>
          ))}

          {showPosts && safePosts.map((post) => (
            <div
              key={`post-${post.id}`}
              className="rounded-xl border border-[#d8e3cc] bg-[#f8fbf6] p-4 transition-colors hover:bg-[#f3f8f0] dark:border-[#444d57] dark:bg-[#22272b] dark:hover:bg-[#1b3250]"
            >
              <span className="self-start rounded-full bg-[#eef6ee] px-2.5 py-0.5 text-xs font-medium text-[#3a5a40] dark:bg-[#2b3138] dark:text-[#e9c86b]">
                Post
              </span>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#1c2b1f] dark:text-white">
                {post.content || 'No content'}
              </p>
              <p className="mt-2 text-xs text-[#9aa8ad] dark:text-[#adb5be]">
                {new Date(post.savedAt || post.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
