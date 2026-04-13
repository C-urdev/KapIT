'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { logoutUser } from '@sharedServices/authService';
import ConfirmModal from '@sharedComponents/ui/ConfirmModal';
import SessionGate from './SessionGate';
import CompanyLayout from '@companyLayouts/CompanyLayout';
import { COMPANY_PATHS } from '@companyFeatures/companyUtils';

const CompanyDashboardPage = dynamic(() => import('@companyPages/CompanyDashboardPage'));
const CompanyPostJobPage = dynamic(() => import('@companyPages/CompanyPostJobPage'));
const CompanyPostJobPaymentPage = dynamic(() => import('@companyPages/CompanyPostJobPaymentPage'));
const CompanyManageJobsPage = dynamic(() => import('@companyPages/CompanyManageJobsPage'));
const CompanyApplicantsPage = dynamic(() => import('@companyPages/CompanyApplicantsPage'));
const CompanyMessagesPage = dynamic(() => import('@companyPages/CompanyMessagesPage'));
const CompanyNotificationsPage = dynamic(() => import('@companyPages/CompanyNotificationsPage'));
const CompanySearchDevelopersPage = dynamic(() => import('@companyPages/CompanySearchDevelopersPage'));
const CompanyProfilePage = dynamic(() => import('@companyPages/CompanyProfilePage'));
const CompanyPublicProfilePage = dynamic(() => import('@companyPages/CompanyPublicProfilePage'));
const HelpPage = dynamic(() => import('@sharedPages/help/HelpPage'));

function renderCompanyRoute(pathname, user, updateUser, onBackFromHelp) {
  if (pathname === COMPANY_PATHS.postJobPayment) return <CompanyPostJobPaymentPage />;
  if (pathname === COMPANY_PATHS.postJob) return <CompanyPostJobPage />;
  if (pathname === COMPANY_PATHS.jobs) return <CompanyManageJobsPage />;
  if (pathname === COMPANY_PATHS.applicants) return <CompanyApplicantsPage />;
  if (pathname === COMPANY_PATHS.messages) return <CompanyMessagesPage user={user} />;
  if (pathname === COMPANY_PATHS.notifications) return <CompanyNotificationsPage onReadAll={() => {}} />;
  if (pathname === COMPANY_PATHS.search) return <CompanySearchDevelopersPage />;
  if (pathname === COMPANY_PATHS.help) return <HelpPage onBack={onBackFromHelp} />;
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
            onHelp={() => router.push(COMPANY_PATHS.help)}
          >
            {renderCompanyRoute(normalizedPathname, user, updateUser, () => router.push(COMPANY_PATHS.dashboard))}
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
