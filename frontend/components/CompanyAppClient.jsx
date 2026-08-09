'use client';

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from '@shared/hooks/useAppRouter';
import { logoutAndRedirect } from '@sharedServices/authService';
import { ToastProvider } from '@sharedComponents/ui/ToastProvider';
import SessionGate from './SessionGate';
import CompanyLayout from '@companyLayouts/CompanyLayout';
import { COMPANY_PATHS, navigate, setCompanyNavigator } from '@companyFeatures/companyUtils';
import { primeCompanyProfileData, primeCompanyWorkspaceData } from '@companyFeatures/companyHooks';
import CompanyDashboardPage from '@companyPages/CompanyDashboardPage';
const loadCompanyPostJobPage = () => import('@companyPages/CompanyPostJobPage');
const loadCompanyPostJobPreAssessmentPage = () => import('@companyPages/CompanyPostJobPreAssessmentPage');
const loadCompanyPostJobPaymentPage = () => import('@companyPages/CompanyPostJobPaymentPage');
const loadCompanyManageJobsPage = () => import('@companyPages/CompanyManageJobsPage');
const loadCompanyApplicantsPage = () => import('@companyPages/CompanyApplicantsPage');
const loadCompanyMessagesPage = () => import('@companyPages/CompanyMessagesPage');
const loadCompanyNotificationsPage = () => import('@companyPages/CompanyNotificationsPage');
const loadCompanySearchDevelopersPage = () => import('@companyPages/CompanySearchDevelopersPage');
const loadCompanyProfilePage = () => import('@companyPages/CompanyProfilePage');
const loadCompanySettingsPage = () => import('@companyPages/CompanySettingsPage');
const loadCompanyPublicProfilePage = () => import('@companyPages/CompanyPublicProfilePage');
const loadCompanySettingsUtilityPages = () => import('@companyPages/CompanySettingsUtilityPages');
const loadHelpPage = () => import('@sharedPages/help/HelpPage');

const CompanyPostJobPage = lazy(loadCompanyPostJobPage);
const CompanyPostJobPreAssessmentPage = lazy(loadCompanyPostJobPreAssessmentPage);
const CompanyPostJobPaymentPage = lazy(loadCompanyPostJobPaymentPage);
const CompanyManageJobsPage = lazy(loadCompanyManageJobsPage);
const CompanyApplicantsPage = lazy(loadCompanyApplicantsPage);
const CompanyMessagesPage = lazy(loadCompanyMessagesPage);
const CompanyNotificationsPage = lazy(loadCompanyNotificationsPage);
const CompanySearchDevelopersPage = lazy(loadCompanySearchDevelopersPage);
const CompanyProfilePage = lazy(loadCompanyProfilePage);
const CompanySettingsPage = lazy(loadCompanySettingsPage);
const CompanyPublicProfilePage = lazy(loadCompanyPublicProfilePage);
const CompanyInfoSettingsPage = lazy(async () => {
  const module = await loadCompanySettingsUtilityPages();
  return { default: module.CompanyInfoSettingsPage };
});
const CompanyNotificationSettingsPage = lazy(async () => {
  const module = await loadCompanySettingsUtilityPages();
  return { default: module.CompanyNotificationSettingsPage };
});
const HelpPage = lazy(loadHelpPage);

function renderCompanyRoute(pathname, user, updateUser, onBackFromHelp, onMessagesThreadVisibilityChange, notificationPreference, setNotificationPreference) {
  if (pathname === COMPANY_PATHS.postJobPayment) return <CompanyPostJobPaymentPage />;
  if (pathname === COMPANY_PATHS.postJobPreAssessment) return <CompanyPostJobPreAssessmentPage />;
  if (pathname === COMPANY_PATHS.postJob) return <CompanyPostJobPage />;
  if (pathname === COMPANY_PATHS.jobs) return <CompanyManageJobsPage />;
  if (pathname === COMPANY_PATHS.applicants) return <CompanyApplicantsPage />;
  if (pathname === COMPANY_PATHS.messages) return <CompanyMessagesPage user={user} onThreadVisibilityChange={onMessagesThreadVisibilityChange} />;
  if (pathname === COMPANY_PATHS.notifications) return <CompanyNotificationsPage onReadAll={() => {}} />;
  if (pathname === COMPANY_PATHS.search) return <CompanySearchDevelopersPage />;
  if (pathname === COMPANY_PATHS.help) return <HelpPage onBack={onBackFromHelp} />;
  if (pathname === COMPANY_PATHS.settingsCompanyInfo) {
    return (
      <CompanyInfoSettingsPage
        user={user}
        onBack={() => navigate(COMPANY_PATHS.settings)}
        onUpdated={(company, form) => updateUser({
          companyName: form?.name,
          profileImage: form?.logo,
          bio: form?.shortDescription,
          address: form?.location,
          website: form?.website,
          industry: form?.industry,
          companySize: form?.companySize,
          phone: form?.phone,
        })}
      />
    );
  }
  if (pathname === COMPANY_PATHS.settingsNotifications) {
    return (
      <CompanyNotificationSettingsPage
        onBack={() => navigate(COMPANY_PATHS.settings)}
        value={notificationPreference}
        onChange={(next) => {
          setNotificationPreference(next);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('kapit_company_notification_preference', next);
          }
        }}
      />
    );
  }
  if (pathname === COMPANY_PATHS.settings) {
    return <CompanySettingsPage />;
  }
  if (pathname === COMPANY_PATHS.profile) {
    return <CompanyProfilePage user={user} onUpdated={(company, form) => updateUser({ companyName: form?.name, profileImage: form?.logo, bio: form?.shortDescription || form?.description, address: form?.location, website: form?.website })} />;
  }
  if (pathname === COMPANY_PATHS.publicProfile) return <CompanyPublicProfilePage />;
  return <CompanyDashboardPage />;
}

