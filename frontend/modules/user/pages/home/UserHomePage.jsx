import React, { useCallback, useEffect, useRef, useState } from 'react';
import UserNavbar from '@userComponents/UserNavbar';
import UserLeftSidebar from '@userComponents/UserLeftSidebar';
import UserRightSidebar from '@userComponents/UserRightSidebar';
import CenterFeed from './UserCenterFeed';
import UserJobsPage from '@userPages/jobs/UserJobsPage';
import UserJobDetailPage from '@userPages/jobs/UserJobDetailPage';
import UserPreAssessmentPage from '@userPages/jobs/UserPreAssessmentPage';
import UserProjectsPage from '@userPages/projects/UserProjectsPage';
import UserSearchResultsPage from '@userPages/search/UserSearchResultsPage';
import UserMessagesPage from '@userPages/messages/UserMessagesPage';
import UserNotificationsPage from '@userPages/notifications/UserNotificationsPage';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';
import HelpPage from '@sharedPages/help/HelpPage';
import UserPremiumPopup from '@userPages/premium/UserPremiumPopup';
import { USER_PREMIUM_PAYMENT_PATH, USER_PREMIUM_PAYMENT_SUCCESS, USER_PREMIUM_PAYMENT_STORAGE_KEY } from '@userPages/premium/UserPremiumPopup';
import PostComposerModal from '@userFeatures/posts/UserPostComposerModal';
import UserMyProfilePage from '@userFeatures/profile/UserMyProfilePage';
import UserAccountSettingsModal from '@userFeatures/profile/UserAccountSettingsModal';
import UserFaqModal from '@userFeatures/profile/UserFaqModal';
import TermsAndConditionsModal from '@sharedComponents/modals/TermsAndConditionsModal';
import PrivacyPolicyModal from '@sharedComponents/modals/PrivacyPolicyModal';
import CookiesPolicyModal from '@sharedComponents/modals/CookiesPolicyModal';
import UserSettingsPage from '@userPages/settings/UserSettingsPage';
import {
  UserPrivacyChangePasswordPage,
  UserPrivacyCommentsPage,
  UserPrivacyFollowingPage,
  UserPrivacyLikesPage,
  UserPrivacyMentionsPage,
  UserPrivacySettingsPage,
} from '@userPages/settings/UserPrivacyPages';
import {
  UserApplicationsSettingsPage,
  UserNotificationSettingsPage,
  UserSavedJobsSettingsPage,
} from '@userPages/settings/UserSettingsUtilityPages';
import UserResumeAtsPreviewPage from '@userPages/settings/UserResumeAtsPreviewPage';
import UserMobileBottomNav from '@userComponents/navigation/mobile/UserMobileBottomNav';
import UserApplicationsPanel from './UserApplicationsPanel';
import UserSavedJobsPanel from './UserSavedJobsPanel';
import UserResumeProfileViewerPage from './UserResumeProfileViewerPage';
import { developerAPI } from '@userFeatures/developer/userDeveloperAPI';
import {
  addCommentToPost,
  createPost,
  deletePost,
  listFeedPosts,
  listMyPosts,
  listSavedPosts,
  reactToCommentOnPost,
  reactToPost,
  removeSavedPost,
  savePost,
  toggleSharePost,
} from '@sharedServices/postService';
import { getCurrentUser, getJobsFeed, getMyApplications, getPublicProfile, getSavedJobs } from '@sharedServices/authService';
import { getUnreadNotificationCount } from '@sharedServices/notificationsService';
import { ArrowLeft, BadgeCheck, Building2, Lightbulb, Sparkles, UserCircle } from 'lucide-react';
import { getApplicationsForUser } from '@userFeatures/activity/userActivityStorage';

const USER_NAV_QUERY_KEY = 'tab';
const FEED_PAGE_SIZE = 10;
const USER_PROFILE_QUERY_KEY = 'profileId';
const USER_JOB_QUERY_KEY = 'jobId';
const USER_NAV_TABS = new Set(['home', 'jobs', 'job-detail', 'pre-assessment', 'projects', 'search', 'messages', 'notifications', 'saved-jobs', 'applications', 'my-profile', 'resume-viewer', 'help', 'tips', 'verified', 'settings', 'public-profile', 'settings-account', 'settings-career', 'settings-resume-ats', 'settings-notifications', 'settings-saved-jobs', 'settings-applications', 'privacy-settings', 'privacy-change-password', 'privacy-comments', 'privacy-mentions', 'privacy-following', 'privacy-likes']);
const resolveProfileId = (value) => {
  const normalized = String(value || '').trim();
  return normalized || '';
};
const resolveJobId = (value) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
};
const resolveProfileIdFromResult = (result) => (
  resolveProfileId(result?.id) || resolveProfileId(result?.userId) || resolveProfileId(result?.user_id)
);
const getPublicProfileIdFromUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return resolveProfileId(new URLSearchParams(window.location.search).get(USER_PROFILE_QUERY_KEY));
};
const getJobIdFromUrl = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return resolveJobId(new URLSearchParams(window.location.search).get(USER_JOB_QUERY_KEY));
};

const getUserNavFromUrl = () => {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const nextTab = String(new URLSearchParams(window.location.search).get(USER_NAV_QUERY_KEY) || '').trim().toLowerCase();
  return USER_NAV_TABS.has(nextTab) ? nextTab : 'home';
};

const syncUserNavToUrl = (nextNav, options = {}) => {
  if (typeof window === 'undefined') {
    return;
  }

  const profileId = resolveProfileId(options.profileId);
  const jobId = resolveJobId(options.jobId);
  const url = new URL(window.location.href);
  if (USER_NAV_TABS.has(nextNav) && nextNav !== 'home') {
    url.searchParams.set(USER_NAV_QUERY_KEY, nextNav);
  } else {
    url.searchParams.delete(USER_NAV_QUERY_KEY);
  }
  if (nextNav === 'public-profile' && profileId) {
    url.searchParams.set(USER_PROFILE_QUERY_KEY, profileId);
  } else {
    url.searchParams.delete(USER_PROFILE_QUERY_KEY);
  }
  if ((nextNav === 'job-detail' || nextNav === 'pre-assessment') && jobId) {
    url.searchParams.set(USER_JOB_QUERY_KEY, String(jobId));
  } else {
    url.searchParams.delete(USER_JOB_QUERY_KEY);
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState({}, '', nextUrl);
  }
};

