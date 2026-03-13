import React, { useEffect, useMemo, useState } from 'react';
import CompanySidebar from '@components/company/CompanySidebar';
import CompanyHeader from '@components/company/CompanyHeader';
import { COMPANY_PATHS, navigate } from '@features/company/companyUtils';
import CompanyPremiumPopup from '@pages/Company/CompanyPremiumPopup';

const TITLES = {
  [COMPANY_PATHS.dashboard]: 'Dashboard',
  [COMPANY_PATHS.premium]: 'Premium',
  [COMPANY_PATHS.postJob]: 'Post a Job',
  [COMPANY_PATHS.jobs]: 'Manage Job Listings',
  [COMPANY_PATHS.applicants]: 'Applicants',
  [COMPANY_PATHS.search]: 'Search Developers',
  [COMPANY_PATHS.analytics]: 'Hiring Analytics',
  [COMPANY_PATHS.profile]: 'Company Profile',
};

export default function CompanyLayout({ pathname, user, onLogout, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const title = useMemo(() => TITLES[pathname] || 'Company', [pathname]);

  useEffect(() => {
    if (pathname === COMPANY_PATHS.premium) {
      setPremiumOpen(true);
      navigate(COMPANY_PATHS.dashboard);
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628] text-[#344e41] dark:text-white transition-colors duration-300">
      <CompanyHeader
        title={title}
        user={user}
        onLogout={onLogout}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />

      <CompanySidebar activePath={pathname} user={user} onOpenPremium={() => setPremiumOpen(true)} />

      <div className="min-h-screen pt-20 lg:pl-72">
        <main className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-6 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      <CompanyPremiumPopup isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />

      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white dark:bg-[#162842] shadow-2xl shadow-black/20 dark:shadow-black/50 transition-colors">
            <div className="p-4 flex items-center justify-between transition-colors">
              <div className="text-[#3a5a40] dark:text-white font-bold">Company Menu</div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-3 space-y-2">
              {Object.values(COMPANY_PATHS)
                .filter((path) => path !== COMPANY_PATHS.premium)
                .map((path) => (
                  <button
                    key={path}
                    type="button"
                    onClick={() => {
                      setMobileNavOpen(false);
                      navigate(path);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                      pathname === path
                        ? 'bg-[#eef6ee] dark:bg-[#1e3a5f] border-[#588157] dark:border-[#3ba9d6] text-[#3a5a40] dark:text-white'
                        : 'border-transparent text-[#344e41] dark:text-[#b8d4e8] hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] hover:border-[#a3b18a] dark:hover:border-[#2a4a6f]'
                    }`}
                  >
                    {TITLES[path] || path}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  onLogout?.();
                }}
                className="w-full text-left px-3 py-2 rounded-xl border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
