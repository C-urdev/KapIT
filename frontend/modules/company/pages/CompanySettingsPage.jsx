import React, { useMemo, useState } from 'react';
import { ArrowLeft, Bell, Briefcase, ChevronRight, Globe, Moon, Search } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

function SettingsRow({ icon: Icon, title, onClick, rightElement }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[#f3f7f0] max-[360px]:px-3 max-[360px]:py-3 dark:hover:bg-[#2b333b] sm:px-5 sm:py-4"
    >
      <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#d0d7dd] sm:h-6 sm:w-6" />
        <p className="text-[16px] font-semibold leading-snug text-[#1c2b1f] dark:text-white sm:text-[17px]">{title}</p>
      </div>
      {rightElement || <ChevronRight className="h-5 w-5 text-[#7c8e76] dark:text-[#adb5be]" />}
    </button>
  );
}

function SectionHeading({ title, isFirst = false }) {
  return (
    <div className={`px-4 pb-2 ${isFirst ? 'pt-3' : 'pt-5 sm:pt-6'} sm:px-6`}>
      <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#5f6f52] dark:text-[#b3bcc5]">{title}</h2>
    </div>
  );
}

export default function CompanySettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const settingsData = useMemo(
    () => [
      {
        title: 'Company account',
        items: [
          { icon: Briefcase, title: 'Company information', onClick: () => navigate(COMPANY_PATHS.settingsCompanyInfo) },
        ],
      },
      {
        title: 'Workspace',
        items: [
          { icon: Globe, title: 'Public profile', onClick: () => navigate(COMPANY_PATHS.publicProfile) },
        ],
      },
      {
        title: 'Preferences',
        items: [
          {
            icon: Moon,
            title: 'Dark mode',
            onClick: toggleTheme,
            rightElement: (
              <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 ease-out ${theme === 'dark' ? 'bg-[#6f9b74]' : 'bg-[#c8d5b9]'}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-150 ease-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            ),
          },
          { icon: Bell, title: 'Notifications', onClick: () => navigate(COMPANY_PATHS.settingsNotifications) },
        ],
      },
    ],
    [theme, toggleTheme]
  );

  const query = searchQuery.toLowerCase();
  const filteredData = settingsData
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.title.toLowerCase().includes(query)),
    }))
    .filter((section) => section.items.length > 0 || section.title.toLowerCase().includes(query));

  return (
    <div className="company-workspace-page mx-auto flex w-full max-w-[min(100%,1120px)] flex-col bg-transparent px-4 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] pt-4 sm:px-5 sm:pb-10 sm:pt-6 lg:px-6 xl:px-0 xl:pt-0">
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => navigate(COMPANY_PATHS.dashboard)}
          aria-label="Go back"
          className="company-workspace-secondary-button mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="company-workspace-panel min-w-0 flex-1 overflow-hidden">
          <div className="px-4 pb-3 pt-4 sm:px-6 sm:pt-5">
            <h1 className="company-workspace-page-title">Settings</h1>
            <div className="relative mt-3">
            <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5f6f52] dark:text-[#a8b1ba]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search settings"
              className="company-workspace-control w-full py-2.5 pl-10 pr-4 text-[15px] font-medium outline-none placeholder:text-[var(--workspace-text-muted)]"
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