export default function UserHomePage({ user, userType, onOpenHelp, onLogout, onUpdateUser }) {
  const [activeNav, setActiveNav] = useState(() => getUserNavFromUrl());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState('all');
  useEffect(() => {
    const pagesWithNoScroll = ['jobs', 'saved-jobs', 'applications'];
    if (pagesWithNoScroll.includes(activeNav)) {
      document.documentElement.classList.add('no-scrollbar');
    } else {
      document.documentElement.classList.remove('no-scrollbar');
    }
    return () => document.documentElement.classList.remove('no-scrollbar');
  }, [activeNav]);

  const [canReturnToSettings, setCanReturnToSettings] = useState(false);
  const [posts, setPosts] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [hasMoreFeedPosts, setHasMoreFeedPosts] = useState(false);
  const [feedCursor, setFeedCursor] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [messageTargetId, setMessageTargetId] = useState('');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchPageQuery, setSearchPageQuery] = useState('');
  const [searchPageScope, setSearchPageScope] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [publicProfileBackTarget, setPublicProfileBackTarget] = useState({ nav: 'home', options: {} });
  const [jobCardStateById, setJobCardStateById] = useState({});
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isTabletViewport, setIsTabletViewport] = useState(false);
  const [isMobileShellViewport, setIsMobileShellViewport] = useState(false);
  const [mobileChromeHidden, setMobileChromeHidden] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [resumeUploadPreview, setResumeUploadPreview] = useState({
    resumeUrl: '',
    fileName: '',
    contentType: '',
    extractedTextPreview: '',
    optimized: null,
    optimizedDocxUrl: '',
    optimizedPdfUrl: '',
    optimizing: false,
    optimizeError: '',
    applyingOptimizedResume: false,
    applyOptimizedError: '',
  });
  const [resumeViewerPayload, setResumeViewerPayload] = useState({
    resumeUrl: '',
    isAts: false,
    fileLabel: 'Resume',
  });
  const feedRequestInFlightRef = useRef(false);
  const feedCursorRef = useRef(null);
  const hasMoreFeedPostsRef = useRef(false);
  const feedPostsRef = useRef([]);
  const resumeSyncDoneForUserRef = useRef('');
  const lastScrollYRef = useRef(0);
  const isMessagesActive = activeNav === 'messages';
  const isSettingsActive = activeNav === 'settings';
  const isResumeAtsPreviewActive = activeNav === 'settings-resume-ats';
  const isSearchActive = activeNav === 'search';
  const isEdgeToEdgeView = isMessagesActive || isSettingsActive;
  const pageBackgroundClass = isMessagesActive ? 'bg-[#dad7cd] dark:bg-[#121212]' : 'bg-[#dad7cd] dark:bg-[#121416]';
  const hideMobileChromeForMessages = isTabletViewport && isMessagesActive && mobileThreadOpen;
  const effectiveMobileChromeHidden = mobileChromeHidden || hideMobileChromeForMessages;
  const canAccessPreAssessment = Boolean(user?.isPremium);
  const selectedJobHasApplied = Boolean(selectedJob?.hasApplied);
  const mobileSafeAreaBottomPadding = isMobileShellViewport
    ? effectiveMobileChromeHidden
      ? 'max(1.75rem, calc(env(safe-area-inset-bottom) + 1rem))'
      : 'max(7rem, calc(env(safe-area-inset-bottom) + 5.75rem))'
    : undefined;

  useEffect(() => {
    feedCursorRef.current = feedCursor;
  }, [feedCursor]);

  useEffect(() => {
    hasMoreFeedPostsRef.current = hasMoreFeedPosts;
  }, [hasMoreFeedPosts]);

  useEffect(() => {
    feedPostsRef.current = Array.isArray(feedPosts) ? feedPosts : [];
  }, [feedPosts]);

  const mergePostsById = useCallback((currentPosts, incomingPosts) => {
    const next = [];
    const seenIds = new Set();
    [...(Array.isArray(currentPosts) ? currentPosts : []), ...(Array.isArray(incomingPosts) ? incomingPosts : [])]
      .forEach((post) => {
        const id = Number(post?.id);
        if (!Number.isInteger(id) || id <= 0 || seenIds.has(id)) {
          return;
        }
        seenIds.add(id);
        next.push(post);
      });
    return next;
  }, []);

  const applyUpdatedPostLocally = useCallback((updatedPost) => {
    const postId = Number(updatedPost?.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return false;
    }

    let foundAny = false;
    const apply = (list) => {
      const items = Array.isArray(list) ? list : [];
      let foundInList = false;
      const next = items.map((item) => {
        const itemId = Number(item?.id);
        if (itemId !== postId) {
          return item;
        }
        foundInList = true;
        return updatedPost;
      });
      if (foundInList) {
        foundAny = true;
      }
      return next;
    };

    setPosts((current) => apply(current));
    setFeedPosts((current) => apply(current));
    return foundAny;
  }, []);

  const applyPostMutationLocally = useCallback((postId, mutatePost) => {
    const normalizedPostId = Number(postId);
    if (!Number.isInteger(normalizedPostId) || normalizedPostId <= 0 || typeof mutatePost !== 'function') {
      return false;
    }

    let foundAny = false;
    const apply = (list) => {
      const items = Array.isArray(list) ? list : [];
      return items.map((item) => {
        if (Number(item?.id) !== normalizedPostId) {
          return item;
        }
        foundAny = true;
        return mutatePost(item);
      });
    };

    setPosts((current) => apply(current));
    setFeedPosts((current) => apply(current));
    return foundAny;
  }, []);

  const syncPostState = useCallback(async () => {
    try {
      feedRequestInFlightRef.current = true;
      setLoadingPosts(true);
      setLoadingMorePosts(false);
      const [myPosts, feedResponse] = await Promise.all([
        listMyPosts(),
        listFeedPosts({ limit: FEED_PAGE_SIZE }),
      ]);
      const allFeedPosts = Array.isArray(feedResponse)
        ? feedResponse
        : (Array.isArray(feedResponse?.posts) ? feedResponse.posts : []);
      const initialHasMore = Array.isArray(feedResponse)
        ? false
        : Boolean(feedResponse?.hasMore);
      const initialCursor = Array.isArray(feedResponse)
        ? null
        : (feedResponse?.nextCursor || null);

      setPosts(myPosts);
      setFeedPosts(allFeedPosts);
      setHasMoreFeedPosts(initialHasMore);
      setFeedCursor(initialCursor);
    } catch {
      setPosts([]);
      setFeedPosts([]);
      setHasMoreFeedPosts(false);
      setFeedCursor(null);
    } finally {
      feedRequestInFlightRef.current = false;
      setLoadingPosts(false);
    }
  }, []);

  const loadMoreFeedPosts = useCallback(async () => {
    if (feedRequestInFlightRef.current || !hasMoreFeedPostsRef.current) {
      return;
    }

    const cursor = feedCursorRef.current;
    if (!cursor?.createdAt || !Number.isInteger(Number(cursor?.id))) {
      setHasMoreFeedPosts(false);
      return;
    }

    try {
      feedRequestInFlightRef.current = true;
      setLoadingMorePosts(true);
      const feedResponse = await listFeedPosts({
        limit: FEED_PAGE_SIZE,
        cursorCreatedAt: cursor.createdAt,
        cursorId: Number(cursor.id),
      });

      const incomingPosts = Array.isArray(feedResponse?.posts) ? feedResponse.posts : [];
      setFeedPosts((current) => mergePostsById(current, incomingPosts));
      setHasMoreFeedPosts(Boolean(feedResponse?.hasMore));
      setFeedCursor(feedResponse?.nextCursor || null);
    } catch {
      // Keep current cursor and hasMore state so observer can retry on next intersection.
    } finally {
      feedRequestInFlightRef.current = false;
      setLoadingMorePosts(false);
    }
  }, [mergePostsById]);

  const updateActiveNav = (nextNav, options = {}) => {
    setActiveNav(nextNav);
    syncUserNavToUrl(nextNav, options);

    if (options.fromSettings) {
      setCanReturnToSettings(true);
      return;
    }

    if (!options.preserveSettingsReturn) {
      setCanReturnToSettings(false);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveNav(getUserNavFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    syncUserNavToUrl(activeNav, {
      profileId: activeNav === 'public-profile' ? resolveProfileId(publicProfile?.id) : '',
      jobId: (activeNav === 'job-detail' || activeNav === 'pre-assessment') ? resolveJobId(selectedJob?.id) : null,
    });
  }, [activeNav, publicProfile, selectedJob]);

  useEffect(() => {
    let cancelled = false;

    const syncPublicProfileFromUrl = async () => {
      if (activeNav !== 'public-profile') {
        return;
      }

      const profileId = getPublicProfileIdFromUrl();
      if (!profileId || resolveProfileId(publicProfile?.id) === profileId) {
        return;
      }

      try {
        const profile = await getPublicProfile(profileId);
        if (cancelled) {
          return;
        }
        setPublicProfile({
          id: profileId,
          ...(profile || {}),
        });
      } catch {
        if (cancelled) {
          return;
        }
        setPublicProfile((current) => (
          resolveProfileId(current?.id) === profileId
            ? current
            : { id: profileId }
        ));
      }
    };

    void syncPublicProfileFromUrl();

    return () => {
      cancelled = true;
    };
  }, [activeNav, publicProfile]);

  useEffect(() => {
    let cancelled = false;

    const syncJobDetailFromUrl = async () => {
      if (activeNav === 'pre-assessment' && !canAccessPreAssessment) {
        return;
      }

      if (activeNav !== 'job-detail' && activeNav !== 'pre-assessment') {
        return;
      }

      const jobId = getJobIdFromUrl();
      if (!jobId) {
        return;
      }
      if (Number(selectedJob?.id) === Number(jobId)) {
        return;
      }

      try {
        const data = await getJobsFeed();
        if (cancelled) {
          return;
        }
        const sourceJobs = Array.isArray(data?.jobs) ? data.jobs : [];
        const matched = sourceJobs.find((entry) => Number(entry?.id) === Number(jobId));
        if (!matched) {
          setSelectedJob(null);
          return;
        }
        const override = jobCardStateById[jobId] || {};
        setSelectedJob({
          ...matched,
          isSaved: savedJobs.some((entry) => Number(entry?.id) === Number(jobId)),
          ...override,
        });
      } catch {
        if (!cancelled) {
          setSelectedJob(null);
        }
      }
    };

    void syncJobDetailFromUrl();
    return () => {
      cancelled = true;
    };
  }, [activeNav, canAccessPreAssessment, selectedJob, jobCardStateById, savedJobs]);

  useEffect(() => {
    if (activeNav !== 'pre-assessment') {
      return;
    }

    if (!canAccessPreAssessment) {
      const jobId = resolveJobId(selectedJob?.id) || getJobIdFromUrl();
      if (jobId) {
        updateActiveNav('job-detail', { jobId });
        return;
      }
      updateActiveNav('jobs');
      return;
    }

    const jobId = resolveJobId(selectedJob?.id) || getJobIdFromUrl();
    if (!jobId) {
      updateActiveNav('jobs');
      return;
    }

    if (!selectedJobHasApplied) {
      updateActiveNav('job-detail', { jobId });
    }
  }, [activeNav, canAccessPreAssessment, selectedJob?.id, selectedJobHasApplied]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQueryMobile = window.matchMedia('(max-width: 767px)');
    const mediaQueryTablet = window.matchMedia('(max-width: 1023px)');
    const mediaQueryShell = window.matchMedia('(max-width: 1279px)');

    const syncViewportState = () => {
      setIsMobileViewport(mediaQueryMobile.matches);
      setIsTabletViewport(mediaQueryTablet.matches);
      setIsMobileShellViewport(mediaQueryShell.matches);
    };

    syncViewportState();
    mediaQueryMobile.addEventListener('change', syncViewportState);
    mediaQueryTablet.addEventListener('change', syncViewportState);
    mediaQueryShell.addEventListener('change', syncViewportState);

    return () => {
      mediaQueryMobile.removeEventListener('change', syncViewportState);
      mediaQueryTablet.removeEventListener('change', syncViewportState);
      mediaQueryShell.removeEventListener('change', syncViewportState);
    };
  }, []);

  useEffect(() => {
    void syncPostState();
    setSavedJobs([]);
    setSavedPosts([]);
    setApplications(getApplicationsForUser(user));
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = String(window.localStorage.getItem('kapit_notification_preference') || '').trim();
    if (stored === 'jobs_only' || stored === 'jobs_and_messages' || stored === 'all') {
      setNotificationPreference(stored);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSavedJobs = async () => {
      try {
        const data = await getSavedJobs();
        if (mounted) {
          setSavedJobs(data);
        }
      } catch {
        if (mounted) {
          setSavedJobs([]);
        }
      }
    };

    const loadSavedPosts = async () => {
      try {
        const items = await listSavedPosts();

        if (mounted) {
          setSavedPosts(items);
        }
      } catch {
        if (mounted) {
          setSavedPosts([]);
        }
      }
    };

    const loadApplications = async () => {
      try {
        const data = await getMyApplications();
        if (mounted) {
          setApplications(data);
        }
      } catch {
        if (mounted) {
          setApplications(getApplicationsForUser(user));
        }
      }
    };

    loadApplications();
    loadSavedPosts();
    loadSavedJobs();
    window.addEventListener('focus', loadApplications);
    window.addEventListener('focus', loadSavedPosts);
    window.addEventListener('focus', loadSavedJobs);
    return () => {
      mounted = false;
      window.removeEventListener('focus', loadApplications);
      window.removeEventListener('focus', loadSavedPosts);
      window.removeEventListener('focus', loadSavedJobs);
    };
  }, [user]);

  useEffect(() => {
    const syncActivity = () => {
      setApplications(getApplicationsForUser(user));
    };

    window.addEventListener('storage', syncActivity);
    window.addEventListener('focus', syncActivity);
    return () => {
      window.removeEventListener('storage', syncActivity);
      window.removeEventListener('focus', syncActivity);
    };
  }, [user]);

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

    const handleFocus = () => {
      loadUnreadCount();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      mounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const syncPremiumState = async () => {
      setPremiumPopupOpen(false);
      const current = await getCurrentUser();
      if (current?.user) {
        await onUpdateUser?.(current.user, { persist: false });
      }
    };

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== USER_PREMIUM_PAYMENT_SUCCESS) return;
      Promise.resolve(syncPremiumState(event.data)).catch((error) => {
        console.error('User premium payment message handling failed:', error);
      });
    };

    const handleStorage = (event) => {
      if (event.key !== USER_PREMIUM_PAYMENT_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const payload = JSON.parse(event.newValue);
        if (payload?.type !== USER_PREMIUM_PAYMENT_SUCCESS) {
          return;
        }
        Promise.resolve(syncPremiumState(payload)).catch((error) => {
          console.error('User premium payment storage handling failed:', error);
        });
      } catch {
        // Ignore malformed payloads.
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [onUpdateUser]);

  useEffect(() => {
    if (!isMobileShellViewport || activeNav !== 'home') {
      setMobileChromeHidden(false);
      return undefined;
    }

    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (currentY <= 24) {
        setMobileChromeHidden(false);
      } else if (delta > 12) {
        setMobileChromeHidden(true);
      } else if (delta < -8) {
        setMobileChromeHidden(false);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeNav, isMobileShellViewport]);

  useEffect(() => {
    if (activeNav !== 'messages') {
      setMobileThreadOpen(false);
    }
  }, [activeNav]);

  useEffect(() => {
    let cancelled = false;
    const userId = String(user?.id || '').trim();
    if (!userId) {
      return () => {
        cancelled = true;
      };
    }
    if (resumeSyncDoneForUserRef.current === userId) {
      return () => {
        cancelled = true;
      };
    }

    const syncResumeIntoSessionUser = async () => {
      try {
        const response = await developerAPI.getMyProfile();
        if (cancelled) return;
        const profile = response?.profile || {};
        const resumeUrl = String(profile?.resume_url || '').trim();
        const optimizedResumePdfUrl = String(profile?.optimized_resume_pdf_url || '').trim();
        const optimizedResumeDocxUrl = String(profile?.optimized_resume_docx_url || '').trim();
        if (!resumeUrl && !optimizedResumePdfUrl && !optimizedResumeDocxUrl) {
          return;
        }

        const currentResumeUrl = String(user?.resume || user?.resumeUrl || '').trim();
        const currentOptimizedPdf = String(user?.optimizedResumePdfUrl || '').trim();
        const currentOptimizedDocx = String(user?.optimizedResumeDocxUrl || '').trim();
        const hasChange = (
          currentResumeUrl !== resumeUrl
          || currentOptimizedPdf !== optimizedResumePdfUrl
          || currentOptimizedDocx !== optimizedResumeDocxUrl
        );

        resumeSyncDoneForUserRef.current = userId;
        if (!hasChange) {
          return;
        }

        await onUpdateUser?.({
          ...user,
          ...(resumeUrl ? { resume: resumeUrl, resumeUrl } : {}),
          ...(optimizedResumePdfUrl ? { optimizedResumePdfUrl } : {}),
          ...(optimizedResumeDocxUrl ? { optimizedResumeDocxUrl } : {}),
        }, { persist: false });
      } catch {
        // Keep current session user if profile resume sync fails.
      }
    };

    void syncResumeIntoSessionUser();
    return () => {
      cancelled = true;
    };
  }, [onUpdateUser, user?.id, user?.optimizedResumeDocxUrl, user?.optimizedResumePdfUrl, user?.resume, user?.resumeUrl]);

  const handleOpenPremiumMerchantWindow = () => {
    if (isMobileViewport) {
      setPremiumPopupOpen(false);
      window.location.assign(USER_PREMIUM_PAYMENT_PATH);
      return;
    }

    const popup = window.open(USER_PREMIUM_PAYMENT_PATH, 'user-premium-payment', 'width=760,height=860,resizable=yes,scrollbars=yes');
    if (!popup) {
      setPremiumPopupOpen(false);
      window.location.assign(USER_PREMIUM_PAYMENT_PATH);
      return;
    }
    setPremiumPopupOpen(false);
    popup.focus?.();
  };

  const handleCreatePost = async (postInput) => {
    const createdPost = await createPost(postInput);
    const createdId = Number(createdPost?.id);
    if (Number.isInteger(createdId) && createdId > 0) {
      setPosts((current) => mergePostsById([createdPost], current));
      setFeedPosts((current) => mergePostsById([createdPost], current));
      return;
    }
    await syncPostState();
  };

  const handleToggleSavePost = async (post) => {
    const postId = Number(post?.id);
    if (!Number.isInteger(postId) || postId <= 0) {
      return;
    }

    const currentlySaved = savedPosts.some((entry) => Number(entry?.id) === postId);
    if (currentlySaved) {
      await removeSavedPost(postId);
    } else {
      await savePost(postId);
    }

    const items = await listSavedPosts();
    setSavedPosts(items);
  };

  const handleReactToPost = async (postId, reactionType) => {
    const updatedPost = await reactToPost(postId, reactionType);
    if (!applyUpdatedPostLocally(updatedPost)) {
      await syncPostState();
    }
  };

  const handleAddComment = async (postId, commentInput) => {
    const actorName = String(user?.fullName || user?.name || user?.username || 'User').trim() || 'User';
    const actorKey = String(user?.email || user?.username || user?.name || 'anonymous').trim().toLowerCase() || 'anonymous';
    const actorProfileImage = String(user?.profileImage || '').trim();
    const content = typeof commentInput === 'string' ? commentInput : String(commentInput?.content || '');
    const imageUrl = typeof commentInput === 'string' ? '' : String(commentInput?.imageUrl || '').trim();
    const parentCommentIdRaw = typeof commentInput === 'object' ? Number(commentInput?.parentCommentId) : NaN;
    const parentCommentId = Number.isInteger(parentCommentIdRaw) && parentCommentIdRaw > 0 ? parentCommentIdRaw : null;

    const optimisticComment = {
      id: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
      userKey: actorKey,
      author: actorName,
      authorProfileImage: actorProfileImage,
      content,
      imageUrl,
      reactions: [],
      replies: [],
      createdAt: new Date().toISOString(),
    };

    applyPostMutationLocally(postId, (post) => {
      const comments = Array.isArray(post?.comments) ? [...post.comments] : [];
      if (!parentCommentId) {
        return {
          ...post,
          comments: [optimisticComment, ...comments],
        };
      }

      return {
        ...post,
        comments: comments.map((entry) => (
          Number(entry?.id) === parentCommentId
            ? {
                ...entry,
                replies: [...(Array.isArray(entry?.replies) ? entry.replies : []), optimisticComment],
              }
            : entry
        )),
      };
    });

    try {
      const updatedPost = await addCommentToPost(postId, commentInput);
      if (!applyUpdatedPostLocally(updatedPost)) {
        await syncPostState();
      }
    } catch {
      await syncPostState();
    }
  };

  const handleReactToComment = async (postId, commentId, reactionType, parentCommentId = null) => {
    const actorName = String(user?.fullName || user?.name || user?.username || 'User').trim() || 'User';
    const actorKey = String(user?.email || user?.username || user?.name || 'anonymous').trim().toLowerCase() || 'anonymous';
    const actorProfileImage = String(user?.profileImage || '').trim();
    const actorAccountType = String(user?.accountType || (user?.type === 'company' ? 'company' : 'developer')).trim();
    const actorUserType = String(user?.type || '').trim();
    const normalizedReaction = String(reactionType || '').trim().toLowerCase();
    const targetCommentId = Number(commentId);
    const targetParentId = parentCommentId == null ? null : Number(parentCommentId);

    const toggleCommentReaction = (comment) => {
      if (!comment || Number(comment?.id) !== targetCommentId) {
        return comment;
      }
      const reactions = Array.isArray(comment?.reactions) ? [...comment.reactions] : [];
      const existingIndex = reactions.findIndex((entry) => String(entry?.userKey || '') === actorKey);

      if (!normalizedReaction) {
        if (existingIndex >= 0) {
          reactions.splice(existingIndex, 1);
        }
      } else {
        const nextReaction = {
          userKey: actorKey,
          userName: actorName,
          profileImage: actorProfileImage,
          accountType: actorAccountType,
          userType: actorUserType,
          type: normalizedReaction,
          updatedAt: new Date().toISOString(),
        };
        if (existingIndex >= 0) {
          reactions[existingIndex] = nextReaction;
        } else {
          reactions.push(nextReaction);
        }
      }

      return {
        ...comment,
        reactions,
      };
    };

    applyPostMutationLocally(postId, (post) => {
      const comments = Array.isArray(post?.comments) ? [...post.comments] : [];
      const nextComments = comments.map((entry) => {
        if (targetParentId && Number(entry?.id) === targetParentId) {
          return {
            ...entry,
            replies: (Array.isArray(entry?.replies) ? entry.replies : []).map((reply) => toggleCommentReaction(reply)),
          };
        }
        if (!targetParentId) {
          return toggleCommentReaction(entry);
        }
        return entry;
      });

      return {
        ...post,
        comments: nextComments,
      };
    });

    try {
      const updatedPost = await reactToCommentOnPost(postId, commentId, reactionType, parentCommentId);
      if (!applyUpdatedPostLocally(updatedPost)) {
        await syncPostState();
      }
    } catch {
      await syncPostState();
    }
  };

  const handleToggleSharePost = async (postId, shareInput) => {
    const updatedPost = await toggleSharePost(postId, shareInput);
    if (!applyUpdatedPostLocally(updatedPost)) {
      await syncPostState();
    }
  };

  const handleDeletePost = async (postId) => {
    await deletePost(postId);
    setPosts((current) => (Array.isArray(current) ? current.filter((item) => Number(item?.id) !== Number(postId)) : []));
    setFeedPosts((current) => (Array.isArray(current) ? current.filter((item) => Number(item?.id) !== Number(postId)) : []));
  };
  const handleSubmitSearch = ({ query, scope }) => {
    const normalizedQuery = String(query || '').trim();
    if (!normalizedQuery) {
      return;
    }
    setSearchPageQuery(normalizedQuery);
    setSearchPageScope(String(scope || 'all'));
    updateActiveNav('search');
  };

  const resolvePublicProfileBackTarget = () => {
    if (activeNav === 'job-detail' || activeNav === 'pre-assessment') {
      const jobId = resolveJobId(selectedJob?.id);
      if (jobId) {
        return { nav: activeNav, options: { jobId } };
      }
      return { nav: 'jobs', options: {} };
    }

    if (USER_NAV_TABS.has(activeNav) && activeNav !== 'public-profile') {
      return { nav: activeNav, options: {} };
    }

    return { nav: 'home', options: {} };
  };

  const handleBackFromPublicProfile = () => {
    const nextNav = USER_NAV_TABS.has(publicProfileBackTarget?.nav)
      ? publicProfileBackTarget.nav
      : 'home';
    const nextOptions = publicProfileBackTarget?.options || {};
    updateActiveNav(nextNav, nextOptions);
  };

  const handleOpenPublicProfile = async (result) => {
    const profileId = resolveProfileIdFromResult(result);
    if (!profileId) {
      return;
    }

    // Navigate immediately so tapping a search result always opens the profile view.
    setPublicProfile({
      ...(result || {}),
      id: profileId,
    });
    setPublicProfileBackTarget(resolvePublicProfileBackTarget());
    updateActiveNav('public-profile', { profileId });

    try {
      const profile = await getPublicProfile(profileId);
      setPublicProfile({
        ...(result || {}),
        id: profileId,
        ...profile,
      });
    } catch {
      // Keep the fallback data already shown in the public profile page.
    }
  };

  const handleOpenCompanyProfileFromJob = async (job) => {
    const companyProfileId = resolveProfileId(
      job?.company?.userId || job?.company?.id || job?.company?.companyId
    );
    if (!companyProfileId) {
      return;
    }

    setPublicProfile({
      id: companyProfileId,
      type: 'company',
      companyName: job?.company?.name || '',
      profileImage: job?.company?.logo || '',
    });
    setPublicProfileBackTarget(resolvePublicProfileBackTarget());
    updateActiveNav('public-profile', { profileId: companyProfileId });

    try {
      const profile = await getPublicProfile(companyProfileId);
      setPublicProfile({
        id: companyProfileId,
        ...profile,
      });
    } catch {
      // Keep fallback profile info.
    }
  };

  const handleOpenJobDetail = (job) => {
    const jobId = resolveJobId(job?.id);
    if (!jobId) {
      return;
    }
    const override = jobCardStateById[jobId] || {};
    setSelectedJob({
      ...job,
      id: jobId,
      isSaved: typeof job?.isSaved === 'boolean'
        ? job.isSaved
        : savedJobs.some((entry) => Number(entry?.id) === jobId),
      ...override,
    });
    updateActiveNav('job-detail', { jobId });
  };

  const handleOpenPreAssessment = (job) => {
    if (!canAccessPreAssessment) {
      setPremiumPopupOpen(true);
      return;
    }

    const jobId = resolveJobId(job?.id || selectedJob?.id);
    if (!jobId) {
      return;
    }

    const sourceJob = job || selectedJob || {};
    const hasApplied = Boolean(sourceJob?.hasApplied);
    if (!hasApplied) {
      updateActiveNav('job-detail', { jobId });
      return;
    }

    const override = jobCardStateById[jobId] || {};
    setSelectedJob({
      ...sourceJob,
      id: jobId,
      isSaved: typeof sourceJob?.isSaved === 'boolean'
        ? sourceJob.isSaved
        : savedJobs.some((entry) => Number(entry?.id) === jobId),
      ...override,
    });
    updateActiveNav('pre-assessment', { jobId });
  };

  const handleJobMutation = (jobId, updates = {}) => {
    const resolvedId = resolveJobId(jobId);
    if (!resolvedId) {
      return;
    }

    setJobCardStateById((current) => ({
      ...current,
      [resolvedId]: {
        ...(current[resolvedId] || {}),
        ...updates,
      },
    }));

    setSelectedJob((current) => {
      if (!current || Number(current.id) !== resolvedId) {
        return current;
      }
      return {
        ...current,
        ...updates,
      };
    });
  };

  const followingEntries = React.useMemo(() => {
    const normalizeEntry = (entry, defaultType = 'User') => {
      if (!entry) return null;
      if (typeof entry === 'string') {
        const name = entry.trim();
        return name ? { name, type: defaultType } : null;
      }
      const name = String(entry?.name || entry?.fullName || entry?.username || entry?.companyName || entry?.email || '').trim();
      if (!name) return null;
      const type = String(entry?.type || entry?.accountType || defaultType).toLowerCase().includes('company') ? 'Company' : defaultType;
      return { name, type };
    };

    const combined = [
      ...(Array.isArray(user?.following) ? user.following : []),
      ...(Array.isArray(user?.followings) ? user.followings : []),
      ...(Array.isArray(user?.followingUsers) ? user.followingUsers : []),
      ...(Array.isArray(user?.followingCompanies) ? user.followingCompanies : []),
    ];

    const seen = new Set();
    const items = [];
    combined.forEach((entry) => {
      const normalized = normalizeEntry(entry, 'User');
      if (!normalized) return;
      const key = normalized.name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      items.push(normalized);
    });
    return items;
  }, [user]);

  const likedByEntries = React.useMemo(() => {
    const byUser = new Map();
    (Array.isArray(posts) ? posts : []).forEach((post) => {
      const postTitle = String(post?.content || 'Untitled post').trim().slice(0, 60) || 'Untitled post';
      const reactions = Array.isArray(post?.reactions) ? post.reactions : [];
      reactions.forEach((reaction) => {
        const reactionType = String(reaction?.type || '').trim().toLowerCase();
        if (!reactionType) return;
        const key = String(reaction?.userKey || reaction?.username || reaction?.userName || '').trim();
        if (!key) return;
        const displayName = String(reaction?.userName || reaction?.username || key.split('@')[0] || 'User').trim();
        const existing = byUser.get(key) || { name: displayName, type: 'User', meta: [] };
        existing.meta.push(`Reacted to: ${postTitle}`);
        byUser.set(key, existing);
      });
    });
    return Array.from(byUser.values());
  }, [posts]);

  const handleMessageProfile = (profile) => {
    if (!profile?.id) {
      return;
    }
    setMessageTargetId(profile.id);
    updateActiveNav('messages');
  };

  return (
    <div className={`min-h-[100dvh] no-scrollbar transition-colors duration-150 ease-out ${pageBackgroundClass} ${isResumeAtsPreviewActive ? 'overflow-hidden' : ''}`}>
      <UserNavbar
        activeNav={activeNav}
        setActiveNav={updateActiveNav}
        user={user}
        mobileHidden={effectiveMobileChromeHidden}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onHelp={() => updateActiveNav('help', { preserveSettingsReturn: true })}
        onLogout={onLogout}
        onOpenSettings={() => updateActiveNav('settings')}
        onOpenTips={() => updateActiveNav('tips')}
        onOpenVerifiedDirectory={() => updateActiveNav('verified')}
        onOpenPremium={() => setPremiumPopupOpen(true)}
        onOpenPublicProfile={handleOpenPublicProfile}
        onSubmitSearch={handleSubmitSearch}
        onOpenMyProfile={() => updateActiveNav('my-profile')}
        onOpenProjects={() => updateActiveNav('projects')}
        onOpenSavedJobs={() => updateActiveNav('saved-jobs')}
        onOpenApplications={() => updateActiveNav('applications')}
        unreadNotificationCount={unreadNotificationCount}
      />

      <div
        className={`mx-auto w-full ${
          isEdgeToEdgeView
            ? 'max-w-none px-0 pt-0'
            : isResumeAtsPreviewActive
              ? 'max-w-[min(100%,1800px)] px-3 pt-0 sm:px-5 lg:px-6 xl:px-7 2xl:px-9'
            : isSearchActive
              ? 'max-w-[min(100%,1800px)] pb-28 pt-0 px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 xl:pt-0 xl:pb-8'
            : 'max-w-[min(100%,1800px)] pb-28 pt-4 px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 xl:py-6 xl:pb-8'
        }`}
        style={isEdgeToEdgeView
          ? {
              paddingBottom: (isMessagesActive && mobileThreadOpen) ? 0 : mobileSafeAreaBottomPadding,
              paddingTop: (isSettingsActive || (isMessagesActive && mobileThreadOpen))
                ? 0
                : isMessagesActive
                  ? (isMobileShellViewport ? 'calc(3.5rem + max(0.45rem, env(safe-area-inset-top)))' : '0.5rem')
                  : 'calc(3.5rem + max(0.45rem, env(safe-area-inset-top)))',
              height: isMobileShellViewport ? '100dvh' : (isSettingsActive ? 'auto' : 'calc(100dvh - 4rem)'),
            }
          : isResumeAtsPreviewActive
            ? {
                paddingBottom: 0,
                paddingTop: isMobileShellViewport ? 'calc(3.5rem + max(0.45rem, env(safe-area-inset-top)))' : '1rem',
                height: isMobileShellViewport ? '100dvh' : 'calc(100dvh - 4rem)',
                overflow: 'hidden',
              }
            : { paddingBottom: mobileSafeAreaBottomPadding }}
      >
        {canReturnToSettings && ['my-profile', 'projects', 'saved-jobs', 'applications'].includes(activeNav) && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setCanReturnToSettings(false);
                updateActiveNav('settings-account');
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] bg-[#f8fbf6] px-3.5 py-2 text-sm font-semibold text-[#3a5a40] shadow-sm transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:bg-[#22272b] dark:text-white dark:hover:bg-[#202428]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}
        {activeNav === 'home' && (
          <div className="mx-auto grid w-full max-w-[min(100%,1680px)] grid-cols-1 gap-6 xl:grid-cols-12 2xl:gap-8">
            <aside className="hidden xl:block xl:col-span-3">
              <UserLeftSidebar
                user={user}
                userType={userType}
                onOpenPremium={() => setPremiumPopupOpen(true)}
                onOpenMyProfile={() => updateActiveNav('my-profile')}
                onOpenProjects={() => updateActiveNav('projects')}
                onOpenSavedJobs={() => updateActiveNav('saved-jobs')}
                onOpenApplications={() => updateActiveNav('applications')}
              />
            </aside>
            <main className="xl:col-span-9 2xl:col-span-6">
              <CenterFeed
                loading={loadingPosts}
                loadingMorePosts={loadingMorePosts}
                hasMorePosts={hasMoreFeedPosts}
                onLoadMorePosts={loadMoreFeedPosts}
                user={user}
                userType={userType}
                onOpenComposer={() => setComposerOpen(true)}
                posts={feedPosts}
                savedPostIds={savedPosts.map((entry) => Number(entry?.id)).filter((id) => Number.isInteger(id) && id > 0)}
                onToggleSavePost={handleToggleSavePost}
                onReactToPost={handleReactToPost}
                onAddComment={handleAddComment}
                onReactToComment={handleReactToComment}
                onToggleSharePost={handleToggleSharePost}
                onDeletePost={handleDeletePost}
                onBrowsePeople={() => updateActiveNav('jobs')}
                onExploreProjects={() => updateActiveNav('projects')}
              />
            </main>
            <aside className="hidden 2xl:block 2xl:col-span-3">
              <UserRightSidebar userType={userType} />
            </aside>
          </div>
        )}

        {activeNav === 'my-profile' && (
          <UserMyProfilePage
            user={user}
            posts={posts}
            savedPostIds={savedPosts.map((entry) => Number(entry?.id)).filter((id) => Number.isInteger(id) && id > 0)}
            onUpdateUser={onUpdateUser}
            onOpenComposer={() => setComposerOpen(true)}
            onToggleSavePost={handleToggleSavePost}
            onReactToPost={handleReactToPost}
            onAddComment={handleAddComment}
            onReactToComment={handleReactToComment}
            onToggleSharePost={handleToggleSharePost}
            onDeletePost={handleDeletePost}
            onOpenResumeViewer={(payload) => {
              setResumeViewerPayload({
                resumeUrl: String(payload?.resumeUrl || '').trim(),
                isAts: Boolean(payload?.isAts),
                fileLabel: String(payload?.fileLabel || 'Resume'),
              });
              updateActiveNav('resume-viewer');
            }}
          />
        )}
        {activeNav === 'resume-viewer' && (
          <UserResumeProfileViewerPage
            resumeUrl={resumeViewerPayload.resumeUrl}
            isAts={resumeViewerPayload.isAts}
            fileLabel={resumeViewerPayload.fileLabel}
            onBack={() => updateActiveNav('my-profile')}
          />
        )}

        {activeNav === 'jobs' && (
          <UserJobsPage
            userType={userType}
            user={user}
            jobCardStateById={jobCardStateById}
            onOpenCompanyProfile={handleOpenCompanyProfileFromJob}
            onOpenJobDetail={handleOpenJobDetail}
          />
        )}
        {activeNav === 'job-detail' && (
          <UserJobDetailPage
            user={user}
            job={selectedJob}
            onBack={() => updateActiveNav('jobs')}
            onOpenCompanyProfile={handleOpenCompanyProfileFromJob}
            onJobMutation={handleJobMutation}
            onOpenPreAssessment={handleOpenPreAssessment}
          />
        )}
        {activeNav === 'pre-assessment' && (
          <UserPreAssessmentPage
            job={selectedJob}
            onBack={() => {
              const jobId = resolveJobId(selectedJob?.id);
              if (jobId) {
                updateActiveNav('job-detail', { jobId });
                return;
              }
              updateActiveNav('jobs');
            }}
          />
        )}
        {activeNav === 'search' && (
          <UserSearchResultsPage
            initialQuery={searchPageQuery}
            initialScope={searchPageScope}
            onBack={() => updateActiveNav('home')}
            onOpenPublicProfile={handleOpenPublicProfile}
          />
        )}
        {activeNav === 'projects' && <UserProjectsPage userType={userType} user={user} onUpdateUser={onUpdateUser} />}
        {activeNav === 'saved-jobs' && (
          <UserSavedJobsPanel
            savedJobs={savedJobs}
            savedPosts={savedPosts}
          />
        )}
        {activeNav === 'applications' && (
          <UserApplicationsPanel
            applications={applications}
          />
        )}
        {activeNav === 'messages' && (
          <UserMessagesPage
            user={user}
            initialContactId={messageTargetId}
            onThreadVisibilityChange={(open) => {
              setMobileThreadOpen(Boolean(open));
            }}
          />
        )}
        {activeNav === 'notifications' && <UserNotificationsPage user={user} onReadAll={() => setUnreadNotificationCount(0)} />}
        {activeNav === 'help' && <HelpPage onBack={() => updateActiveNav('home')} />}
        {activeNav === 'tips' && <TipsPanel />}
        {activeNav === 'verified' && <VerifiedProfilesPanel />}
        {activeNav === 'public-profile' && (
          <PublicProfilePage
            profile={publicProfile}
            viewer={user}
            savedPostIds={savedPosts.map((entry) => Number(entry?.id)).filter((id) => Number.isInteger(id) && id > 0)}
            onBack={handleBackFromPublicProfile}
            onMessage={handleMessageProfile}
            onToggleSavePost={handleToggleSavePost}
            onReactToPost={handleReactToPost}
            onAddComment={handleAddComment}
            onReactToComment={handleReactToComment}
            onToggleSharePost={handleToggleSharePost}
          />
        )}
        {activeNav === 'settings' && (
          <UserSettingsPage
            user={user}
            onBack={() => updateActiveNav('home')}
            onOpenAccountDetails={() => updateActiveNav('settings-account')}
            onOpenCareerPreferences={() => updateActiveNav('settings-career')}
            onOpenPrivacySettings={() => updateActiveNav('privacy-settings')}
            onOpenSavedJobs={() => updateActiveNav('settings-saved-jobs')}
            onOpenApplications={() => updateActiveNav('settings-applications')}
            onOpenNotifications={() => updateActiveNav('settings-notifications')}
            onOpenFaq={() => setFaqOpen(true)}
            onOpenTerms={() => setTermsOpen(true)}
            onOpenPrivacy={() => setPrivacyOpen(true)}
            onOpenCookies={() => setCookiesOpen(true)}
          />
        )}
        {activeNav === 'settings-account' && (
          <UserAccountSettingsModal
            isOpen
            asPage
            user={user}
            mode="account"
            onClose={() => updateActiveNav('settings')}
            onSave={(nextUser) => onUpdateUser?.(nextUser, { persist: false })}
          />
        )}
        {activeNav === 'settings-career' && (
          <UserAccountSettingsModal
            isOpen
            asPage
            user={user}
            mode="career"
            onClose={() => updateActiveNav('settings')}
            onSave={(nextUser) => onUpdateUser?.(nextUser, { persist: false })}
            onResumeUploadComplete={(payload) => {
              setResumeUploadPreview({
                resumeUrl: String(payload?.resumeUrl || ''),
                fileName: String(payload?.fileName || ''),
                contentType: String(payload?.contentType || ''),
                extractedTextPreview: String(payload?.extractedTextPreview || ''),
                optimized: null,
                optimizedDocxUrl: '',
                optimizedPdfUrl: '',
                optimizing: false,
                optimizeError: '',
                applyingOptimizedResume: false,
                applyOptimizedError: '',
              });
              updateActiveNav('settings-resume-ats');
            }}
          />
        )}
        {activeNav === 'settings-resume-ats' && (
          <UserResumeAtsPreviewPage
            user={user}
            resumeUrl={resumeUploadPreview.resumeUrl}
            fileName={resumeUploadPreview.fileName}
            contentType={resumeUploadPreview.contentType}
            extractedTextPreview={resumeUploadPreview.extractedTextPreview}
            optimized={resumeUploadPreview.optimized}
            optimizedDocxUrl={resumeUploadPreview.optimizedDocxUrl}
            optimizedPdfUrl={resumeUploadPreview.optimizedPdfUrl}
            optimizing={resumeUploadPreview.optimizing}
            optimizeError={resumeUploadPreview.optimizeError}
            onOptimize={async () => {
              setResumeUploadPreview((prev) => ({ ...prev, optimizing: true, optimizeError: '', applyOptimizedError: '' }));
              try {
                const result = await developerAPI.optimizeResume();
                setResumeUploadPreview((prev) => ({
                  ...prev,
                  optimizing: false,
                  optimized: result?.optimized || null,
                  optimizedDocxUrl: String(result?.optimizedDocxUrl || ''),
                  optimizedPdfUrl: String(result?.optimizedPdfUrl || ''),
                  extractedTextPreview: String(result?.sourceResumeText || prev.extractedTextPreview || ''),
                  optimizeError: '',
                }));
              } catch (error) {
                setResumeUploadPreview((prev) => ({
                  ...prev,
                  optimizing: false,
                  optimizeError: String(error?.message || 'Failed to optimize resume.'),
                }));
              }
            }}
            onUseOptimizedResume={async () => {
              setResumeUploadPreview((prev) => ({ ...prev, applyingOptimizedResume: true, applyOptimizedError: '' }));
              try {
                const result = await developerAPI.useOptimizedResume();
                const nextResumeUrl = String(result?.resumeUrl || result?.optimizedPdfUrl || result?.optimizedDocxUrl || '').trim();
                const nextOptimizedPdfUrl = String(result?.optimizedPdfUrl || resumeUploadPreview.optimizedPdfUrl || '').trim();
                const nextOptimizedDocxUrl = String(result?.optimizedDocxUrl || resumeUploadPreview.optimizedDocxUrl || '').trim();

                if (nextResumeUrl) {
                  try {
                    const me = await getCurrentUser();
                    const nextUser = me?.user
                      ? {
                          ...me.user,
                          resume: nextResumeUrl,
                          resumeUrl: nextResumeUrl,
                          optimizedResumePdfUrl: nextOptimizedPdfUrl,
                          optimizedResumeDocxUrl: nextOptimizedDocxUrl,
                        }
                      : null;
                    if (nextUser) {
                      await onUpdateUser?.(nextUser, { persist: false });
                    } else {
                      await onUpdateUser?.({
                        ...user,
                        resume: nextResumeUrl,
                        resumeUrl: nextResumeUrl,
                        optimizedResumePdfUrl: nextOptimizedPdfUrl,
                        optimizedResumeDocxUrl: nextOptimizedDocxUrl,
                      }, { persist: false });
                    }
                  } catch {
                    await onUpdateUser?.({
                      ...user,
                      resume: nextResumeUrl,
                      resumeUrl: nextResumeUrl,
                      optimizedResumePdfUrl: nextOptimizedPdfUrl,
                      optimizedResumeDocxUrl: nextOptimizedDocxUrl,
                    }, { persist: false });
                  }
                }

                setResumeUploadPreview((prev) => ({
                  ...prev,
                  applyingOptimizedResume: false,
                  applyOptimizedError: '',
                  resumeUrl: nextResumeUrl || prev.resumeUrl,
                  optimizedPdfUrl: nextOptimizedPdfUrl || prev.optimizedPdfUrl,
                  optimizedDocxUrl: nextOptimizedDocxUrl || prev.optimizedDocxUrl,
                }));
                updateActiveNav('my-profile');
              } catch (error) {
                setResumeUploadPreview((prev) => ({
                  ...prev,
                  applyingOptimizedResume: false,
                  applyOptimizedError: String(error?.message || 'Failed to use ATS resume in your profile.'),
                }));
              }
            }}
            applyingOptimizedResume={resumeUploadPreview.applyingOptimizedResume}
            applyOptimizedError={resumeUploadPreview.applyOptimizedError}
            onBack={() => updateActiveNav('settings-career')}
          />
        )}
        {activeNav === 'settings-notifications' && (
          <UserNotificationSettingsPage
            onBack={() => updateActiveNav('settings')}
            value={notificationPreference}
            onChange={(next) => {
              setNotificationPreference(next);
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('kapit_notification_preference', next);
              }
            }}
          />
        )}
        {activeNav === 'settings-saved-jobs' && (
          <UserSavedJobsSettingsPage
            onBack={() => updateActiveNav('settings')}
            savedJobs={savedJobs}
            savedPosts={savedPosts}
          />
        )}
        {activeNav === 'settings-applications' && (
          <UserApplicationsSettingsPage
            onBack={() => updateActiveNav('settings')}
            applications={applications}
          />
        )}
        {activeNav === 'privacy-settings' && (
          <UserPrivacySettingsPage
            onBack={() => updateActiveNav('settings')}
            onOpenPage={(page) => updateActiveNav(page)}
          />
        )}
        {activeNav === 'privacy-change-password' && (
          <UserPrivacyChangePasswordPage
            onBack={() => updateActiveNav('privacy-settings')}
            onProceed={() => window.location.assign('/forgot-password')}
          />
        )}
        {activeNav === 'privacy-comments' && (
          <UserPrivacyCommentsPage
            onBack={() => updateActiveNav('privacy-settings')}
            onOpenNotifications={() => updateActiveNav('settings-notifications')}
          />
        )}
        {activeNav === 'privacy-mentions' && (
          <UserPrivacyMentionsPage
            onBack={() => updateActiveNav('privacy-settings')}
            onOpenNotifications={() => updateActiveNav('settings-notifications')}
          />
        )}
        {activeNav === 'privacy-following' && (
          <UserPrivacyFollowingPage
            onBack={() => updateActiveNav('privacy-settings')}
            items={followingEntries}
          />
        )}
        {activeNav === 'privacy-likes' && (
          <UserPrivacyLikesPage
            onBack={() => updateActiveNav('privacy-settings')}
            items={likedByEntries}
          />
        )}
      </div>

      <UserPremiumPopup
        isOpen={premiumPopupOpen}
        onClose={() => setPremiumPopupOpen(false)}
        user={user}
        onOpenMerchantWindow={handleOpenPremiumMerchantWindow}
      />
      <PostComposerModal isOpen={composerOpen} user={user} onClose={() => setComposerOpen(false)} onSubmit={handleCreatePost} />
      <UserFaqModal
        isOpen={faqOpen}
        onClose={() => setFaqOpen(false)}
      />
      <TermsAndConditionsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />
      <PrivacyPolicyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
      <CookiesPolicyModal
        isOpen={cookiesOpen}
        onClose={() => setCookiesOpen(false)}
      />
      <UserMobileBottomNav
        activeNav={activeNav}
        setActiveNav={updateActiveNav}
        hiddenOnScroll={effectiveMobileChromeHidden}
        unreadNotificationCount={unreadNotificationCount}
      />
    </div>
  );
}

function TipsPanel() {
  const tips = [
    {
      title: 'Keep your profile headline specific',
      description: 'Use your role, years of experience, and strongest stack so recruiters can quickly understand where you fit.',
    },
    {
      title: 'Show proof of work',
      description: 'Add project links, GitHub repositories, screenshots, or demos so companies can verify your skills faster.',
    },
    {
      title: 'Write measurable achievements',
      description: 'Replace generic task lists with outcomes like performance improvements, launches, user growth, or systems you owned.',
    },
    {
      title: 'Stay active and updated',
      description: 'Refresh your skills, preferred role, and recent work regularly so your profile stays competitive in search results.',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[min(100%,1200px)] space-y-5">
      <div className="rounded-[24px] border border-[#a3b18a] bg-[#f8fbf6] p-6 shadow-[0_18px_48px_rgba(58,90,64,0.08)] dark:border-[#353c44] dark:bg-[#22272b] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="flex flex-col min-[420px]:flex-row items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#3a5a40] dark:bg-[#2a2f35] dark:text-[#e2b94d]">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl min-[420px]:text-2xl font-extrabold text-[#3a5a40] dark:text-white">Tips</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tips.map((tip) => (
          <div key={tip.title} className="rounded-[24px] border border-[#bfd0af] bg-[#f8fbf6] p-5 shadow-[0_12px_32px_rgba(58,90,64,0.06)] dark:border-[#444d57] dark:bg-[#22272b] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#588157] dark:bg-[#2a2f35] dark:text-[#e2b94d]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#3a5a40] dark:text-white">{tip.title}</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#344e41] dark:text-[#e2e6e9]">{tip.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerifiedProfilesPanel() {
  const verifiedGroups = [
    {
      title: 'Verified Users',
      icon: UserCircle,
      items: [
        'Developers with a completed profile and visible portfolio links.',
        'Profiles that consistently keep skills, experience, and contact details updated.',
        'Candidates with stronger trust signals for companies reviewing applications.',
      ],
    },
    {
      title: 'Verified Companies',
      icon: Building2,
      items: [
        'Companies with a completed hiring profile and clear company details.',
        'Organizations that present more trustworthy hiring information to applicants.',
        'Businesses with stronger visibility for serious developer outreach.',
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[min(100%,1200px)] space-y-5">
      <div className="rounded-[24px] border border-[#a3b18a] bg-[#f8fbf6] p-6 shadow-[0_18px_48px_rgba(58,90,64,0.08)] dark:border-[#353c44] dark:bg-[#22272b] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="flex flex-col min-[420px]:flex-row items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#3a5a40] dark:bg-[#2a2f35] dark:text-[#e2b94d]">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl min-[420px]:text-2xl font-extrabold text-[#3a5a40] dark:text-white">Verified Users & Companies</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {verifiedGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="rounded-[24px] border border-[#bfd0af] bg-[#f8fbf6] p-5 shadow-[0_12px_32px_rgba(58,90,64,0.06)] dark:border-[#444d57] dark:bg-[#22272b] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#588157] dark:bg-[#2a2f35] dark:text-[#e2b94d]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#3a5a40] dark:text-white">{group.title}</h3>
              </div>
              <div className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <div key={item} className="rounded-2xl bg-[#f8fbf6] px-4 py-3 text-sm leading-7 text-[#344e41] dark:bg-[#202428] dark:text-[#e2e6e9]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
