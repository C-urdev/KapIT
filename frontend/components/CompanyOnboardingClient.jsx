'use client';

import { useRouter } from '@shared/hooks/useAppRouter';
import CompanyProfileOnboarding from '@sharedPages/onboarding/CompanyProfileOnboardingPage';
import { logoutAndRedirect, updateStoredUser } from '@sharedServices/authService';
import { saveCompanyProfileOnboarding } from '@companyFeatures/companyAPI';
import { ToastProvider } from '@sharedComponents/ui/ToastProvider';
import SessionGate from './SessionGate';

export default function CompanyOnboardingClient() {
  const router = useRouter();
  const handleLogout = () => {
    logoutAndRedirect('/');
  };

  return (
    <ToastProvider>
      <SessionGate requiredAccountType="company" redirectTo="/" allowIncompleteProfile>
        {({ user, setUser }) => (
          <CompanyProfileOnboarding
            user={user}
            onLogout={handleLogout}
            onSubmit={async (profileData) => {
              const data = await saveCompanyProfileOnboarding(profileData);
              const updatedUser = data?.user
                ? { ...data.user, ...profileData, profileCompleted: true, accountType: 'company', type: 'company' }
                : { ...user, ...profileData, profileCompleted: true, accountType: 'company', type: 'company' };

              updateStoredUser(updatedUser);
              setUser(updatedUser);
              router.replace('/company/dashboard');
            }}
          />
        )}
      </SessionGate>
    </ToastProvider>
  );
}
