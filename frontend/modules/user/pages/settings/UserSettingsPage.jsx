import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Book,
  Briefcase,
  ChevronRight,
  FileCheck2,
  Globe,
  HelpCircle,
  Moon,
  Search,
  Shield,
  UserCircle,
} from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';

function SettingsRow({ icon: Icon, title, onClick, rightElement, desktop = false }) {
  if (desktop) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex min-h-[52px] w-full items-center justify-between rounded-md px-2 text-left transition-colors duration-150 hover:bg-[var(--user-surface-selected)]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--user-primary)] transition-colors duration-150 group-hover:bg-[var(--user-primary-soft)]">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <p className="truncate text-sm font-medium text-[var(--user-text-strong)]">{title}</p>
        </div>
        {rightElement || <ChevronRight className="h-4 w-4 shrink-0 text-[var(--user-text-muted)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--user-primary)]" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[#f3f7f0] max-[360px]:px-3 max-[360px]:py-3 dark:hover:bg-[#2b333b] sm:px-5 sm:py-4 xl:min-h-[52px] xl:rounded-md xl:px-4 xl:py-3 xl:hover:bg-[var(--user-surface-selected)]"
    >
      <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#d0d7dd] sm:h-6 sm:w-6 xl:h-[18px] xl:w-[18px] xl:text-[var(--user-primary)]" />
        <p className="text-[16px] font-semibold text-[#1c2b1f] leading-snug dark:text-white sm:text-[17px] xl:text-sm xl:text-[var(--user-text-strong)]">{title}</p>
      </div>
      {rightElement || <ChevronRight className="h-5 w-5 text-[#7c8e76] dark:text-[#adb5be]" />}
    </button>
  );
}

function SectionHeading({ title, isFirst = false }) {
  return (
    <div className={`px-4 pb-2 ${isFirst ? 'pt-3' : 'pt-5 sm:pt-6'} sm:px-6`}>
      <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#5f6f52] dark:text-[#b3bcc5] xl:text-xs xl:font-semibold xl:tracking-[0.06em] xl:text-[var(--user-text-muted)]">{title}</h2>
    </div>
  );
}

function DesktopSectionHeading({ title }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--user-text-muted)]">
      {title}
    </h2>
  );
}