export default function CompanyAppClient() {
  const pathname = usePathname() || COMPANY_PATHS.dashboard;
  const router = useRouter();

  const [mobileMessagesThreadOpen, setMobileMessagesThreadOpen] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState('all');
  const normalizedPathname = useMemo(() => {
    if (pathname === '/company') {
      return COMPANY_PATHS.dashboard;
    }
    return pathname;
  }, [pathname]);

  useEffect(() => {
    const detachNavigator = setCompanyNavigator((nextPath) => {
      router.push(nextPath);
    });

    return () => {
      detachNavigator();
    };
  }, [router]);

  useEffect(() => {
    const prefetchCandidates = [
      loadCompanyManageJobsPage,
      loadCompanyPostJobPage,
      loadCompanyPostJobPreAssessmentPage,
      loadCompanyPostJobPaymentPage,
      loadCompanyApplicantsPage,
      loadCompanyMessagesPage,
      loadCompanyNotificationsPage,
      loadCompanySearchDevelopersPage,
      loadCompanyProfilePage,
      loadCompanySettingsPage,
    ];

    const schedulePrefetch = () => {
      prefetchCandidates.forEach((loadModule) => {
        void loadModule();
      });
    };

    if (typeof window !== 'undefined' && window.navigator?.connection?.saveData) {
      return;
    }

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(schedulePrefetch, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(schedulePrefetch, 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (normalizedPathname !== COMPANY_PATHS.messages) {
      setMobileMessagesThreadOpen(false);
    }
  }, [normalizedPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = String(window.localStorage.getItem('kapit_company_notification_preference') || '').trim();
    if (stored === 'jobs_only' || stored === 'jobs_and_messages' || stored === 'all') {
      setNotificationPreference(stored);
    }
  }, []);

  useEffect(() => {
    if (normalizedPathname === COMPANY_PATHS.help) {
      return;
    }
    void primeCompanyWorkspaceData({
      includeApplicants: normalizedPathname === COMPANY_PATHS.applicants,
      includeAnalytics: normalizedPathname === COMPANY_PATHS.applicants,
    });
  }, [normalizedPathname]);

  useEffect(() => {
    const schedulePreload = () => {
      void primeCompanyWorkspaceData({ includeApplicants: false, includeAnalytics: false });
      void primeCompanyProfileData();
    };

    if (typeof window === 'undefined') {
      return;
    }

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(schedulePreload, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(schedulePreload, 200);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logoutAndRedirect('/');
  };

  const lazyRouteFallback = (
    <div className="flex min-h-[240px] items-center justify-center rounded-[28px] border border-[#a3b18a]/20 bg-white/60 px-6 py-10 text-sm font-medium text-[#3a5a40] shadow-sm backdrop-blur-sm dark:border-[#444d57]/40 dark:bg-[#1f2328]/70 dark:text-[#e2e6e9]">
      Loading workspace...
    </div>
  );

  return (
    <ToastProvider>
      <SessionGate requiredAccountType="company" redirectTo="/">
        {({ user, updateUser }) => (
          <>
            <CompanyWorkspaceBootstrap user={user} updateUser={updateUser} />
            <CompanyLayout
              pathname={normalizedPathname}
              user={user}
              onLogout={handleLogout}
              onHelp={() => router.push(COMPANY_PATHS.help)}
              messagesThreadOpen={mobileMessagesThreadOpen}
            >
              <Suspense fallback={lazyRouteFallback}>
                {renderCompanyRoute(
                  normalizedPathname,
                  user,
                  updateUser,
                  () => router.push(COMPANY_PATHS.dashboard),
                  (open) => setMobileMessagesThreadOpen(Boolean(open)),
                  notificationPreference,
                  setNotificationPreference,
                )}
              </Suspense>
            </CompanyLayout>
          </>
        )}
      </SessionGate>
    </ToastProvider>
  );
}

function CompanyWorkspaceBootstrap({ user, updateUser }) {
  const latestUserRef = useRef(user);
  const latestUpdateUserRef = useRef(updateUser);

  useEffect(() => {
    latestUserRef.current = user;
    latestUpdateUserRef.current = updateUser;
  }, [updateUser, user]);

  useEffect(() => {
    let cancelled = false;

    const hydrateCompanyProfile = async () => {
      try {
        const profileData = await primeCompanyProfileData();
        const company = profileData?.company || {};
        const currentUser = latestUserRef.current;
        if (cancelled) {
          return;
        }

        const updates = {
          companyName: String(company?.name || currentUser?.companyName || currentUser?.username || '').trim(),
          profileImage: String(company?.logo || currentUser?.profileImage || '').trim(),
          bio: String(company?.short_description || company?.description || currentUser?.bio || '').trim(),
          address: String(company?.location || currentUser?.address || '').trim(),
          website: String(company?.website || currentUser?.website || '').trim(),
        };

        latestUpdateUserRef.current(updates);
      } catch {
        // Keep existing user snapshot if preloading profile fails.
      }
    };

    void hydrateCompanyProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return null;
}
