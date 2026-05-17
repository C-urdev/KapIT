import React from 'react';
import { ArrowLeft, Bell, Briefcase, Check, ChevronRight, FileCheck2 } from 'lucide-react';
import UserSavedJobsPanel from '../home/UserSavedJobsPanel';
import UserApplicationsPanel from '../home/UserApplicationsPanel';

function Header({ title, onBack }) {
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-[#9caf97] bg-[#d9ddcf] text-[#344e41] transition-colors hover:bg-[#dde2d4] hover:border-[#8ea488] dark:border-[#5e8b67] dark:bg-transparent dark:text-white dark:hover:bg-[#353c44]"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h2 className="mt-3 text-[28px] font-bold text-[#1c2b1f] dark:text-white">{title}</h2>
    </div>
  );
}

function PageShell({ title, onBack, children }) {
  return (
    <div className="mx-auto w-full max-w-[min(100%,760px)] px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pt-4 sm:px-5 sm:pb-10 sm:pt-6">
      <Header title={title} onBack={onBack} />
      {children}
    </div>
  );
}

function OptionRow({ icon: Icon, title, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl bg-[#f8fbf6] px-4 py-3.5 text-left transition-colors hover:bg-[#eef6ee] dark:bg-[#22272b] dark:hover:bg-[#353c44]/60"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3e8] text-[#3a5a40] dark:bg-[#2b3138] dark:text-[#e9c86b]">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="text-[16px] font-semibold text-[#1c2b1f] dark:text-white">{title}</span>
      </div>
      {selected ? <Check className="h-5 w-5 text-[#3a5a40] dark:text-[#e9c86b]" /> : <ChevronRight className="h-5 w-5 text-[#7c8e76] dark:text-[#adb5be]" />}
    </button>
  );
}

export function UserNotificationSettingsPage({ onBack, value, onChange }) {
  return (
    <PageShell title="Notifications" onBack={onBack}>
      <div className="space-y-2">
        <OptionRow icon={Briefcase} title="Jobs notifications only" selected={value === 'jobs_only'} onClick={() => onChange('jobs_only')} />
        <OptionRow icon={Bell} title="Jobs and messages" selected={value === 'jobs_and_messages'} onClick={() => onChange('jobs_and_messages')} />
        <OptionRow icon={Bell} title="All notifications" selected={value === 'all'} onClick={() => onChange('all')} />
      </div>
    </PageShell>
  );
}

export function UserSavedJobsSettingsPage({ onBack, savedJobs, savedPosts }) {
  return (
    <PageShell title="Saved Jobs" onBack={onBack}>
      <UserSavedJobsPanel savedJobs={savedJobs} savedPosts={savedPosts} embedded />
    </PageShell>
  );
}

export function UserApplicationsSettingsPage({ onBack, applications }) {
  return (
    <PageShell title="Applications" onBack={onBack}>
      <UserApplicationsPanel applications={applications} embedded />
    </PageShell>
  );
}
