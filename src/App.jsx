import React, { Suspense, lazy, startTransition, useState, useEffect } from 'react';
import { ThemeProvider } from '@sharedContext/ThemeContext';
import ConfirmModal from '@sharedComponents/ui/ConfirmModal';
import { getStoredUser, isAuthenticated, logoutUser, updateStoredUser, getCurrentUser, updateMyProfile, getCachedProfileForEmail } from '@sharedServices/authService';
import { COMPANY_PATHS, isCompanyRoute, navigate } from '@companyFeatures/companyUtils';
import { saveDeveloperProfile } from '@userFeatures/developer/userDeveloperAPI';
import { saveCompanyProfileOnboarding } from '@companyFeatures/companyAPI';
import SelectAccountTypeModal from '@sharedComponents/auth/SelectAccountTypeModal';

const loadLandingPage = () => import('@sharedPages/landing/LandingPage');
const loadAuthPage = () => import('@sharedPages/auth/AuthPage');
const loadHomePage = () => import('@userPages/Home/UserHomePage');
const loadUserPremiumPopup = () => import('@userPages/Premium/UserPremiumPopup');
const loadHelpPage = () => import('@sharedPages/help/HelpPage');
const loadCompleteProfilePage = () => import('@sharedPages/onboarding/UserCompleteProfilePage');
const loadChooseAccountTypePage = () => import('@sharedPages/auth/ChooseAccountTypePage');
const loadCompleteCompanyProfilePage = () => import('@sharedPages/onboarding/CompanyCompleteProfilePage');
const loadDeveloperProfile = () => import('@sharedPages/onboarding/DeveloperProfileOnboardingPage');
const loadCompanyProfileOnboarding = () => import('@sharedPages/onboarding/CompanyProfileOnboardingPage');
const loadCompanyLayout = () => import('@companyLayouts/CompanyLayout');
const loadCompanyDashboard = () => import('@companyPages/CompanyDashboardPage');
const loadCompanyPostJob = () => import('@companyPages/CompanyPostJobPage');
const loadCompanyPostJobPayment = () => import('@companyPages/CompanyPostJobPaymentPage');
const loadManageJobs = () => import('@companyPages/CompanyManageJobsPage');
const loadApplicants = () => import('@companyPages/CompanyApplicantsPage');
const loadCompanyMessagesPage = () => import('@companyPages/CompanyMessagesPage');
const loadCompanyNotificationsPage = () => import('@companyPages/CompanyNotificationsPage');
const loadSearchDevelopers = () => import('@companyPages/CompanySearchDevelopersPage');
const loadCompanyProfile = () => import('@companyPages/CompanyProfilePage');
const loadCompanyPublicProfilePage = () => import('@companyPages/CompanyPublicProfilePage');

const LandingPage = lazy(loadLandingPage);
const AuthPage = lazy(loadAuthPage);
const HomePage = lazy(loadHomePage);
const UserPremiumPaymentWindow = lazy(async () => ({ default: (await loadUserPremiumPopup()).UserPremiumPaymentWindow }));
const HelpPage = lazy(loadHelpPage);
const CompleteProfilePage = lazy(loadCompleteProfilePage);
const ChooseAccountTypePage = lazy(loadChooseAccountTypePage);
const CompleteCompanyProfilePage = lazy(loadCompleteCompanyProfilePage);
const DeveloperProfile = lazy(loadDeveloperProfile);
const CompanyProfileOnboarding = lazy(loadCompanyProfileOnboarding);
const CompanyLayout = lazy(loadCompanyLayout);
const CompanyDashboard = lazy(loadCompanyDashboard);
const PostJob = lazy(loadCompanyPostJob);
const CompanyPostJobPayment = lazy(loadCompanyPostJobPayment);
const ManageJobs = lazy(loadManageJobs);
const Applicants = lazy(loadApplicants);
const CompanyMessagesPage = lazy(loadCompanyMessagesPage);
const CompanyNotificationsPage = lazy(loadCompanyNotificationsPage);
const SearchDevelopers = lazy(loadSearchDevelopers);
const CompanyProfile = lazy(loadCompanyProfile);
const CompanyPublicProfilePage = lazy(loadCompanyPublicProfilePage);

const AUTH_PATHS = {
  register: '/auth/register',
  login: '/auth/login',
};

const ONBOARDING_PATHS = {
  developer: '/onboarding/developer-profile',
  company: '/onboarding/company-profile',
};

const USER_PREMIUM_PAYMENT_PATH = '/premium/payment';

