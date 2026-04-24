import React, { useEffect, useRef, useState } from 'react';
import UserNavbar from '@userComponents/UserNavbar';
import UserLeftSidebar from '@userComponents/UserLeftSidebar';
import UserRightSidebar from '@userComponents/UserRightSidebar';
import CenterFeed from './UserCenterFeed';
import UserJobsPage from '@userPages/jobs/UserJobsPage';
import UserJobDetailPage from '@userPages/jobs/UserJobDetailPage';
import UserProjectsPage from '@userPages/projects/UserProjectsPage';
import UserSearchResultsPage from '@userPages/search/UserSearchResultsPage';
import UserMessagesPage from '@userPages/messages/UserMessagesPage';
import UserNotificationsPage from '@userPages/notifications/UserNotificationsPage';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';
import HelpPage from '@sharedPages/help/HelpPage';
import UserPremiumPopup from '@userPages/premium/UserPremiumPopup';
import { USER_PREMIUM_PAYMENT_PATH, USER_PREMIUM_PAYMENT_SUCCESS } from '@userPages/premium/UserPremiumPopup';
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
import UserMobileBottomNav from '@userComponents/navigation/mobile/UserMobileBottomNav';
import UserApplicationsPanel from './UserApplicationsPanel';
import UserSavedJobsPanel from './UserSavedJobsPanel';
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
import { getJobsFeed, getMyApplications, getPublicProfile, getSavedJobs } from '@sharedServices/authService';
import { getUnreadNotificationCount } from '@sharedServices/notificationsService';
import { ArrowLeft, BadgeCheck, Building2, Lightbulb, Sparkles, UserCircle } from 'lucide-react';
import { getApplicationsForUser } from '@userFeatures/activity/userActivityStorage';

const USER_NAV_QUERY_KEY = 'tab';
const USER_PROFILE_QUERY_KEY = 'profileId';
const USER_JOB_QUERY_KEY = 'jobId';
const USER_NAV_TABS = new Set(['home', 'jobs', 'job-detail', 'projects', 'search', 'messages', 'notifications', 'saved-jobs', 'applications', 'my-profile', 'help', 'tips', 'verified', 'settings', 'public-profile', 'settings-account', 'settings-career', 'settings-notifications', 'settings-saved-jobs', 'settings-applications', 'privacy-settings', 'privacy-change-password', 'privacy-comments', 'privacy-mentions', 'privacy-following', 'privacy-likes']);
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
  if (nextNav === 'job-detail' && jobId) {
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
  const lastScrollYRef = useRef(0);
  const isMessagesActive = activeNav === 'messages';
  const isSettingsActive = activeNav === 'settings';
  const isSearchActive = activeNav === 'search';
  const isEdgeToEdgeView = isMessagesActive || isSettingsActive;
  const pageBackgroundClass = isMessagesActive ? 'bg-[#dad7cd] dark:bg-[#121212]' : 'bg-[#dad7cd] dark:bg-[#121416]';
  const hideMobileChromeForMessages = isTabletViewport && isMessagesActive && mobileThreadOpen;
  const effectiveMobileChromeHidden = mobileChromeHidden || hideMobileChromeForMessages;
  const mobileSafeAreaBottomPadding = isMobileShellViewport
    ? effectiveMobileChromeHidden
      ? 'max(1.75rem, calc(env(safe-area-inset-bottom) + 1rem))'
      : 'max(7rem, calc(env(safe-area-inset-bottom) + 5.75rem))'
    : undefined;

  const syncPostState = async () => {
    try {
      const [myPosts, allFeedPosts] = await Promise.all([
        listMyPosts(),
        listFeedPosts(),
      ]);

      setPosts(myPosts);
      setFeedPosts(allFeedPosts);
    } catch {
      setPosts([]);
      setFeedPosts([]);
    }
  };

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
      jobId: activeNav === 'job-detail' ? resolveJobId(selectedJob?.id) : null,
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
      if (activeNav !== 'job-detail') {
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
  }, [activeNav, selectedJob, jobCardStateById, savedJobs]);

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
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== USER_PREMIUM_PAYMENT_SUCCESS) return;

      const syncPremiumState = async () => {
        setPremiumPopupOpen(false);
        if (event.data?.updates) {
          await onUpdateUser?.(event.data.updates);
        }
      };

      Promise.resolve(syncPremiumState()).catch((error) => {
        console.error('User premium payment message handling failed:', error);
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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
    await createPost(postInput);
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
    await reactToPost(postId, reactionType);
    await syncPostState();
  };

  const handleAddComment = async (postId, content) => {
    await addCommentToPost(postId, content);
    await syncPostState();
  };

  const handleReactToComment = async (postId, commentId, reactionType, parentCommentId = null) => {
    await reactToCommentOnPost(postId, commentId, reactionType, parentCommentId);
    await syncPostState();
  };

  const handleToggleSharePost = async (postId, shareInput) => {
    await toggleSharePost(postId, shareInput);
    await syncPostState();
  };

  const handleDeletePost = async (postId) => {
    await deletePost(postId);
    await syncPostState();
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
    if (activeNav === 'job-detail') {
      const jobId = resolveJobId(selectedJob?.id);
      if (jobId) {
        return { nav: 'job-detail', options: { jobId } };
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
    <div className={`min-h-[100dvh] no-scrollbar transition-colors duration-150 ease-out ${pageBackgroundClass}`}>
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
            onSave={onUpdateUser}
          />
        )}
        {activeNav === 'settings-career' && (
          <UserAccountSettingsModal
            isOpen
            asPage
            user={user}
            mode="career"
            onClose={() => updateActiveNav('settings')}
            onSave={onUpdateUser}
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
