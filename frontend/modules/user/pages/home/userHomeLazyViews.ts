import { lazy } from 'react';

export const UserJobsPage = lazy(() => import('@userPages/jobs/UserJobsPage'));
export const UserJobDetailPage = lazy(() => import('@userPages/jobs/UserJobDetailPage'));
export const UserPreAssessmentPage = lazy(() => import('@userPages/jobs/UserPreAssessmentPage'));
export const UserProjectsPage = lazy(() => import('@userPages/projects/UserProjectsPage'));
export const UserSearchResultsPage = lazy(() => import('@userPages/search/UserSearchResultsPage'));
export const UserMessagesPage = lazy(() => import('@userPages/messages/UserMessagesPage'));
export const UserNotificationsPage = lazy(() => import('@userPages/notifications/UserNotificationsPage'));
export const UserFeedbackPage = lazy(() => import('@userPages/feedback/UserFeedbackPage'));
export const PublicProfilePage = lazy(() => import('@sharedPages/public-profile/PublicProfilePage'));
export const HelpPage = lazy(() => import('@sharedPages/help/HelpPage'));
export const UserPremiumPopup = lazy(() => import('@userPages/premium/UserPremiumPopup'));
export const PostComposerModal = lazy(() => import('@userFeatures/posts/UserPostComposerModal'));
export const UserMyProfilePage = lazy(() => import('@userFeatures/profile/UserMyProfilePage'));
export const UserAccountSettingsModal = lazy(() => import('@userFeatures/profile/UserAccountSettingsModal'));
export const UserFaqModal = lazy(() => import('@userFeatures/profile/UserFaqModal'));
export const TermsAndConditionsModal = lazy(() => import('@sharedComponents/modals/TermsAndConditionsModal'));
export const PrivacyPolicyModal = lazy(() => import('@sharedComponents/modals/PrivacyPolicyModal'));
export const CookiesPolicyModal = lazy(() => import('@sharedComponents/modals/CookiesPolicyModal'));
export const UserSettingsPage = lazy(() => import('@userPages/settings/UserSettingsPage'));
export const UserResumeAtsPreviewPage = lazy(() => import('@userPages/settings/UserResumeAtsPreviewPage'));
export const UserApplicationsPanel = lazy(() => import('./UserApplicationsPanel'));
export const UserSavedJobsPanel = lazy(() => import('./UserSavedJobsPanel'));
export const UserResumeProfileViewerPage = lazy(() => import('./UserResumeProfileViewerPage'));

const UserPrivacyPagesModule = () => import('@userPages/settings/UserPrivacyPages');
export const UserPrivacySettingsPage = lazy(async () => {
  const module = await UserPrivacyPagesModule();
  return { default: module.UserPrivacySettingsPage };
});
export const UserPrivacyChangePasswordPage = lazy(async () => {
  const module = await UserPrivacyPagesModule();
  return { default: module.UserPrivacyChangePasswordPage };
});
export const UserPrivacyCommentsPage = lazy(async () => {
  const module = await UserPrivacyPagesModule();
  return { default: module.UserPrivacyCommentsPage };
});
export const UserPrivacyMentionsPage = lazy(async () => {
  const module = await UserPrivacyPagesModule();
  return { default: module.UserPrivacyMentionsPage };
});
export const UserPrivacyFollowingPage = lazy(async () => {
  const module = await UserPrivacyPagesModule();
  return { default: module.UserPrivacyFollowingPage };
});
export const UserPrivacyLikesPage = lazy(async () => {
  const module = await UserPrivacyPagesModule();
  return { default: module.UserPrivacyLikesPage };
});

const UserSettingsUtilityPagesModule = () => import('@userPages/settings/UserSettingsUtilityPages');
export const UserNotificationSettingsPage = lazy(async () => {
  const module = await UserSettingsUtilityPagesModule();
  return { default: module.UserNotificationSettingsPage };
});
export const UserSavedJobsSettingsPage = lazy(async () => {
  const module = await UserSettingsUtilityPagesModule();
  return { default: module.UserSavedJobsSettingsPage };
});
export const UserApplicationsSettingsPage = lazy(async () => {
  const module = await UserSettingsUtilityPagesModule();
  return { default: module.UserApplicationsSettingsPage };
});
