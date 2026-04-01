import React, { useEffect, useRef, useState } from 'react';
import { LogOut, Moon, PanelLeftClose, PanelLeftOpen, Settings, Sun, Bell } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

export default function CompanyDesktopHeader({ title, user, onLogout, sidebarCollapsed, onToggleSidebarCollapsed, unreadNotificationCount = 0 }) {
  const { theme, toggleTheme } = useTheme();
  const companyName = user?.companyName || user?.username || 'Company';
  const profileImage = user?.profileImage || '';
  const initial = companyName.charAt(0).toUpperCase();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={`hidden xl:grid h-20 items-center transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? 'grid-cols-[4.5rem_minmax(0,1fr)]' : 'grid-cols-[18rem_minmax(0,1fr)]'}`}>
      <div className={`h-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-6'}`}>
        {sidebarCollapsed ? (
          <div className="w-10 h-10 rounded-xl shrink-0 bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a]/60 dark:border-[#2a4a6f] flex items-center justify-center overflow-hidden relative">
            <img
              src="/kapit-logo.png"
              alt="KapIT"
              className="w-8 h-8 object-contain"
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
        ) : (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl shrink-0 bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a]/60 dark:border-[#2a4a6f] flex items-center justify-center overflow-hidden relative">
              <img
                src="/kapit-logo.png"
                alt="KapIT"
                className="w-8 h-8 object-contain"
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
              <div className="text-base font-bold text-[#3a5a40] dark:text-white leading-tight truncate">KapIT</div>
              <div className="text-xs text-[#4b5563] dark:text-[#b8d4e8] leading-tight truncate">Company Dashboard</div>
            </div>
          </div>
        )}
      </div>

      <div className="h-full px-4 sm:px-6 xl:px-10 flex items-center justify-between gap-4 min-w-0">
        <div className="min-w-0 pr-2">
          <h1 className="text-lg xl:text-xl font-bold text-[#3a5a40] dark:text-white truncate leading-tight">{title}</h1>
          <p className="hidden 2xl:block text-xs text-[#4b5563] dark:text-[#b8d4e8] truncate leading-tight">Manage hiring, jobs, and candidates</p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.notifications)}
            className="relative p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5 text-[#344e41] dark:text-white" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#588157] dark:bg-[#3ba9d6]" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
          </button>

          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#1e3a5f] transition-colors hover:bg-[#eef6ee] dark:hover:bg-[#24405d]"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-[#588157] dark:bg-[#3ba9d6] text-white overflow-hidden flex items-center justify-center font-bold shrink-0">
                {profileImage ? <img src={profileImage} alt={`${companyName} logo`} className="w-full h-full object-cover" /> : initial}
              </div>
              <div className="hidden 2xl:block min-w-0 text-left">
                <div className="text-sm font-semibold text-[#3a5a40] dark:text-white truncate max-w-[200px]">{companyName}</div>
                <div className="text-xs text-[#4b5563] dark:text-[#b8d4e8]">Employer</div>
              </div>

            </button>

            {profileMenuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-64 rounded-2xl border border-[#a3b18a] bg-white p-2 shadow-[0_20px_50px_rgba(58,90,64,0.16)] dark:border-[#2a4a6f] dark:bg-[#162842] dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                <div className="mb-2 flex items-center gap-3 rounded-xl bg-[#f8fbf6] px-3 py-3 dark:bg-[#102235]">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#588157] font-bold text-white dark:bg-[#3ba9d6]">
                    {profileImage ? <img src={profileImage} alt={`${companyName} logo`} className="h-full w-full object-cover" /> : initial}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#3a5a40] dark:text-white">{companyName}</div>
                    <div className="text-xs text-[#4b5563] dark:text-[#b8d4e8]">Employer</div>
                  </div>
                </div>

                <ProfileMenuButton
                  icon={<Settings className="h-4 w-4" />}
                  label="Settings"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate(COMPANY_PATHS.profile);
                  }}
                />
                <ProfileMenuButton
                  icon={sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                  label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onToggleSidebarCollapsed?.();
                  }}
                />
                <ProfileMenuButton
                  icon={<LogOut className="h-4 w-4" />}
                  label="Log out"
                  tone="danger"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onLogout?.();
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileMenuButton({ icon, label, onClick, tone = 'default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${tone === 'danger' ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30' : 'text-[#344e41] hover:bg-[#f5f5f2] dark:text-white dark:hover:bg-[#1e3a5f]'}`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
