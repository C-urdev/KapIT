import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';

export default function CompanyMobileHeader({ title, user, onOpenMobileNav }) {
  const { theme, toggleTheme } = useTheme();
  const companyName = user?.companyName || user?.username || 'Company';
  const profileImage = user?.profileImage || '';
  const initial = companyName.charAt(0).toUpperCase();

  return (
    <div className="xl:hidden px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => window.location.assign('/company/dashboard')}
            className="text-xl font-bold text-[#3a5a40] dark:text-white shrink-0"
            aria-label="Go to dashboard"
          >
            kapIT
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#3a5a40] dark:text-white truncate leading-tight">{title}</h1>
            <p className="text-[11px] text-[#4b5563] dark:text-[#b8d4e8] truncate leading-tight">{companyName}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
          </button>
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-white/85 dark:bg-[#102235] px-3 py-2.5 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-[#588157] dark:bg-[#3ba9d6] text-white overflow-hidden flex items-center justify-center font-bold shrink-0">
          {profileImage ? <img src={profileImage} alt={`${companyName} logo`} className="w-full h-full object-cover" /> : initial}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#3a5a40] dark:text-white truncate">{companyName}</div>
          <div className="text-xs text-[#4b5563] dark:text-[#b8d4e8] truncate">Manage hiring from your phone</div>
        </div>
      </div>
    </div>
  );
}



