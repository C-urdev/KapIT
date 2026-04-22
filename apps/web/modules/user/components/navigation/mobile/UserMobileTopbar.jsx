import React from 'react';
import { Menu, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';

export default function UserMobileTopbar({ setActiveNav, mobileMenuOpen, setMobileMenuOpen, onOpenSearch }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex w-full items-center justify-between gap-3 py-1.5" style={{ paddingTop: 'max(0.45rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex h-11 w-11 items-center justify-center text-[#344e41] transition-colors hover:text-[#3a5a40] dark:text-white dark:hover:text-[#d0d7dd] shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('home')}
          className="flex min-w-0 items-center gap-2 shrink"
          aria-label="Go to home"
        >
          <img
            src="/kapit-logo.png"
            alt="KapIT"
            className="h-7 w-7 sm:h-8 sm:w-8 object-contain shrink-0"
          />
          <span className="truncate text-[1.7rem] font-black tracking-[-0.05em] text-[#3a5a40] dark:text-white leading-none">kapIT</span>
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex h-11 w-11 items-center justify-center text-[#344e41] transition-colors hover:text-[#3a5a40] dark:text-white dark:hover:text-[#d0d7dd]"
          aria-label="Search users and companies"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-11 w-11 items-center justify-center text-[#344e41] transition-colors hover:text-[#3a5a40] dark:text-white dark:hover:text-[#d0d7dd]"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}



