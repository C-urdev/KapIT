import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PageSkeleton from '../components/shared/PageSkeleton';

// Lazy-loaded page components
const LandingPageClient = lazy(() => import('../components/LandingPageClient'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const SocialSignupPage = lazy(() => import('./pages/SocialSignupPage'));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage'));
const GithubCallbackPage = lazy(() => import('./pages/GithubCallbackPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const CompanyDetailsPage = lazy(() => import('./pages/CompanyDetails'));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const CompanyAppPage = lazy(() => import('./pages/CompanyAppPage'));
const CompanyOnboardingPage = lazy(() => import('./pages/CompanyOnboardingPage'));
const DeveloperOnboardingPage = lazy(() => import('./pages/DeveloperOnboardingPage'));
const JobMatchPage = lazy(() => import('./pages/JobMatchPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const PremiumPaymentPage = lazy(() => import('./pages/PremiumPaymentPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const ResumeViewerPage = lazy(() => import('./pages/ResumeViewerPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const App = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f7f6f1] text-slate-900 dark:bg-[#121416] dark:text-white">
      <main className="flex-grow">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public routes */}
            <Route index element={<LandingPageClient />} />
            <Route path="/auth/login" element={<Navigate to="/?login=1" replace />} />
            <Route path="/auth/register" element={<AuthPage mode="signup" />} />
            <Route path="/auth/social-signup" element={<SocialSignupPage />} />
            <Route path="/auth/callback/google" element={<GoogleCallbackPage />} />
            <Route path="/auth/callback/github" element={<GithubCallbackPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:slug" element={<JobDetailPage />} />
            <Route path="/companies/:companyId" element={<CompanyDetailsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/resume/:resumeId" element={<ResumeViewerPage />} />

            {/* Protected routes */}
            <Route path="/dashboard/user" element={<UserDashboardPage />} />
            <Route path="/dashboard/company" element={<Navigate to="/company/dashboard" replace />} />
            <Route path="/company/*" element={<CompanyAppPage />} />
            <Route path="/onboarding/company-profile" element={<CompanyOnboardingPage />} />
            <Route path="/onboarding/developer-profile" element={<DeveloperOnboardingPage />} />
            <Route path="/job-match" element={<JobMatchPage />} />
            <Route path="/premium/payment" element={<PremiumPaymentPage />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
