import React, { useState } from 'react';
import {
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
      className="flex w-full items-center justify-between px-4 py-3 sm:py-4 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
    >
      <div className="flex items-center gap-4">
        <Icon className="h-6 w-6 text-[#3a5a40] dark:text-white/80" />
        <div>
          <p className="text-[17px] font-semibold text-[#1c2b1f] dark:text-white leading-snug">{title}</p>
          {subtitle && <p className="text-sm text-[#5f6f52] dark:text-white/60 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {rightElement || <ChevronRight className="h-5 w-5 text-[#8ea18c] dark:text-white/40" />}
    </button>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="px-4 pb-2 pt-5 sm:pt-6 bg-transparent">
      <h2 className="text-[17px] font-bold text-[#1c2b1f] dark:text-white/95">{title}</h2>
      {subtitle && <p className="mt-1 text-[13px] text-[#5f6f52] dark:text-white/60 leading-tight">{subtitle}</p>}
    </div>
  );
}

export default function UserSettingsPage({
  user,
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
            <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${theme === 'dark' ? 'bg-[#3ba9d6]' : 'bg-[#dce5d4]'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
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
    <div className="mx-auto flex w-full max-w-[min(100%,720px)] flex-col bg-white dark:bg-[#121212] animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out">
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-white/95 px-4 pt-6 pb-4 backdrop-blur-md dark:bg-[#121212]/95 sm:pt-8">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#5f6f52] dark:text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            className="w-full rounded-[20px] border-0 bg-[#f0f4ec] py-2 pl-10 pr-4 text-[15px] font-medium text-[#1c2b1f] outline-none placeholder:text-[#5f6f52] focus:ring-2 focus:ring-[#3a5a40]/20 dark:bg-[#202124] dark:text-white dark:placeholder:text-white/50 dark:focus:ring-white/10"
          />
        </div>
      </div>

      <div className="flex-1 pb-16 sm:pb-8">
        {filteredData.length > 0 ? (
          filteredData.map((section, idx) => (
            <React.Fragment key={idx}>
              <SectionHeading title={section.title} subtitle={section.subtitle} />
              <div className="bg-white dark:bg-[#121212]">
                {section.items.map((item, itemIdx) => (
                  <SettingsRow
                    key={itemIdx}
                    icon={item.icon}
                    title={item.title}
                    subtitle={item.subtitle}
                    onClick={item.onClick}
                    rightElement={item.rightElement}
                  />
                ))}
              </div>
            </React.Fragment>
          ))
        ) : (
          <div className="pt-20 text-center">
            <p className="text-[#5f6f52] dark:text-[#b8d4e8]">No settings match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
