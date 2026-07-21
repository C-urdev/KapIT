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
      className={`user-desktop-flat-surface w-full rounded-3xl border border-white/40 bg-white/70 shadow-[0_20px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#22272b]/70 ${
        embedded ? '' : 'mx-auto max-w-[min(100%,820px)] xl:max-w-[1200px]'
      }`}
    >
      {!embedded ? (
        <div className="px-5 pb-3 pt-5 xl:px-6 xl:pb-5 xl:pt-6">
          <p className="hidden text-sm font-medium text-[var(--user-primary)] xl:block">Library</p>
          <h2 className="text-[22px] font-bold tracking-tight text-[#1c2b1f] dark:text-white xl:mt-1 xl:text-3xl xl:font-semibold xl:tracking-normal xl:text-[var(--user-text-strong)]">Saved items</h2>
          <p className="mt-1 hidden text-sm text-[var(--user-text-muted)] xl:block">Return to jobs and posts you want to review later.</p>
        </div>
      ) : null}

      <div className="border-b border-white/40 px-4 py-3 dark:border-white/10 sm:px-5">
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-nowrap sm:items-center sm:overflow-x-auto sm:pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex w-full items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors max-[360px]:px-1.5 sm:w-auto sm:shrink-0 sm:px-4 sm:text-[13px] xl:min-h-10 xl:rounded-md
              ${activeTab === tab.key
                ? 'bg-[#3a5a40] text-white shadow-md dark:bg-[#6f9b74] xl:bg-[var(--user-surface-selected)] xl:text-[var(--user-primary)] xl:shadow-none dark:xl:bg-[var(--user-surface-selected)]'
                : 'bg-white/50 text-[#3a5a40] hover:bg-white hover:shadow-sm dark:bg-[#1a1d20]/50 dark:text-[#eceff2] dark:hover:bg-[#353c44] xl:bg-transparent xl:text-[var(--user-text-muted)] xl:shadow-none xl:hover:bg-[var(--user-surface-subtle)] xl:hover:text-[var(--user-text-strong)] dark:xl:bg-transparent'
              }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 text-[11px] ${activeTab === tab.key ? 'bg-white/20' : 'bg-[#3a5a40]/10 dark:bg-white/10'}`}>
              {tab.count}
            </span>
          </button>
        ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 sm:py-20 xl:min-h-[340px]">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/50 shadow-sm dark:bg-[#1a1d20]/50 xl:h-12 xl:w-12 xl:rounded-md xl:bg-[var(--user-primary-soft)] xl:shadow-none dark:xl:bg-[var(--user-primary-soft)]">
            <Bookmark className="h-10 w-10 text-[#588157] dark:text-[#6f9b74] xl:h-6 xl:w-6 xl:text-[var(--user-primary)]" />
          </div>
          <p className="max-w-[260px] text-center text-[15px] font-medium text-[#4a6b57] dark:text-[#a8b1ba]">
            Nothing saved yet. Bookmark job listings or posts to find them here.
          </p>
        </div>
      ) : (
        <div className="space-y-2 p-4 sm:p-5">
          {showJobs && safeJobs.map((job) => (
            <div
              key={`job-${job.id}`}
              className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-[#1a1d20]/50 dark:hover:bg-[#22272b]/80 xl:rounded-lg xl:border-[var(--user-border)] xl:bg-[var(--user-surface-subtle)] xl:shadow-none xl:backdrop-blur-none xl:hover:translate-y-0 xl:hover:border-[var(--user-border-strong)] xl:hover:bg-[var(--user-surface-subtle)] xl:hover:shadow-none dark:xl:bg-[var(--user-surface-subtle)]"
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
              className="rounded-2xl border border-white/60 bg-white/50 p-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-[#1a1d20]/50 dark:hover:bg-[#22272b]/80 xl:rounded-lg xl:border-[var(--user-border)] xl:bg-[var(--user-surface-subtle)] xl:shadow-none xl:backdrop-blur-none xl:hover:translate-y-0 xl:hover:border-[var(--user-border-strong)] xl:hover:bg-[var(--user-surface-subtle)] xl:hover:shadow-none dark:xl:bg-[var(--user-surface-subtle)]"
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
