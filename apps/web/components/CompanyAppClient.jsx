'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAndRedirect } from '@sharedServices/authService';
import SessionGate from './SessionGate';
import CompanyLayout from '@companyLayouts/CompanyLayout';
import { COMPANY_PATHS, setCompanyNavigator } from '@companyFeatures/companyUtils';
import { primeCompanyProfileData, primeCompanyWorkspaceData } from '@companyFeatures/companyHooks';
import CompanyDashboardPage from '@companyPages/CompanyDashboardPage';
import CompanyPostJobPage from '@companyPages/CompanyPostJobPage';
import CompanyPostJobPaymentPage from '@companyPages/CompanyPostJobPaymentPage';
import CompanyManageJobsPage from '@companyPages/CompanyManageJobsPage';
import CompanyApplicantsPage from '@companyPages/CompanyApplicantsPage';
import CompanyMessagesPage from '@companyPages/CompanyMessagesPage';
import CompanyNotificationsPage from '@companyPages/CompanyNotificationsPage';
import CompanySearchDevelopersPage from '@companyPages/CompanySearchDevelopersPage';
import CompanyProfilePage from '@companyPages/CompanyProfilePage';
import CompanySettingsPage from '@companyPages/CompanySettingsPage';
import CompanyPublicProfilePage from '@companyPages/CompanyPublicProfilePage';
import HelpPage from '@sharedPages/help/HelpPage';

function renderCompanyRoute(pathname, user, updateUser, onBackFromHelp, onMessagesThreadVisibilityChange) {
  if (pathname === COMPANY_PATHS.postJobPayment) return <CompanyPostJobPaymentPage />;
  if (pathname === COMPANY_PATHS.postJob) return <CompanyPostJobPage />;
  if (pathname === COMPANY_PATHS.jobs) return <CompanyManageJobsPage />;
  if (pathname === COMPANY_PATHS.applicants) return <CompanyApplicantsPage />;
  if (pathname === COMPANY_PATHS.messages) return <CompanyMessagesPage user={user} onThreadVisibilityChange={onMessagesThreadVisibilityChange} />;
  if (pathname === COMPANY_PATHS.notifications) return <CompanyNotificationsPage onReadAll={() => {}} />;
  if (pathname === COMPANY_PATHS.search) return <CompanySearchDevelopersPage />;
  if (pathname === COMPANY_PATHS.help) return <HelpPage onBack={onBackFromHelp} />;
  if (pathname === COMPANY_PATHS.settings) {
    return <CompanySettingsPage user={user} onUpdated={(company, form) => updateUser({ companyName: form?.name, profileImage: form?.logo, bio: form?.shortDescription, address: form?.location, website: form?.website })} />;
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
      COMPANY_PATHS.dashboard,
      COMPANY_PATHS.jobs,
      COMPANY_PATHS.postJob,
    ];

    const schedulePrefetch = () => {
      prefetchCandidates.forEach((targetPath) => {
        router.prefetch?.(targetPath);
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
  }, [router]);

  useEffect(() => {
    if (normalizedPathname !== COMPANY_PATHS.messages) {
      setMobileMessagesThreadOpen(false);
    }
  }, [normalizedPathname]);

  useEffect(() => {
    if (normalizedPathname === COMPANY_PATHS.help) {
      return;
    }
    void primeCompanyWorkspaceData({ includeApplicants: normalizedPathname === COMPANY_PATHS.applicants });
  }, [normalizedPathname]);

  useEffect(() => {
    const schedulePreload = () => {
      void primeCompanyWorkspaceData({ includeApplicants: false });
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

  return (
    <>
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
              {renderCompanyRoute(
                normalizedPathname,
                user,
                updateUser,
                () => router.push(COMPANY_PATHS.dashboard),
                (open) => setMobileMessagesThreadOpen(Boolean(open)),
              )}
            </CompanyLayout>
          </>
        )}
      </SessionGate>
    </>
  );
}

function CompanyWorkspaceBootstrap({ user, updateUser }) {
  useEffect(() => {
    let cancelled = false;

    const hydrateCompanyProfile = async () => {
      try {
        const profileData = await primeCompanyProfileData();
        const company = profileData?.company || {};
        if (cancelled) {
          return;
        }

        const updates = {
          companyName: String(company?.name || user?.companyName || user?.username || '').trim(),
          profileImage: String(company?.logo || user?.profileImage || '').trim(),
          bio: String(company?.short_description || company?.description || user?.bio || '').trim(),
          address: String(company?.location || user?.address || '').trim(),
          website: String(company?.website || user?.website || '').trim(),
        };

        updateUser(updates);
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
