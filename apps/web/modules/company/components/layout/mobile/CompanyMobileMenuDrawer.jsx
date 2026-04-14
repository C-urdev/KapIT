import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
} from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

function SectionRow({ icon: Icon, label, onClick, expanded = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between border-t border-[#d9dfcf] px-1 py-5 text-left transition-colors dark:border-white/8 text-[#344e41] hover:text-[#3a5a40] dark:text-white dark:hover:text-white/80"
    >
      <span className="flex items-center gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6ee] dark:bg-white/8">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-[1.05rem] font-medium">{label}</span>
      </span>
      <ChevronDown className={`h-5 w-5 text-[#5f6f52] transition-transform dark:text-white/70 ${expanded ? 'rotate-180' : ''}`} />
    </button>
  );
}

function ShortcutCard({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[7.25rem] flex-col items-start gap-4 rounded-[1.35rem] bg-[#f8fbf6] px-4 py-4 text-left text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:bg-[#34343a] dark:text-white dark:hover:bg-[#3b3b42]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#3a5a40] shadow-sm dark:bg-[#202126] dark:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-lg font-medium leading-tight">{label}</span>
    </button>
  );
}

export default function CompanyMobileMenuDrawer({ open, active, user, onClose, onHelp, onLogout }) {
  const companyName = user?.companyName || user?.username || 'Company';
  const profileImage = user?.profileImage || '';
  const initial = companyName.charAt(0).toUpperCase();
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!open || !active) {
      return;
    }

    setHelpSupportOpen(false);
    setSettingsOpen(false);
  }, [open, active]);

  if (!open) return null;

  return (
    <div className={`xl:hidden fixed inset-0 z-[70] transition-all duration-300 ease-out ${active ? 'bg-black/35 backdrop-blur-sm opacity-100 dark:bg-black/55' : 'bg-black/0 opacity-0'}`}>
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close company menu" />
      <aside
        className={`absolute left-0 top-0 bottom-0 flex w-[min(88vw,25rem)] flex-col overflow-hidden bg-[#dad7cd] shadow-2xl dark:bg-[#1f2125] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          active ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          <div className="rounded-[1.7rem] bg-white p-4 dark:bg-[#34343a]">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] text-xl font-bold text-white dark:bg-[#4a4d55]">
                {profileImage ? <img src={profileImage} alt={`${companyName} logo`} className="h-full w-full object-cover" /> : initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[1.15rem] font-semibold text-[#3a5a40] dark:text-white">{companyName}</p>
                <p className="mt-1 truncate text-sm text-[#5f6f52] dark:text-white/60">Company account</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f2] text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:bg-[#2a2d33] dark:text-white/85 dark:hover:bg-[#31343b]"
                aria-label="Close company menu"
              >
                <ChevronDown className="h-5 w-5 -rotate-90" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(COMPANY_PATHS.profile);
              }}
              className="mt-4 flex w-full items-center gap-3 rounded-[1.15rem] border-t border-[#d9dfcf] pt-4 text-left text-[#344e41] transition-colors hover:text-[#3a5a40] dark:border-white/8 dark:text-white/88 dark:hover:text-white"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6ee] dark:bg-white/8">
                <Settings className="h-5 w-5" />
              </span>
              <span className="text-lg font-medium">Open profile</span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <ShortcutCard
              icon={LayoutDashboard}
              label="Dashboard"
              onClick={() => {
                onClose();
                navigate(COMPANY_PATHS.dashboard);
              }}
            />
            <ShortcutCard
              icon={Briefcase}
              label="Manage Jobs"
              onClick={() => {
                onClose();
                navigate(COMPANY_PATHS.jobs);
              }}
            />
            <ShortcutCard
              icon={MessageCircle}
              label="Messages"
              onClick={() => {
                onClose();
                navigate(COMPANY_PATHS.messages);
              }}
            />
          </div>

          <div className="mt-6">
            <SectionRow
              icon={HelpCircle}
              label="Help and support"
              expanded={helpSupportOpen}
              onClick={() => setHelpSupportOpen((prev) => !prev)}
            />

            {helpSupportOpen ? (
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onHelp?.();
                  }}
                  className="flex w-full items-center gap-4 rounded-[1.2rem] bg-[#f8fbf6] px-4 py-4 text-left text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:bg-[#34343a] dark:text-white dark:hover:bg-[#3c4048]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#202126]">
                    <HelpCircle className="h-5 w-5" />
                  </span>
                  <span className="text-lg font-medium">Help Center</span>
                </button>
              </div>
            ) : null}

            <SectionRow
              icon={Settings}
              label="Settings and privacy"
              expanded={settingsOpen}
              onClick={() => setSettingsOpen((prev) => !prev)}
            />

            {settingsOpen ? (
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(COMPANY_PATHS.profile);
                  }}
                  className="flex w-full items-center gap-4 rounded-2xl bg-[#f8fbf6] px-4 py-3 text-left text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:bg-[#1e3a5f] dark:text-white dark:hover:bg-[#24405d]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#202126]">
                    <Settings className="h-5 w-5" />
                  </span>
                  <span className="text-lg font-medium">Settings</span>
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-[1.15rem] bg-white px-4 py-4 text-lg font-semibold text-[#d14343] transition-colors hover:bg-red-50 dark:bg-[#34343a] dark:text-white dark:hover:bg-[#3c4048]"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}
