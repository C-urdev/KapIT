'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@sharedServices/authService';
import ConfirmModal from '@sharedComponents/ui/ConfirmModal';
import SessionGate from './SessionGate';
import CompanyLayout from '@companyLayouts/CompanyLayout';
import CompanyDashboardPage from '@companyPages/CompanyDashboardPage';
import CompanyPostJobPage from '@companyPages/CompanyPostJobPage';
import CompanyPostJobPaymentPage from '@companyPages/CompanyPostJobPaymentPage';
import CompanyManageJobsPage from '@companyPages/CompanyManageJobsPage';
import CompanyApplicantsPage from '@companyPages/CompanyApplicantsPage';
import CompanyMessagesPage from '@companyPages/CompanyMessagesPage';
import CompanyNotificationsPage from '@companyPages/CompanyNotificationsPage';
import CompanySearchDevelopersPage from '@companyPages/CompanySearchDevelopersPage';
import CompanyProfilePage from '@companyPages/CompanyProfilePage';
import CompanyPublicProfilePage from '@companyPages/CompanyPublicProfilePage';
import { COMPANY_PATHS } from '@companyFeatures/companyUtils';

function renderCompanyRoute(pathname, user, updateUser) {
  if (pathname === COMPANY_PATHS.postJobPayment) return <CompanyPostJobPaymentPage />;
  if (pathname === COMPANY_PATHS.postJob) return <CompanyPostJobPage />;
  if (pathname === COMPANY_PATHS.jobs) return <CompanyManageJobsPage />;
  if (pathname === COMPANY_PATHS.applicants) return <CompanyApplicantsPage />;
  if (pathname === COMPANY_PATHS.messages) return <CompanyMessagesPage user={user} />;
  if (pathname === COMPANY_PATHS.notifications) return <CompanyNotificationsPage onReadAll={() => {}} />;
  if (pathname === COMPANY_PATHS.search) return <CompanySearchDevelopersPage />;
  if (pathname === COMPANY_PATHS.profile) {
    return <CompanyProfilePage user={user} onUpdated={(company, form) => updateUser({ companyName: form?.name, profileImage: form?.logo, bio: form?.shortDescription || form?.description, address: form?.location, website: form?.website })} />;
  }
  if (pathname === COMPANY_PATHS.publicProfile) return <CompanyPublicProfilePage />;
  return <CompanyDashboardPage />;
}

export default function CompanyAppClient() {
  const pathname = usePathname() || COMPANY_PATHS.dashboard;
  const router = useRouter();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const normalizedPathname = useMemo(() => {
    if (pathname === '/company') {
      return COMPANY_PATHS.dashboard;
    }
    return pathname;
  }, [pathname]);

  const confirmLogout = async () => {
    setLogoutConfirmOpen(false);
    await logoutUser();
    router.push('/');
  };

  return (
    <>
      <SessionGate requiredAccountType="company" redirectTo="/">
        {({ user, updateUser }) => (
          <CompanyLayout
            pathname={normalizedPathname}
            user={user}
            onLogout={() => setLogoutConfirmOpen(true)}
            onHelp={() => {}}
          >
            {renderCompanyRoute(normalizedPathname, user, updateUser)}
          </CompanyLayout>
        )}
      </SessionGate>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="Log out?"
        message="Are you sure to log out?"
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        tone="danger"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}
