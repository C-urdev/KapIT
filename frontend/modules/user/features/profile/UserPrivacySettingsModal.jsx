import React from 'react';
import {
  ArrowLeft,
  ChevronRight,
  LockKeyhole,
  MessageCircle,
  AtSign,
  Users,
  Heart,
  Bookmark,
} from 'lucide-react';

function PrivacyRow({ icon: Icon, title, subtitle, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-[#eef6ee] dark:hover:bg-[#353c44]/55 sm:px-5"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf3e8] text-[#3a5a40] dark:bg-[#2b3138] dark:text-[#e9c86b]">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-snug text-[#1c2b1f] dark:text-white sm:text-[17px]">{title}</p>
          {subtitle ? <p className="mt-1 text-sm leading-snug text-[#5f6f52] dark:text-[#b3bcc5]">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        {value ? <span className="text-sm font-medium text-[#5f6f52] dark:text-[#d0d7dd]">{value}</span> : null}
        <ChevronRight className="h-5 w-5 text-[#7c8e76] dark:text-[#adb5be]" />
      </div>
    </button>
  );
}

function PrivacyGroup({ title, items }) {
  return (
    <section>
      {title ? <h3 className="px-1 pb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#5f6f52] dark:text-[#b3bcc5]">{title}</h3> : null}
      <div className="border-b border-[#d8e3cc] dark:border-[#444d57]">
        {items.map((item) => (
          <div key={item.title} className="border-t border-[#d8e3cc] dark:border-[#444d57]">
            <PrivacyRow {...item} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function UserPrivacySettingsModal({
  isOpen,
  onClose,
  onOpenChangePassword,
  onOpenComments,
  onOpenMentions,
  onOpenFollowingList,
  onOpenLikes,
  onOpenFavourite,
}) {
  if (!isOpen) return null;

  const privacyItems = [
    {
      icon: LockKeyhole,
      title: 'Change Password',
      onClick: onOpenChangePassword,
    },
  ];

  const interactionsItems = [
    {
      icon: MessageCircle,
      title: 'Comments',
      onClick: onOpenComments,
    },
    {
      icon: AtSign,
      title: 'Mentions',
      onClick: onOpenMentions,
    },
    {
      icon: Users,
      title: 'Following list',
      onClick: onOpenFollowingList,
    },
    {
      icon: Heart,
      title: 'Likes',
      onClick: onOpenLikes,
    },
    {
      icon: Bookmark,
      title: 'Favourite',
      onClick: onOpenFavourite,
    },
  ];

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm min-[420px]:p-6">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#f8fbf6] shadow-2xl dark:bg-[#121416]">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#d8e0cf] p-4 sm:p-5 dark:border-[#353c44]">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#344e41] transition-colors hover:bg-black/5 dark:text-white/80 dark:hover:bg-white/10"
            aria-label="Close privacy settings"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-[20px] font-bold text-[#1c2b1f] dark:text-white">Privacy</h2>
        </div>

        <main className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          <PrivacyGroup items={privacyItems} />
          <PrivacyGroup title="Interactions" items={interactionsItems} />
        </main>
      </div>
    </div>
  );
}
