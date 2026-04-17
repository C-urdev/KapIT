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

function SettingsRow({ icon: Icon, title, subtitle, onClick, rightElement }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[#eef6ee] dark:hover:bg-[#1e3a5f]/55 sm:py-4"
    >
      <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#b8d4e8] sm:h-6 sm:w-6" />
        <div>
          <p className="text-[16px] font-semibold text-[#1c2b1f] leading-snug dark:text-white sm:text-[17px]">{title}</p>
          {subtitle && <p className="text-sm leading-snug text-[#5f6f52] dark:text-[#9fb4ca]">{subtitle}</p>}
        </div>
      </div>
      {rightElement || <ChevronRight className="h-5 w-5 text-[#7c8e76] dark:text-[#7d9ab8]" />}
    </button>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="px-1 pb-2 pt-5 sm:pt-6">
      <h2 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-[13px] leading-tight text-[#5f6f52] dark:text-[#9fb4ca]">{subtitle}</p>}
    </div>
  );
}

export default function UserSettingsPage({
  user,
  onBack,
  onOpenAccountDetails,
  onOpenSavedJobs,
  onOpenApplications,
  onOpenNotifications,
  onOpenFaq,
  onOpenTerms,
  onOpenPrivacy,
  onOpenCookies,
}) {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const settingsData = [
    {
      title: "Your account",
      subtitle: "Manage your personal details, career preferences, and address.",
      items: [
        { icon: UserCircle, title: "Account Details", subtitle: "Name, contact info, personal details", onClick: onOpenAccountDetails },
        { icon: Briefcase, title: "Career Preferences", subtitle: "Preferred role and IT specialization", onClick: onOpenAccountDetails }
      ]
    },
    {
      title: "Preferences",
      subtitle: "Customize your experience on KapIT.",
      items: [
        { 
          icon: Moon, 
          title: "Dark mode", 
          subtitle: theme === 'dark' ? 'On' : 'Off', 
          onClick: toggleTheme,
          rightElement: (
            <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 ease-out focus:outline-none ${theme === 'dark' ? 'bg-[#3ba9d6]' : 'bg-[#c8d5b9]'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-150 ease-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          )
        },
        { icon: Bell, title: "Notifications", subtitle: "Alerts and push settings", onClick: onOpenNotifications }
      ]
    },
    {
      title: "Your activity",
      subtitle: "Review your saved items and job applications.",
      items: [
        { icon: Briefcase, title: "Saved Jobs", onClick: onOpenSavedJobs },
        { icon: FileCheck2, title: "Applications", onClick: onOpenApplications }
      ]
    },
    {
      title: "Community Standards and legal policies",
      subtitle: "",
      items: [
        { icon: Book, title: "Terms of Service", onClick: onOpenTerms },
        { icon: Shield, title: "Privacy Policy", onClick: onOpenPrivacy },
        { icon: Globe, title: "Cookies policy", onClick: onOpenCookies },
        { icon: HelpCircle, title: "Frequently Asked Questions", onClick: onOpenFaq }
      ]
    }
  ];

  const filteredData = settingsData.map(section => {
    const query = searchQuery.toLowerCase();
    const filteredItems = section.items.filter(item => 
      item.title.toLowerCase().includes(query) || 
      (item.subtitle && item.subtitle.toLowerCase().includes(query))
    );
    return { ...section, items: filteredItems };
  }).filter(section => section.items.length > 0 || section.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="mx-auto flex w-full max-w-[min(100%,760px)] flex-col bg-transparent px-4 pb-16 pt-4 sm:px-5 sm:pb-8 sm:pt-6">
      <div className="sticky top-0 z-10 pb-3 pt-1">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:hover:bg-[#1e3a5f]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5f6f52] dark:text-[#8fb2cf]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            className="w-full rounded-[20px] border border-[#bfd0af] bg-[#f8fbf6] py-2.5 pl-10 pr-4 text-[15px] font-medium text-[#1c2b1f] outline-none placeholder:text-[#6b7c6a] focus:ring-2 focus:ring-[#588157]/25 dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:placeholder:text-[#8ba9c0] dark:focus:ring-[#3ba9d6]/25"
          />
        </div>
      </div>

      <div className="flex-1">
        {filteredData.length > 0 ? (
          filteredData.map((section, idx) => (
            <section key={idx}>
              <SectionHeading title={section.title} subtitle={section.subtitle} />
              <div className="overflow-hidden rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] shadow-sm shadow-black/5 dark:border-[#2a4a6f] dark:bg-[#162842]">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className={itemIdx > 0 ? 'border-t border-[#d8e3cc] dark:border-[#2a4a6f]' : ''}>
                    <SettingsRow
                      icon={item.icon}
                      title={item.title}
                      subtitle={item.subtitle}
                      onClick={item.onClick}
                      rightElement={item.rightElement}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] px-4 py-10 text-center shadow-sm shadow-black/5 dark:border-[#2a4a6f] dark:bg-[#162842]">
            <p className="text-[#5f6f52] dark:text-[#b8d4e8]">No settings match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