const getAccountTypeFromSearch = (search) => {
  try {
    const params = new URLSearchParams(search || '');
    const value = String(params.get('type') || '').trim().toLowerCase();
    if (value === 'developer' || value === 'company') {
      return value;
    }
  } catch {
    // ignore
  }
  return null;
};

const getViewForPathname = (pathname) => {
  if (pathname === AUTH_PATHS.register || pathname === AUTH_PATHS.login) return 'auth';
  if (pathname === ONBOARDING_PATHS.developer) return 'onboarding-developer-profile';
  if (pathname === ONBOARDING_PATHS.company) return 'onboarding-company-profile';
  return null;
};

const preloadRouteForUser = (u) => {
  const accountType = u?.accountType || (u?.type === 'company' ? 'company' : 'developer');

  if (!u?.profileCompleted) {
    if (accountType === 'company') {
      loadCompanyProfileOnboarding();
    } else {
      loadDeveloperProfile();
    }
    return;
  }

  if (u?.type === 'company') {
    loadCompanyLayout();
    loadCompanyDashboard();
    return;
  }

  loadHomePage();
};

const buildDeveloperProfilePayload = (cached, userData) => {
  const payload = {
    profileImage: cached?.profileImage || '',
    fullName: cached?.fullName || cached?.name || '',
    username: cached?.username || userData?.username || '',
    location: cached?.location || cached?.address || '',
    phoneNumber: cached?.phoneNumber || cached?.phone || '',
    email: userData?.email || cached?.contactEmail || '',
    jobTitle: cached?.jobTitle || '',
    yearsOfExperience: cached?.yearsOfExperience || '',
    skills: Array.isArray(cached?.skills) ? cached.skills.filter(Boolean) : [],
    preferredRole: cached?.preferredRole || cached?.desiredJob || '',
    educationAttainment: cached?.educationAttainment || cached?.education || '',
    school: cached?.school || '',
    certifications: cached?.certifications || '',
    github: cached?.github || '',
    portfolioWebsite: cached?.portfolioWebsite || '',
    linkedin: cached?.linkedin || '',
    otherLinks: cached?.otherLinks || '',
    workPreference: cached?.workPreference || 'remote',
    aboutMe: cached?.aboutMe || cached?.bio || '',
    resume: cached?.resume || '',
  };

  const isValid =
    payload.fullName &&
    payload.username &&
    payload.location &&
    payload.phoneNumber &&
    payload.email &&
    payload.jobTitle &&
    String(payload.yearsOfExperience).trim() !== '' &&
    payload.preferredRole &&
    payload.educationAttainment &&
    payload.school &&
    payload.aboutMe;

  return isValid ? payload : null;
};

const buildCompanyProfilePayload = (cached, userData) => {
  const payload = {
    companyName: cached?.companyName || userData?.companyName || userData?.username || '',
    logoUrl: cached?.logoUrl || cached?.profileImage || '',
    industry: cached?.industry || '',
    companySize: cached?.companySize || '',
    description: cached?.description || cached?.bio || '',
    website: cached?.website || '',
    location: cached?.location || cached?.address || '',
    contactEmail: userData?.email || cached?.contactEmail || '',
    phoneNumber: cached?.phoneNumber || cached?.phone || '',
    servicesNeeded: Array.isArray(cached?.servicesNeeded) ? cached.servicesNeeded.filter(Boolean) : [],
    projectTitle: cached?.projectTitle || '',
    projectDescription: cached?.projectDescription || '',
    budgetRange: cached?.budgetRange || '',
    timeline: cached?.timeline || '',
  };

  const isValid = payload.companyName && payload.industry && payload.companySize && payload.location && payload.contactEmail;
  return isValid ? payload : null;
};