export default function UserSettingsPage({
  user: _user,
  onBack,
  onOpenAccountDetails,
  onOpenCareerPreferences,
  onOpenPrivacySettings,
  onOpenSavedJobs,
  onOpenApplications,
  onOpenNotifications,
  onOpenFaq,
  onOpenTerms,
  onOpenPrivacy: _onOpenPrivacy,
  onOpenCookies,
}) {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const settingsData = [
    {
      title: "Account",
      items: [
        { icon: UserCircle, title: "Account", onClick: onOpenAccountDetails },
        { icon: Briefcase, title: "Career Preferences", onClick: onOpenCareerPreferences },
        { icon: Shield, title: "Privacy", onClick: onOpenPrivacySettings },
      ]
    },
    {
      title: "Preferences",
      items: [
        { 
          icon: Moon, 
          title: "Dark mode", 
          onClick: toggleTheme,
          rightElement: (
            <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 ease-out focus:outline-none xl:h-5 xl:w-9 xl:border xl:border-[var(--user-border)] ${theme === 'dark' ? 'bg-[#6f9b74] xl:bg-[var(--user-primary)]' : 'bg-[#c8d5b9] xl:bg-[var(--user-border-strong)]'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-150 ease-out xl:h-4 xl:w-4 ${theme === 'dark' ? 'translate-x-5 xl:translate-x-4' : 'translate-x-0'}`} />
            </div>
          )
        },
        { icon: Bell, title: "Notifications", onClick: onOpenNotifications }
      ]
    },
    {
      title: "Your activity",
      items: [
        { icon: Briefcase, title: "Saved Jobs", onClick: onOpenSavedJobs },
        { icon: FileCheck2, title: "Applications", onClick: onOpenApplications }
      ]
    },
    {
      title: "Community Standards and legal policies",
      items: [
        { icon: Book, title: "Terms of Service", onClick: onOpenTerms },
        { icon: Globe, title: "Cookies policy", onClick: onOpenCookies },
        { icon: HelpCircle, title: "Frequently Asked Questions", onClick: onOpenFaq }
      ]
    }
  ];

  const filteredData = settingsData.map(section => {
    const query = searchQuery.toLowerCase();
    const filteredItems = section.items.filter(item => 
      item.title.toLowerCase().includes(query)
    );
    return { ...section, items: filteredItems };
  }).filter(section => section.items.length > 0 || section.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,1120px)] flex-col bg-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pt-4 sm:px-5 sm:pb-10 sm:pt-6 lg:px-6 xl:max-w-[1040px] xl:px-0 xl:pb-8 xl:pt-6">
      <div className="hidden xl:block">
        <header className="mb-5 flex items-start gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[var(--user-text-muted)] transition-colors duration-150 hover:bg-[var(--user-surface)] hover:text-[var(--user-text-strong)]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="user-workspace-page-title mt-1">Settings</h1>
            <p className="mt-1 text-sm text-[var(--user-text-muted)]">Manage your profile, preferences, privacy, and support options.</p>
          </div>
        </header>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--user-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            className="h-11 w-full rounded-md border border-[var(--user-border)] bg-[var(--user-surface)] pl-10 pr-4 text-sm text-[var(--user-text-strong)] outline-none transition-colors duration-150 placeholder:text-[var(--user-text-muted)] focus:border-[var(--user-primary)] focus:ring-2 focus:ring-[var(--user-primary-soft)]"
          />
        </div>

        <div className="space-y-7">
          {filteredData.length > 0 ? (
            filteredData.map((section, idx) => (
              <section key={idx}>
                <DesktopSectionHeading title={section.title} />
                <div className="mt-3 space-y-1">
                  {section.items.map((item, itemIdx) => (
                    <SettingsRow
                      key={itemIdx}
                      icon={item.icon}
                      title={item.title}
                      onClick={item.onClick}
                      rightElement={item.rightElement}
                      desktop
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-[var(--user-text-muted)]">No settings match your search.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 sm:gap-4 xl:hidden">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="mt-1 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#9caf97] bg-[#d9ddcf] text-[#344e41] transition-colors hover:bg-[#dde2d4] hover:border-[#8ea488] dark:border-[#5e8b67] dark:bg-transparent dark:text-white dark:hover:bg-[#353c44] xl:h-10 xl:w-10 xl:rounded-md xl:border-transparent xl:bg-transparent xl:text-[var(--user-text-muted)] xl:hover:border-[var(--user-border)] xl:hover:bg-[var(--user-surface)] xl:hover:text-[var(--user-text-strong)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="user-desktop-flat-surface min-w-0 flex-1 overflow-hidden rounded-2xl border border-[#a8bc94] bg-white shadow-sm shadow-black/5 dark:border-[#3a434d] dark:bg-[#1f2429]">
          <div className="px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
            <h1 className="text-[28px] font-bold text-[#1c2b1f] dark:text-white xl:mt-1 xl:text-3xl xl:font-semibold xl:text-[var(--user-text-strong)]">Settings</h1>
            <p className="mt-1 hidden text-sm text-[var(--user-text-muted)] xl:block">Manage your profile, preferences, privacy, and support options.</p>
            <div className="relative mt-3">
              <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5f6f52] dark:text-[#a8b1ba]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings"
                className="w-full rounded-[20px] border border-[#bfd0af] bg-[#f8fbf6] py-2.5 pl-10 pr-4 text-[15px] font-medium text-[#1c2b1f] outline-none placeholder:text-[#6b7c6a] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#444d57] dark:bg-[#22272b] dark:text-white dark:placeholder:text-[#9da7b1] dark:focus:ring-[#6f9b74]/25 xl:h-10 xl:rounded-md xl:border-[var(--user-border)] xl:bg-[var(--user-surface-subtle)] xl:py-2 xl:text-sm xl:text-[var(--user-text-strong)] dark:xl:bg-[var(--user-surface-subtle)]"
              />
            </div>
          </div>

          <div className="flex-1 pb-3 pt-1">
            {filteredData.length > 0 ? (
              filteredData.map((section, idx) => (
                <section key={idx}>
                  <SectionHeading title={section.title} isFirst={idx === 0} />
                  <div className="space-y-1 px-2 pb-1 sm:px-3">
                    {section.items.map((item, itemIdx) => (
                      <SettingsRow
                        key={itemIdx}
                        icon={item.icon}
                        title={item.title}
                        onClick={item.onClick}
                        rightElement={item.rightElement}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="px-4 py-10 text-center">
                <p className="text-[#5f6f52] dark:text-[#d0d7dd]">No settings match your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
