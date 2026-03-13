import React from 'react';
import { Moon, Sun, LogOut, Menu } from 'lucide-react';
import { useTheme } from '@context/ThemeContext';

export default function CompanyHeader({ title, user, onLogout, onOpenMobileNav }) {
  const { theme, toggleTheme } = useTheme();
  const companyName = user?.companyName || user?.username || 'Company';
  const profileImage = user?.profileImage || '';
  const initial = companyName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#0a1628] transition-colors duration-300">
      <div className="h-1 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6]" />
      <div className="relative w-full h-20">
        <div className="hidden lg:flex absolute left-0 top-0 h-full w-72 items-center px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a]/60 dark:border-[#2a4a6f] flex items-center justify-center overflow-hidden relative">
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
        </div>

        <div className="w-full h-full lg:pl-72 px-6 sm:px-10 flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="lg:hidden p-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-[#3a5a40] dark:text-white truncate leading-tight">{title}</h1>
              <p className="text-xs text-[#4b5563] dark:text-[#b8d4e8] truncate leading-tight">
                Manage hiring, jobs, and candidates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-[#344e41]" />
              ) : (
                <Sun className="w-5 h-5 text-white" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#1e3a5f] transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#588157] dark:bg-[#3ba9d6] text-white overflow-hidden flex items-center justify-center font-bold">
                {profileImage ? (
                  <img src={profileImage} alt={`${companyName} logo`} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#3a5a40] dark:text-white truncate max-w-[200px]">{companyName}</div>
                <div className="text-xs text-[#4b5563] dark:text-[#b8d4e8]">Employer</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