export default function KapIT() {
  const [currentView, setCurrentView] = useState('landing');
  const [userType, setUserType] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [pendingSignup, setPendingSignup] = useState(null);
  const [authEntryMode, setAuthEntryMode] = useState('login');
  const [pathname, setPathname] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const [isAccountTypeModalOpen, setIsAccountTypeModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const routeForUser = (u) => {
    if (!u?.profileCompleted) {
      const accountType = u?.accountType || (u?.type === 'company' ? 'company' : 'developer');
      return accountType === 'company' ? 'onboarding-company-profile' : 'onboarding-developer-profile';
    }
    return u?.type === 'company' ? 'company' : 'home';
  };

  const warmAuthTarget = (target) => {
    if (target === 'login') {
      loadHomePage();
      loadCompanyLayout();
      return;
    }

    if (target === 'company') {
      loadCompanyProfileOnboarding();
      return;
    }

    loadDeveloperProfile();
  };

  const syncCachedProfileIfNeeded = async (userData) => {
    if (!userData || userData.profileCompleted) {
      return userData;
    }

    const cached = getCachedProfileForEmail(userData.email);
    if (!cached) {
      return userData;
    }

    const accountType = userData?.accountType || (userData?.type === 'company' ? 'company' : 'developer');

    try {
      if (accountType === 'company') {
        const companyPayload = buildCompanyProfilePayload(cached, userData);
        if (companyPayload) {
          const data = await saveCompanyProfileOnboarding(companyPayload);
          if (data?.user) {
            return { ...data.user, ...companyPayload };
          }
        }
      } else {
        const developerPayload = buildDeveloperProfilePayload(cached, userData);
        if (developerPayload) {
          const data = await saveDeveloperProfile(developerPayload);
          if (data?.user) {
            return { ...data.user, ...developerPayload };
          }
        }
      }

      const data = await updateMyProfile(cached);
      if (data?.user) {
        return { ...cached, ...data.user };
      }
    } catch {
      // fall through to existing incomplete user
    }

    return userData;
  };

  useEffect(() => {
    loadLandingPage();
    loadAuthPage();
  }, []);

  useEffect(() => {
    let canceled = false;

    const bootstrap = async () => {
      if (!isAuthenticated()) {
        const unauthView = getViewForPathname(window.location.pathname);
        if (window.location.pathname === '/auth/select-account-type') {
          setCurrentView('landing');
          setIsAccountTypeModalOpen(true);
          navigate('/');
          return;
        }
        if (unauthView) {
          setCurrentView(unauthView);
          setAuthEntryMode(window.location.pathname === AUTH_PATHS.register ? 'signup' : 'login');
        }
        return;
      }

      const storedUser = getStoredUser();
      if (!storedUser) {
        logoutUser();
        return;
      }

      setUser(storedUser);
      setUserType(storedUser.type);
      setIsAuth(true);
      const initialView = routeForUser(storedUser);
      setCurrentView(initialView);
      if (initialView === 'company') {
        if (!isCompanyRoute(window.location.pathname)) {
          navigate(COMPANY_PATHS.dashboard);
        }
      } else if (initialView === 'onboarding-company-profile') {
        navigate(ONBOARDING_PATHS.company);
      } else if (initialView === 'onboarding-developer-profile') {
        navigate(ONBOARDING_PATHS.developer);
      }

      try {
        const data = await getCurrentUser();
        if (canceled) {
          return;
        }

        const freshUser = data?.user;
        if (!freshUser) {
          return;
        }

        const syncedUser = await syncCachedProfileIfNeeded(freshUser);
        if (canceled) {
          return;
        }

        startTransition(() => {
          setUser(syncedUser);
          setUserType(syncedUser.type);
        });
        updateStoredUser(syncedUser);
        const nextView = routeForUser(syncedUser);
        startTransition(() => {
          setCurrentView(nextView);
        });
        if (nextView === 'company') {
          if (!isCompanyRoute(window.location.pathname)) {
            navigate(COMPANY_PATHS.dashboard);
          }
        } else if (nextView === 'onboarding-company-profile') {
          navigate(ONBOARDING_PATHS.company);
        } else if (nextView === 'onboarding-developer-profile') {
          navigate(ONBOARDING_PATHS.developer);
        }
      } catch {
        // keep local session if backend is unreachable
      }
    };

    bootstrap();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
      const nextView = getViewForPathname(window.location.pathname);
      if (window.location.pathname === '/auth/select-account-type') {
        setCurrentView('landing');
        setIsAccountTypeModalOpen(true);
        navigate('/');
        return;
      }
      if (nextView) {
        setCurrentView(nextView);
        if (nextView === 'auth') {
          setAuthEntryMode(window.location.pathname === AUTH_PATHS.register ? 'signup' : 'login');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleGetStarted = () => {
    setPendingSignup(null);
    setAuthEntryMode('login');
    setIsAccountTypeModalOpen(true);
  };

  const handleSignIn = () => {
    setPendingSignup(null);
    setAuthEntryMode('login');
    setCurrentView('auth');
    navigate(AUTH_PATHS.login);
  };

  const handleJoinAsDeveloper = () => {
    setPendingSignup(null);
    setAuthEntryMode('signup');
    setCurrentView('auth');
    navigate(`${AUTH_PATHS.register}?type=developer`);
  };

  const handleLogin = async (userData) => {
    setPendingSignup(null);
    preloadRouteForUser(userData);

    setUser(userData);
    setUserType(userData.type);
    setIsAuth(true);

    updateStoredUser(userData);
    const nextView = routeForUser(userData);
    startTransition(() => {
      setCurrentView(nextView);
    });
    if (nextView === 'company') {
      if (!isCompanyRoute(window.location.pathname)) {
        navigate(COMPANY_PATHS.dashboard);
      }
    } else if (nextView === 'onboarding-company-profile') {
      navigate(ONBOARDING_PATHS.company);
    } else if (nextView === 'onboarding-developer-profile') {
      navigate(ONBOARDING_PATHS.developer);
    }

    try {
      const syncedUser = await syncCachedProfileIfNeeded(userData);
      setUser(syncedUser);
      setUserType(syncedUser.type);
      updateStoredUser(syncedUser);
    } catch {
      // Keep the optimistic session active if follow-up syncing is slow or unavailable.
    }
  };

  const handleLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    setLogoutConfirmOpen(false);
    logoutUser();
    setUser(null);
    setUserType(null);
    setIsAuth(false);
    setPendingSignup(null);
    setCurrentView('landing');
    navigate('/');
  };

  const handleProfileComplete = async (profileData) => {
    try {
      const data = await updateMyProfile(profileData);
      const updatedUser = data?.user || {
        ...user,
        ...profileData,
        profileCompleted: true,
      };

      setUser(updatedUser);
      updateStoredUser(updatedUser);
      setCurrentView('home');
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'Failed to save profile. Please try again.');
    }
  };

  const handleDeveloperProfileComplete = async (profileData) => {
    try {
      const data = await saveDeveloperProfile(profileData);
      const updatedUser = data?.user
        ? { ...data.user, ...profileData, profileCompleted: true, accountType: 'developer' }
        : { ...user, ...profileData, profileCompleted: true, accountType: 'developer' };
      setUser(updatedUser);
      updateStoredUser(updatedUser);
      setCurrentView('home');
      navigate('/');
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'Failed to save profile. Please try again.');
    }
  };

  const handleCompanyProfileComplete = async (profileData) => {
    try {
      const data = await saveCompanyProfileOnboarding(profileData);
      const updatedUser = data?.user
        ? { ...data.user, ...profileData, profileCompleted: true, accountType: 'company', type: 'company' }
        : { ...user, ...profileData, profileCompleted: true, accountType: 'company', type: 'company' };
      setUser(updatedUser);
      updateStoredUser(updatedUser);
      setCurrentView('company');
      navigate(COMPANY_PATHS.dashboard);
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'Failed to save company profile. Please try again.');
    }
  };

  const handleBeginSignup = (signupData) => {
    setPendingSignup(signupData);
    setCurrentView('choose-account-type');
  };

  const handleSignupCanceled = () => {
    setPendingSignup(null);
    setAuthEntryMode('signup');
    setCurrentView('auth');
  };

  const handleUserUpdate = async (updates) => {
    const previousUser = user;
    const optimisticUser = {
      ...user,
      ...updates,
    };

    setUser(optimisticUser);
    updateStoredUser(optimisticUser);

    try {
      const data = await updateMyProfile(updates);
      const savedUser = data?.user;
      if (savedUser) {
        const mergedUser = {
          ...optimisticUser,
          ...savedUser,
        };
        setUser(mergedUser);
        updateStoredUser(mergedUser);
      }
    } catch (error) {
      const isProfileImageUpdate = Object.prototype.hasOwnProperty.call(updates || {}, 'profileImage');
      if (isProfileImageUpdate) {
        setUser(previousUser);
        updateStoredUser(previousUser);
        throw error;
      }
    }
  };

  const isCompanyPaymentWindow = currentView === 'company' && isAuth && userType === 'company' && pathname === COMPANY_PATHS.postJobPayment;
  const isUserPremiumPaymentWindow = currentView === 'home' && isAuth && userType !== 'company' && pathname === USER_PREMIUM_PAYMENT_PATH;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300">
        <Suspense fallback={<AppShellLoader />}>
          {isCompanyPaymentWindow && <CompanyPostJobPayment />}
          {isUserPremiumPaymentWindow && <UserPremiumPaymentWindow user={user} onUpgrade={handleUserUpdate} />}

          {currentView === 'company' && isAuth && userType === 'company' && !isCompanyPaymentWindow && (
            <CompanyLayout pathname={pathname} user={user} onLogout={handleLogout} onHelp={() => setCurrentView('help')}>
              {pathname === COMPANY_PATHS.dashboard && <CompanyDashboard />}
              {pathname === COMPANY_PATHS.premium && <CompanyDashboard />}
              {pathname === COMPANY_PATHS.postJob && <PostJob />}
              {pathname === COMPANY_PATHS.jobs && <ManageJobs />}
              {pathname === COMPANY_PATHS.applicants && <Applicants />}
            {pathname === COMPANY_PATHS.messages && <CompanyMessagesPage user={user} />}
            {pathname === COMPANY_PATHS.notifications && <CompanyNotificationsPage onReadAll={() => {}} />}
            {pathname === COMPANY_PATHS.search && <SearchDevelopers />}
              {pathname === COMPANY_PATHS.publicProfile && <CompanyPublicProfilePage />}
              {pathname === COMPANY_PATHS.profile && (
                <CompanyProfile
                  user={user}
                  onUpdated={(company, form) =>
                    handleUserUpdate({
                      companyName: form?.name,
                      profileImage: form?.logo,
                      bio: form?.shortDescription || form?.description,
                      address: form?.location,
                      website: form?.website,
                    })
                  }
                />
              )}
              {!Object.values(COMPANY_PATHS).includes(pathname) && <CompanyDashboard />}
            </CompanyLayout>
          )}
          {currentView === 'landing' && (
            <LandingPage onGetStarted={handleGetStarted} onJoinDeveloper={handleJoinAsDeveloper} onSignIn={handleSignIn} />
          )}
          {currentView === 'auth' && (
            <AuthPage
              userType={userType}
              accountType={pathname === AUTH_PATHS.register ? getAccountTypeFromSearch(window.location.search) : null}
              onLogin={handleLogin}
              onBeginSignup={handleBeginSignup}
              onWarmRoute={warmAuthTarget}
              onRequestAccountType={() => {
                setCurrentView('landing');
                navigate('/');
                setIsAccountTypeModalOpen(true);
              }}
              initialMode={authEntryMode}
              onBack={() => { setCurrentView('landing'); navigate('/'); }}
            />
          )}
          {currentView === 'choose-account-type' && (
            <ChooseAccountTypePage
              pendingSignup={pendingSignup}
              onBack={handleSignupCanceled}
              onRegistered={handleLogin}
            />
          )}
          {currentView === 'home' && isAuth && !isUserPremiumPaymentWindow && (
            <HomePage
              user={user}
              userType={userType}
              onOpenHelp={() => setCurrentView('help')}
              onLogout={handleLogout}
              onUpdateUser={handleUserUpdate}
            />
          )}
          {currentView === 'help' && isAuth && (
            <HelpPage onBack={() => setCurrentView(userType === 'company' ? 'company' : 'home')} />
          )}
          {currentView === 'complete-profile' && isAuth && (
            <CompleteProfilePage
              user={user}
              onSubmit={handleProfileComplete}
              onLogout={handleLogout}
            />
          )}
          {currentView === 'complete-company-profile' && isAuth && (
            <CompleteCompanyProfilePage
              user={user}
              onSubmit={handleProfileComplete}
              onLogout={handleLogout}
            />
          )}
          {currentView === 'onboarding-developer-profile' && isAuth && (
            <DeveloperProfile user={user} onSubmit={handleDeveloperProfileComplete} onLogout={handleLogout} />
          )}
          {currentView === 'onboarding-company-profile' && isAuth && (
            <CompanyProfileOnboarding user={user} onSubmit={handleCompanyProfileComplete} onLogout={handleLogout} />
          )}
        </Suspense>

        <SelectAccountTypeModal
          open={isAccountTypeModalOpen && currentView === 'landing'}
          onClose={() => setIsAccountTypeModalOpen(false)}
          onSelect={(type) => {
            setIsAccountTypeModalOpen(false);
            if (type === 'login') {
              setAuthEntryMode('login');
              setCurrentView('auth');
              navigate(AUTH_PATHS.login);
              return;
            }

            if (type === 'developer') {
              setAuthEntryMode('signup');
              setCurrentView('auth');
              navigate(`${AUTH_PATHS.register}?type=developer`);
              return;
            }

            if (type === 'company') {
              setAuthEntryMode('signup');
              setCurrentView('auth');
              navigate(`${AUTH_PATHS.register}?type=company`);
            }
          }}
        />

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
      </div>
    </ThemeProvider>
  );
}

function AppShellLoader() {
  return (
    <div className="min-h-screen bg-[#f7f6f1] dark:bg-[#0a1628] px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="h-12 w-48 animate-pulse rounded-2xl bg-[#e5e1d4] dark:bg-[#16304a]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-white dark:bg-[#162842]" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-white dark:bg-[#162842]" />
        <div className="h-72 animate-pulse rounded-2xl bg-white dark:bg-[#162842]" />
      </div>
    </div>
  );
}




