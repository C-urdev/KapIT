import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

export default function CompanyMobileHeader({ title, user, onOpenMobileNav }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="xl:hidden px-3 sm:px-4 py-3" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="inline-flex h-10 w-10 items-center justify-center text-[#344e41] dark:text-white hover:text-[#3a5a40] dark:hover:text-[#b8d4e8] transition-colors shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.dashboard)}
            className="flex items-center gap-2 shrink-0 min-w-0"
            aria-label="Go to dashboard"
          >
            <img
              src="/kapit-logo.png"
              alt="KapIT"
              className="h-7 w-7 sm:h-8 sm:w-8 object-contain shrink-0"
            />
            <span className="text-xl sm:text-2xl font-bold text-[#3a5a40] dark:text-white leading-none">kapIT</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center text-[#344e41] dark:text-white hover:text-[#3a5a40] dark:hover:text-[#b8d4e8] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
}




