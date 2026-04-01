import React from 'react';
import { Menu, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';

export default function UserMobileTopbar({ setActiveNav, mobileMenuOpen, setMobileMenuOpen, onOpenSearch }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex w-full items-center justify-between gap-3" style={{ paddingTop: 'max(0rem, env(safe-area-inset-top))' }}>
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors shrink-0"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
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
          <span className="truncate text-xl sm:text-2xl font-bold text-[#3a5a40] dark:text-white leading-none">kapIT</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          aria-label="Search users and companies"
        >
          <Search className="w-5 h-5 text-[#344e41] dark:text-white" />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
        </button>
      </div>
    </div>
  );
}



