import React, { useEffect, useMemo, useState } from 'react';
import CompanySidebar from '@companyComponents/CompanySidebar';
import CompanyHeader from '@companyComponents/CompanyHeader';
import CompanyMobileMenuDrawer from '@companyComponents/layout/mobile/CompanyMobileMenuDrawer';
import { LayoutDashboard, Briefcase, MessageCircle } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import CompanyPremiumPopup from '@companyPages/CompanyPremiumPopupPage';
import { getUnreadNotificationCount } from '@sharedServices/notificationsService';

const TITLES = {
  [COMPANY_PATHS.dashboard]: 'Dashboard',
  [COMPANY_PATHS.help]: 'Help',
  [COMPANY_PATHS.premium]: 'Premium',
  [COMPANY_PATHS.postJob]: 'Post a Job',
  [COMPANY_PATHS.postJobPayment]: 'Posting Payment',
  [COMPANY_PATHS.jobs]: 'Manage Job Listings',
  [COMPANY_PATHS.applicants]: 'Applicants',
  [COMPANY_PATHS.messages]: 'Messages',
  [COMPANY_PATHS.notifications]: 'Notifications',
  [COMPANY_PATHS.search]: 'Search Developers',
  [COMPANY_PATHS.settings]: 'Settings',
  [COMPANY_PATHS.settingsCompanyInfo]: 'Company Information',
  [COMPANY_PATHS.settingsNotifications]: 'Notification Settings',
  [COMPANY_PATHS.profile]: 'Company Profile',
  [COMPANY_PATHS.publicProfile]: 'Public Profile',
};

export default function CompanyLayout({ pathname, user, onLogout, onHelp, children, messagesThreadOpen = false }) {
  const isMessagesPage = pathname === COMPANY_PATHS.messages;
  const hideMobileChromeForThread = isMessagesPage && messagesThreadOpen;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [mobileNavActive, setMobileNavActive] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const title = useMemo(() => TITLES[pathname] || 'Company', [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSidebarCollapsed(window.localStorage.getItem('companySidebarCollapsed') === 'true');
  }, []);

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

  useEffect(() => {
    let mounted = true;

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        if (mounted) {
          setUnreadNotificationCount(count);
        }
      } catch {
        if (mounted) {
          setUnreadNotificationCount(0);
        }
      }
    };

    loadUnreadCount();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname === COMPANY_PATHS.notifications) {
      setUnreadNotificationCount(0);
    }
  }, [pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#dad7cd] dark:bg-[#121416] text-[#344e41] dark:text-white transition-colors duration-300">
      <CompanyHeader
        title={title}
        user={user}
        onLogout={onLogout}
        onHelp={onHelp}
        mobileHidden={hideMobileChromeForThread}
        onOpenMobileNav={() => setMobileNavOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebarCollapsed={() => setSidebarCollapsed((value) => !value)}
        unreadNotificationCount={unreadNotificationCount}
      />

      <CompanySidebar
        activePath={pathname}
        collapsed={sidebarCollapsed}
        user={user}
        onHelp={onHelp}
        onLogout={onLogout}
        onOpenPricing={() => setPremiumOpen(true)}
        onToggleSidebarCollapsed={() => setSidebarCollapsed((value) => !value)}
        unreadNotificationCount={unreadNotificationCount}
      />

      <div
        className={`${
          isMessagesPage
            ? (hideMobileChromeForThread
              ? 'h-[100dvh] pt-0 pb-0 xl:h-[100dvh] xl:pt-[5.125rem] xl:pb-0'
              : 'h-[100dvh] pt-16 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pt-16 sm:pb-[calc(4rem+env(safe-area-inset-bottom))] xl:h-[100dvh] xl:pt-[5.125rem] xl:pb-0')
            : 'min-h-screen pt-[5.5rem] sm:pt-[6rem] xl:pt-20'
        } transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${sidebarCollapsed ? 'xl:pl-20' : 'xl:pl-72'}`}
      >
        <main
          className={`mx-auto w-full max-w-[min(100%,1800px)] ${
            isMessagesPage
              ? 'h-full min-h-0 overflow-hidden px-0 py-2 sm:px-3 sm:py-3 xl:px-4 xl:py-4'
              : 'px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-4 sm:py-6 pb-24 md:pb-10'
          }`}
          style={isMessagesPage ? undefined : { paddingBottom: 'max(6rem, calc(4.5rem + env(safe-area-inset-bottom)))' }}
        >
          {children}
        </main>
      </div>

      <CompanyPremiumPopup isOpen={premiumOpen} onClose={() => setPremiumOpen(false)} />

      <CompanyMobileMenuDrawer
        open={mobileNavVisible}
        active={mobileNavActive}
        user={user}
        onHelp={onHelp}
        onLogout={onLogout}
        onClose={() => setMobileNavOpen(false)}
      />

      <CompanyMobileBottomNav pathname={pathname} unreadNotificationCount={unreadNotificationCount} hidden={hideMobileChromeForThread} />
    </div>
  );
}

const MOBILE_NAV_ITEMS = [
  { path: COMPANY_PATHS.dashboard, label: 'Home', icon: LayoutDashboard },
  { path: COMPANY_PATHS.jobs, label: 'Jobs', icon: Briefcase },
  { path: COMPANY_PATHS.messages, label: 'Messages', icon: MessageCircle },
];

function CompanyMobileBottomNav({ pathname, hidden = false }) {
  if (pathname === COMPANY_PATHS.postJobPayment) {
    return null;
  }

  return (
    <div className={`xl:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#a3b18a] dark:border-[#444d57] bg-[#f8fbf6]/95 dark:bg-[#22272b]/95 backdrop-blur-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
      hidden ? 'translate-y-full' : 'translate-y-0'
    }`}>
      <div className="grid h-[3.6rem] grid-cols-3 gap-1 px-2 pt-0.5" style={{ paddingBottom: 'max(0.2rem, env(safe-area-inset-bottom))' }}>
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                active
                  ? 'bg-[#eef6ee] text-[#588157] shadow-sm shadow-[#588157]/10 dark:bg-[#353c44] dark:text-[#6f9b74] -translate-y-0.5'
                  : 'text-[#344e41] dark:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? 'scale-105' : 'scale-100'}`} />
              <span className={`text-[11px] font-medium transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? 'translate-y-0' : 'translate-y-0.5'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
