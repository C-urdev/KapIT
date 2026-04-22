import React from 'react';
import {
  ArrowLeft,
  AtSign,
  ChevronRight,
  Heart,
  LockKeyhole,
  MessageCircle,
  Users,
} from 'lucide-react';

function Header({ title, onBack }) {
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:hover:bg-[#1e3a5f]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
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

function Row({ icon: Icon, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl bg-[#f8fbf6] px-4 py-3.5 text-left transition-colors hover:bg-[#eef6ee] dark:bg-[#162842] dark:hover:bg-[#1e3a5f]/60"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf3e8] text-[#3a5a40] dark:bg-[#183655] dark:text-[#8ccff0]">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="text-[16px] font-semibold text-[#1c2b1f] dark:text-white">{title}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-[#7c8e76] dark:text-[#7d9ab8]" />
    </button>
  );
}

function ListCard({ items, emptyText }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-10 text-center shadow-sm shadow-black/5 dark:border-[#2a4a6f] dark:bg-[#162842]">
        <p className="text-[#5f6f52] dark:text-[#b8d4e8]">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item.name}-${index}`} className="rounded-xl bg-[#f8fbf6] px-4 py-3.5 dark:bg-[#162842]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-[#1c2b1f] dark:text-white">{item.name}</p>
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-[#5f6f52] dark:text-[#9fb4ca]">{item.type || 'User'}</span>
          </div>
          {Array.isArray(item.meta) && item.meta.length ? (
            <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#9fb4ca]">{item.meta[0]}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function UserPrivacySettingsPage({ onBack, onOpenPage }) {
  return (
    <PageShell title="Privacy" onBack={onBack}>
      <div className="space-y-3">
        <Row icon={LockKeyhole} title="Change Password" onClick={() => onOpenPage('privacy-change-password')} />
        <p className="px-1 pt-3 text-sm font-bold uppercase tracking-[0.08em] text-[#5f6f52] dark:text-[#9fb4ca]">Interactions</p>
        <Row icon={MessageCircle} title="Comments" onClick={() => onOpenPage('privacy-comments')} />
        <Row icon={AtSign} title="Mentions" onClick={() => onOpenPage('privacy-mentions')} />
        <Row icon={Users} title="Following list" onClick={() => onOpenPage('privacy-following')} />
        <Row icon={Heart} title="Likes" onClick={() => onOpenPage('privacy-likes')} />
      </div>
    </PageShell>
  );
}

export function UserPrivacyChangePasswordPage({ onBack, onProceed }) {
  return (
    <PageShell title="Change Password" onBack={onBack}>
      <div className="rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] p-5 shadow-sm shadow-black/5 dark:border-[#2a4a6f] dark:bg-[#162842]">
        <p className="text-sm text-[#5f6f52] dark:text-[#b8d4e8]">Use KapIT password reset flow to set a new password securely.</p>
        <button
          type="button"
          onClick={onProceed}
          className="mt-4 inline-flex items-center rounded-xl bg-[#3a5a40] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]"
        >
          Continue
        </button>
      </div>
    </PageShell>
  );
}

export function UserPrivacyCommentsPage({ onBack, onOpenNotifications }) {
  return (
    <PageShell title="Comments" onBack={onBack}>
      <div className="rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] p-5 shadow-sm shadow-black/5 dark:border-[#2a4a6f] dark:bg-[#162842]">
        <p className="text-sm text-[#5f6f52] dark:text-[#b8d4e8]">Manage comment-related alerts from your notifications page.</p>
        <button type="button" onClick={onOpenNotifications} className="mt-4 inline-flex items-center rounded-xl border border-[#bfd0af] bg-[#eef6ee] px-4 py-2.5 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#e3eee3] dark:border-[#2a4a6f] dark:bg-[#183655] dark:text-[#dcecff] dark:hover:bg-[#1e3a5f]">
          Open Notifications
        </button>
      </div>
    </PageShell>
  );
}

export function UserPrivacyMentionsPage({ onBack, onOpenNotifications }) {
  return (
    <PageShell title="Mentions" onBack={onBack}>
      <div className="rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] p-5 shadow-sm shadow-black/5 dark:border-[#2a4a6f] dark:bg-[#162842]">
        <p className="text-sm text-[#5f6f52] dark:text-[#b8d4e8]">View mention updates and activity in your notifications page.</p>
        <button type="button" onClick={onOpenNotifications} className="mt-4 inline-flex items-center rounded-xl border border-[#bfd0af] bg-[#eef6ee] px-4 py-2.5 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#e3eee3] dark:border-[#2a4a6f] dark:bg-[#183655] dark:text-[#dcecff] dark:hover:bg-[#1e3a5f]">
          Open Notifications
        </button>
      </div>
    </PageShell>
  );
}

export function UserPrivacyFollowingPage({ onBack, items }) {
  return (
    <PageShell title="Following list" onBack={onBack}>
      <ListCard items={items} emptyText="You are not following any users or companies yet." />
    </PageShell>
  );
}

export function UserPrivacyLikesPage({ onBack, items }) {
  return (
    <PageShell title="Likes" onBack={onBack}>
      <ListCard items={items} emptyText="No one has reacted to your posts yet." />
    </PageShell>
  );
}
