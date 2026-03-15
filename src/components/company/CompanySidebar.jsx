import React from 'react';
import { LayoutDashboard, PlusCircle, Briefcase, Users, Search, BarChart3, Building2 } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@features/company/companyUtils';

const LINKS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: COMPANY_PATHS.dashboard },
  { key: 'post', label: 'Post Job', icon: PlusCircle, path: COMPANY_PATHS.postJob },
  { key: 'jobs', label: 'Manage Jobs', icon: Briefcase, path: COMPANY_PATHS.jobs },
  { key: 'applicants', label: 'Applicants', icon: Users, path: COMPANY_PATHS.applicants },
  { key: 'search', label: 'Search Developers', icon: Search, path: COMPANY_PATHS.search },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, path: COMPANY_PATHS.analytics },
  { key: 'profile', label: 'Company Profile', icon: Building2, path: COMPANY_PATHS.profile },
];


export default function CompanySidebar({ activePath, user, onOpenPremium }) {

  return (
    <aside className="hidden lg:flex fixed top-20 bottom-0 left-0 w-72 flex-col bg-white dark:bg-[#162842] transition-colors duration-300 z-40">
      <div className="h-1 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6]" />
      <nav className="px-5 py-5 space-y-2">
        {LINKS.map((link) => {
          const isActive = activePath === link.path;
          const Icon = link.icon;
          return (
            <button
              key={link.key}
              type="button"
              onClick={() => {
                navigate(link.path);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                isActive
                  ? 'bg-[#eef6ee] dark:bg-[#1e3a5f] border-[#588157] dark:border-[#3ba9d6] text-[#3a5a40] dark:text-white'
                  : 'bg-transparent border-transparent text-[#344e41] dark:text-[#b8d4e8] hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] hover:border-[#a3b18a] dark:hover:border-[#2a4a6f]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#4b5563] dark:text-[#7d9ab8]'}`} />
              <span className="text-sm font-semibold">{link.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
