import React from 'react';
import { X, LogOut, HelpCircle, Settings } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

export default function CompanyMobileMenuDrawer({ open, active, user, onClose, onHelp, onLogout }) {
  const companyName = user?.companyName || user?.username || 'Company';
  const profileImage = user?.profileImage || '';
  const initial = companyName.charAt(0).toUpperCase();

  if (!open) return null;

  return (
    <div className={`xl:hidden fixed inset-0 z-50 transition-all duration-300 ease-out ${active ? 'bg-black/45 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0'}`}>
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close company menu" />
      <div className={`absolute left-0 top-0 bottom-0 flex w-80 max-w-[90vw] flex-col overflow-hidden border-r border-[#a3b18a] dark:border-[#2a4a6f] bg-white dark:bg-[#162842] shadow-2xl shadow-black/20 dark:shadow-black/50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
        <div className="flex items-center justify-between border-b border-[#d6d3c9] dark:border-[#2a4a6f] px-4 py-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#a3b18a]/60 bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#102235]">
              {profileImage ? (
                <img src={profileImage} alt={`${companyName} logo`} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-[#588157] text-lg font-bold text-white">
                  {initial}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-[#3a5a40] dark:text-white">{companyName}</div>
              <div className="truncate text-xs text-[#4b5563] dark:text-[#b8d4e8]">Company account</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Close company menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(COMPANY_PATHS.profile);
            }}
            className="w-full rounded-2xl px-4 py-3 text-left text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors flex items-center gap-3"
          >
            <Settings className="h-5 w-5 text-[#588157] dark:text-[#3ba9d6]" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onHelp?.();
            }}
            className="w-full rounded-2xl px-4 py-3 text-left text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors flex items-center gap-3"
          >
            <HelpCircle className="h-5 w-5 text-[#588157] dark:text-[#3ba9d6]" />
            <span>Help</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            className="w-full rounded-2xl px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-3"
          >
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
