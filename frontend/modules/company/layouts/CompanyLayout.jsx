import React, { useEffect, useMemo, useState } from 'react';
import CompanySidebar from '@companyComponents/CompanySidebar';
import CompanyHeader from '@companyComponents/CompanyHeader';
import CompanyMobileMenuDrawer from '@companyComponents/layout/mobile/CompanyMobileMenuDrawer';
import { LayoutDashboard, Briefcase, MessageCircle } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import { getUnreadNotificationCount } from '@sharedServices/notificationsService';
import PillNavButton from '@sharedComponents/navigation/PillNavButton';

const TITLES = {
  [COMPANY_PATHS.dashboard]: 'Dashboard',
  [COMPANY_PATHS.help]: 'Help',
  [COMPANY_PATHS.premium]: 'Premium',
  [COMPANY_PATHS.postJob]: 'Post a Job',
  [COMPANY_PATHS.postJobPreAssessment]: 'Pre-Assessment Builder',
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
  const isPaymentPage = pathname === COMPANY_PATHS.postJobPayment;
  const isMessagesPage = pathname === COMPANY_PATHS.messages;
  const hideMobileChromeForThread = isMessagesPage && messagesThreadOpen;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [mobileNavActive, setMobileNavActive] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const title = useMemo(() => TITLES[pathname] || 'Company', [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSidebarCollapsed(window.localStorage.getItem('companySidebarCollapsed') === 'true');
  }, []);

  useEffect(() => {
    if (pathname === COMPANY_PATHS.premium) {
      navigate('/for-employers/pricing');
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
    <div className="min-h-screen overflow-x-hidden bg-[#eef2ec] dark:bg-[#0e1114] text-[#344e41] dark:text-white transition-colors duration-300">
      {!isPaymentPage ? (
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
      ) : null}

      {!isPaymentPage ? (
        <CompanySidebar
          activePath={pathname}
          collapsed={sidebarCollapsed}
          user={user}
          onHelp={onHelp}
          onLogout={onLogout}
          onOpenPricing={() => navigate('/for-employers/pricing')}
          onToggleSidebarCollapsed={() => setSidebarCollapsed((value) => !value)}
          unreadNotificationCount={unreadNotificationCount}
        />
      ) : null}

      <div
        className={`${
          isPaymentPage
            ? 'min-h-screen pt-0 pb-0'
            : isMessagesPage
            ? (hideMobileChromeForThread
              ? 'h-[100dvh] pt-0 pb-0 xl:h-[100dvh] xl:pt-[5.125rem] xl:pb-0'
              : 'h-[100dvh] pt-16 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pt-16 sm:pb-[calc(4rem+env(safe-area-inset-bottom))] xl:h-[100dvh] xl:pt-[5.125rem] xl:pb-0')
            : 'min-h-screen pt-[5.5rem] sm:pt-[6rem] xl:pt-20'
        } transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isPaymentPage ? '' : (sidebarCollapsed ? 'xl:pl-20' : 'xl:pl-72')}`}
      >
        <main
          className={`mx-auto w-full max-w-[min(100%,1800px)] ${
            isPaymentPage
              ? 'h-full min-h-screen px-0 py-0'
              : isMessagesPage
              ? 'h-full min-h-0 overflow-hidden px-0 py-2 sm:px-3 sm:py-3 xl:px-4 xl:py-4'
              : 'px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-4 sm:py-6 pb-24 md:pb-10'
          }`}
          style={isMessagesPage || isPaymentPage ? undefined : { paddingBottom: 'max(6rem, calc(4.5rem + env(safe-area-inset-bottom)))' }}
        >
          {children}
        </main>
      </div>

      {!isPaymentPage ? (
        <CompanyMobileMenuDrawer
          open={mobileNavVisible}
          active={mobileNavActive}
          user={user}
          onHelp={onHelp}
          onLogout={onLogout}
          onClose={() => setMobileNavOpen(false)}
        />
      ) : null}

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
    <div className={`xl:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
      hidden ? 'translate-y-full' : 'translate-y-0'
    }`}>
      <div className="px-3 pb-2 pt-1" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-3 gap-1.5 rounded-[1.9rem] border border-white/50 bg-white/72 p-1.5 shadow-[0_18px_40px_rgba(16,42,27,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#1f252b]/82">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;
            return (
              <PillNavButton
                key={item.path}
                layoutId="company-mobile-nav-lamp"
                label={item.label}
                icon={Icon}
                active={active}
                onClick={() => navigate(item.path)}
                variant="stacked"
                className="w-full"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
