import React from 'react';
import { Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

export default function CompanyDesktopHeader({ title, user, sidebarCollapsed, unreadNotificationCount = 0 }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`hidden xl:grid h-20 items-center transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? 'grid-cols-[4.5rem_minmax(0,1fr)]' : 'grid-cols-[18rem_minmax(0,1fr)]'}`}>
      <div className={`h-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-6'}`}>
        {sidebarCollapsed ? (
          <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden relative">
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
            <div className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden relative">
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
            </div>
          </div>
        )}
      </div>

      <div className="h-full px-4 sm:px-6 xl:px-10 flex items-center justify-between gap-4 min-w-0">
        <div className="min-w-0 pr-2">
          <h1 className="text-lg xl:text-xl font-bold text-[#3a5a40] dark:text-white truncate leading-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(COMPANY_PATHS.notifications)}
            className="relative p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5 text-[#344e41] dark:text-white" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#588157] dark:bg-[#6f9b74]" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
          </button>

        </div>
      </div>
    </div>
  );
}
