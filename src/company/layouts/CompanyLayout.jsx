import React, { useEffect, useMemo, useState } from 'react';
import CompanySidebar from '@companyComponents/CompanySidebar';
import CompanyHeader from '@companyComponents/CompanyHeader';
import CompanyMobileMenuDrawer from '@companyComponents/layout/CompanyMobileMenuDrawer';
import { LayoutDashboard, Briefcase, Users, Building2, MessageCircle } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import CompanyPremiumPopup from '@companyPages/CompanyPremiumPopupPage';

const TITLES = {
  [COMPANY_PATHS.dashboard]: 'Dashboard',
  [COMPANY_PATHS.premium]: 'Premium',
  [COMPANY_PATHS.postJob]: 'Post a Job',
  [COMPANY_PATHS.postJobPayment]: 'Posting Payment',
  [COMPANY_PATHS.jobs]: 'Manage Job Listings',
  [COMPANY_PATHS.applicants]: 'Applicants',
  [COMPANY_PATHS.messages]: 'Messages',
  [COMPANY_PATHS.search]: 'Search Developers',
  [COMPANY_PATHS.profile]: 'Company Profile',
};

export default function CompanyLayout({ pathname, user, onLogout, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [mobileNavActive, setMobileNavActive] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('companySidebarCollapsed') === 'true';
  });
  const title = useMemo(() => TITLES[pathname] || 'Company', [pathname]);

  useEffect(() => {
    if (pathname === COMPANY_PATHS.premium) {
      setPremiumOpen(true);
      navigate(COMPANY_PATHS.dashboard);
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('companySidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (mobileNavOpen) {
      setMobileNavVisible(true);
      const frame = window.requestAnimationFrame(() => setMobileNavActive(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setMobileNavActive(false);
    const timeout = window.setTimeout(() => setMobileNavVisible(false), 260);
    return () => window.clearTimeout(timeout);
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628] text-[#344e41] dark:text-white transition-colors duration-300">
      <CompanyHeader
        title={title}
        user={user}
        onLogout={onLogout}
        onOpenMobileNav={() => setMobileNavOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <CompanySidebar
        activePath={pathname}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
      />

      <div className={`min-h-screen pt-[7.75rem] xl:pt-20 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? 'xl:pl-20' : 'xl:pl-72'}`}>
        <main className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 sm:py-6 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      <CompanyPremiumPopup isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />

      <CompanyMobileMenuDrawer
        open={mobileNavVisible}
        active={mobileNavActive}
        pathname={pathname}
        user={user}
        onClose={() => setMobileNavOpen(false)}
      />

      <CompanyMobileBottomNav pathname={pathname} />
    </div>
  );
}

const MOBILE_NAV_ITEMS = [
  { path: COMPANY_PATHS.dashboard, label: 'Home', icon: LayoutDashboard },
  { path: COMPANY_PATHS.jobs, label: 'Jobs', icon: Briefcase },
  { path: COMPANY_PATHS.messages, label: 'Messages', icon: MessageCircle },
  { path: COMPANY_PATHS.applicants, label: 'Applicants', icon: Users },
  { path: COMPANY_PATHS.profile, label: 'Profile', icon: Building2 },
];

function CompanyMobileBottomNav({ pathname }) {
  if (pathname === COMPANY_PATHS.postJobPayment) {
    return null;
  }

  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#a3b18a] dark:border-[#2a4a6f] bg-white/95 dark:bg-[#162842]/95 backdrop-blur-md">
      <div className="grid h-16 grid-cols-5 px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors ${
                active
                  ? 'text-[#588157] dark:text-[#3ba9d6]'
                  : 'text-[#344e41] dark:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}



