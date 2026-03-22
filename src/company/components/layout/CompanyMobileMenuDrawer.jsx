import React from 'react';
import { X, LayoutDashboard, Briefcase, Users, Building2, PlusCircle, Search, MessageCircle } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

const ITEMS = [
  { path: COMPANY_PATHS.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { path: COMPANY_PATHS.postJob, label: 'Post a Job', icon: PlusCircle },
  { path: COMPANY_PATHS.jobs, label: 'Manage Job Listings', icon: Briefcase },
  { path: COMPANY_PATHS.applicants, label: 'Applicants', icon: Users },
  { path: COMPANY_PATHS.messages, label: 'Messages', icon: MessageCircle },
  { path: COMPANY_PATHS.search, label: 'Search Developers', icon: Search },
  { path: COMPANY_PATHS.profile, label: 'Company Profile', icon: Building2 },
];

export default function CompanyMobileMenuDrawer({ open, active, pathname, user, onClose }) {
  const companyName = user?.companyName || user?.username || 'Company';

  if (!open) return null;

  return (
    <div className={`xl:hidden fixed inset-0 z-50 transition-all duration-300 ease-out ${active ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0'}`}>
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close company menu" />
      <div className={`absolute left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white dark:bg-[#162842] shadow-2xl shadow-black/20 dark:shadow-black/50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
        <div className="p-5 space-y-5 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl shrink-0 bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a]/60 dark:border-[#2a4a6f] flex items-center justify-center overflow-hidden relative">
                <img
                  src="/kapit-logo.png"
                  alt="KapIT"
                  className="w-9 h-9 object-contain"
                  onLoad={(e) => {
                    const sibling = e.currentTarget.nextElementSibling;
                    if (sibling) sibling.style.display = 'none';
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-[#3a5a40] dark:text-white font-extrabold">K</span>
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-[#3a5a40] dark:text-white truncate">{companyName}</div>
                <div className="text-xs text-[#4b5563] dark:text-[#b8d4e8] truncate">Company dashboard</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
              aria-label="Close company menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="rounded-2xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#102235] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#7fd0ee]">Quick Access</div>
            <div className="mt-2 text-sm text-[#344e41] dark:text-[#dcecff]">Jump between hiring, job posting, applicants, and company profile tools.</div>
          </div>
        </div>
        <div className="px-4 pb-5 space-y-2.5">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  onClose();
                  navigate(item.path);
                }}
                className={`w-full text-left px-4 py-3 rounded-2xl border transition-colors flex items-center gap-3 ${
                  pathname === item.path
                    ? 'bg-[#eef6ee] dark:bg-[#1e3a5f] border-[#588157] dark:border-[#3ba9d6] text-[#3a5a40] dark:text-white'
                    : 'border-transparent text-[#344e41] dark:text-[#b8d4e8] hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] hover:border-[#a3b18a] dark:hover:border-[#2a4a6f]'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${pathname === item.path ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#4b5563] dark:text-[#7d9ab8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}



