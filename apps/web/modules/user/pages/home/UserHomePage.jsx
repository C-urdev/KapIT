import React, { useEffect, useRef, useState } from 'react';
import UserNavbar from '@userComponents/UserNavbar';
import UserLeftSidebar from '@userComponents/UserLeftSidebar';
import UserRightSidebar from '@userComponents/UserRightSidebar';
import CenterFeed from './UserCenterFeed';
import UserJobsPage from '@userPages/jobs/UserJobsPage';
import UserProjectsPage from '@userPages/projects/UserProjectsPage';
import UserMessagesPage from '@userPages/messages/UserMessagesPage';
import UserNotificationsPage from '@userPages/notifications/UserNotificationsPage';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';
import HelpPage from '@sharedPages/help/HelpPage';
import UserPremiumPopup from '@userPages/premium/UserPremiumPopup';
import { USER_PREMIUM_PAYMENT_PATH, USER_PREMIUM_PAYMENT_SUCCESS } from '@userPages/premium/UserPremiumPopup';
import PostComposerModal from '@userFeatures/posts/UserPostComposerModal';
import UserMyProfilePage from '@userFeatures/profile/UserMyProfilePage';
import UserAccountSettingsModal from '@userFeatures/profile/UserAccountSettingsModal';
import UserMobileBottomNav from '@userComponents/navigation/mobile/UserMobileBottomNav';
import {
  addCommentToPostForUser,
  addPostForUser,
  deletePostForUser,
  getFeedPostsForViewer,
  getPostsForUser,
  reactToCommentOnPostForUser,
  reactToPostForUser,
  toggleSharePostForUser,
} from '@userFeatures/posts/userPostStorage';
import { getMyApplications, getPublicProfile, getSavedJobs } from '@sharedServices/authService';
import { getUnreadNotificationCount } from '@sharedServices/notificationsService';
import { ArrowLeft, BadgeCheck, Bookmark, Building2, FileCheck2, Lightbulb, Sparkles, UserCircle } from 'lucide-react';
import { getApplicationsForUser, getSavedPostsForUser, toggleSavedPostForUser } from '@userFeatures/activity/userActivityStorage';

const USER_NAV_QUERY_KEY = 'tab';
const USER_NAV_TABS = new Set(['home', 'jobs', 'projects', 'messages', 'notifications', 'saved-jobs', 'applications', 'my-profile', 'help', 'tips', 'verified']);

const getUserNavFromUrl = () => {
  if (typeof window === 'undefined') {
    return 'home';
  }

  const nextTab = String(new URLSearchParams(window.location.search).get(USER_NAV_QUERY_KEY) || '').trim().toLowerCase();
  return USER_NAV_TABS.has(nextTab) ? nextTab : 'home';
};

const syncUserNavToUrl = (nextNav) => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (USER_NAV_TABS.has(nextNav) && nextNav !== 'home') {
    url.searchParams.set(USER_NAV_QUERY_KEY, nextNav);
  } else {
    url.searchParams.delete(USER_NAV_QUERY_KEY);
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [canReturnToSettings, setCanReturnToSettings] = useState(false);
  const [posts, setPosts] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [publicProfile, setPublicProfile] = useState(null);
  const [messageTargetId, setMessageTargetId] = useState('');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileShellViewport, setIsMobileShellViewport] = useState(false);
  const [mobileChromeHidden, setMobileChromeHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const mobileSafeAreaBottomPadding = isMobileShellViewport
    ? mobileChromeHidden
      ? 'max(1.75rem, calc(env(safe-area-inset-bottom) + 1rem))'
      : 'max(7rem, calc(env(safe-area-inset-bottom) + 5.75rem))'
    : undefined;

  const syncPostState = (nextUser = user) => {
    setPosts(getPostsForUser(nextUser));
    setFeedPosts(getFeedPostsForViewer(nextUser));
  };

  const updateActiveNav = (nextNav, options = {}) => {
    setActiveNav(nextNav);
    syncUserNavToUrl(nextNav);

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
    syncUserNavToUrl(activeNav);
  }, [activeNav]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQueryMobile = window.matchMedia('(max-width: 767px)');
    const mediaQueryShell = window.matchMedia('(max-width: 1279px)');

    const syncViewportState = () => {
      setIsMobileViewport(mediaQueryMobile.matches);
      setIsMobileShellViewport(mediaQueryShell.matches);
    };

    syncViewportState();
    mediaQueryMobile.addEventListener('change', syncViewportState);
    mediaQueryShell.addEventListener('change', syncViewportState);

    return () => {
      mediaQueryMobile.removeEventListener('change', syncViewportState);
      mediaQueryShell.removeEventListener('change', syncViewportState);
    };
  }, []);

  useEffect(() => {
    syncPostState(user);
    setSavedJobs([]);
    setSavedPosts(getSavedPostsForUser(user));
    setApplications(getApplicationsForUser(user));
  }, [user]);

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
    loadSavedJobs();
    window.addEventListener('focus', loadApplications);
    window.addEventListener('focus', loadSavedJobs);
    return () => {
      mounted = false;
      window.removeEventListener('focus', loadApplications);
      window.removeEventListener('focus', loadSavedJobs);
    };
  }, [user]);

  useEffect(() => {
    const syncActivity = () => {
      setSavedPosts(getSavedPostsForUser(user));
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

  const handleCreatePost = (postInput) => {
    addPostForUser(user, postInput);
    syncPostState(user);
  };

  const handleToggleSavePost = (post) => {
    setSavedPosts(toggleSavedPostForUser(user, post));
  };

  const handleReactToPost = (postId, reactionType) => {
    reactToPostForUser(user, postId, reactionType);
    syncPostState(user);
  };

  const handleAddComment = (postId, content) => {
    addCommentToPostForUser(user, postId, content);
    syncPostState(user);
  };

  const handleReactToComment = (postId, commentId, reactionType, parentCommentId = null) => {
    reactToCommentOnPostForUser(user, postId, commentId, reactionType, parentCommentId);
    syncPostState(user);
  };

  const handleToggleSharePost = (postId, shareInput) => {
    toggleSharePostForUser(user, postId, shareInput);
    syncPostState(user);
  };

  const handleDeletePost = (postId) => {
    deletePostForUser(user, postId);
    syncPostState(user);
  };

  const handleOpenPublicProfile = async (result) => {
    if (!result?.id) {
      return;
    }

    try {
      const profile = await getPublicProfile(result.id);
      setPublicProfile({
        ...result,
        ...profile,
      });
      setActiveNav('public-profile');
    } catch {
      setPublicProfile(result);
      setActiveNav('public-profile');
    }
  };

  const handleMessageProfile = (profile) => {
    if (!profile?.id) {
      return;
    }
    setMessageTargetId(profile.id);
    updateActiveNav('messages');
  };

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628]">
      <UserNavbar
        activeNav={activeNav}
        setActiveNav={updateActiveNav}
        user={user}
        mobileHidden={mobileChromeHidden}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onHelp={() => updateActiveNav('help', { preserveSettingsReturn: true })}
        onLogout={onLogout}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTips={() => updateActiveNav('tips')}
        onOpenVerifiedDirectory={() => updateActiveNav('verified')}
        onOpenPremium={() => setPremiumPopupOpen(true)}
        onOpenPublicProfile={handleOpenPublicProfile}
        onOpenMyProfile={() => updateActiveNav('my-profile')}
        onOpenProjects={() => updateActiveNav('projects')}
        onOpenSavedJobs={() => updateActiveNav('saved-jobs')}
        onOpenApplications={() => updateActiveNav('applications')}
        unreadNotificationCount={unreadNotificationCount}
      />

      <div
        className="mx-auto w-full max-w-[1700px] px-3 pb-28 pt-4 sm:px-6 lg:px-8 2xl:px-12 xl:py-6 xl:pb-8"
        style={{ paddingBottom: mobileSafeAreaBottomPadding }}
      >
        {canReturnToSettings && ['my-profile', 'projects', 'saved-jobs', 'applications'].includes(activeNav) && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setCanReturnToSettings(false);
                setSettingsOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] bg-white px-3.5 py-2 text-sm font-semibold text-[#3a5a40] shadow-sm transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#162842] dark:text-white dark:hover:bg-[#102235]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}
        {activeNav === 'home' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 2xl:gap-8">
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

        {activeNav === 'jobs' && <UserJobsPage userType={userType} user={user} />}
        {activeNav === 'projects' && <UserProjectsPage userType={userType} user={user} onUpdateUser={onUpdateUser} />}
        {activeNav === 'saved-jobs' && (
          <SavedJobsPanel
            savedJobs={savedJobs}
            savedPosts={savedPosts}
          />
        )}
        {activeNav === 'applications' && (
          <ApplicationsPanel
            applications={applications}
          />
        )}
        {activeNav === 'messages' && <UserMessagesPage user={user} initialContactId={messageTargetId} />}
        {activeNav === 'notifications' && <UserNotificationsPage user={user} onReadAll={() => setUnreadNotificationCount(0)} />}
        {activeNav === 'help' && <HelpPage onBack={() => updateActiveNav('home')} />}
        {activeNav === 'tips' && <TipsPanel />}
        {activeNav === 'verified' && <VerifiedProfilesPanel />}
        {activeNav === 'public-profile' && (
          <PublicProfilePage
            profile={publicProfile}
            viewer={user}
            onBack={() => updateActiveNav('home')}
            onMessage={handleMessageProfile}
            onToggleSavePost={handleToggleSavePost}
            onReactToPost={handleReactToPost}
            onAddComment={handleAddComment}
            onReactToComment={handleReactToComment}
            onToggleSharePost={handleToggleSharePost}
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
      <UserAccountSettingsModal
        isOpen={settingsOpen}
        user={user}
        onClose={() => setSettingsOpen(false)}
        onSave={onUpdateUser}
        onOpenMyProfile={() => updateActiveNav('my-profile', { fromSettings: true })}
        onOpenProjects={() => updateActiveNav('projects', { fromSettings: true })}
        onOpenSavedJobs={() => updateActiveNav('saved-jobs', { fromSettings: true })}
        onOpenApplications={() => updateActiveNav('applications', { fromSettings: true })}
      />
      <UserMobileBottomNav
        activeNav={activeNav}
        setActiveNav={updateActiveNav}
        hiddenOnScroll={mobileChromeHidden}
        unreadNotificationCount={unreadNotificationCount}
      />
    </div>
  );
}

function ApplicationsPanel({ applications }) {
  return (
    <div className="mx-auto max-w-4xl rounded-[24px] border border-[#a3b18a] bg-white p-6 shadow-[0_18px_48px_rgba(58,90,64,0.08)] dark:border-[#1e3a5f] dark:bg-[#162842] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#3a5a40] dark:bg-[#14304d] dark:text-[#7dc4ff]">
          <FileCheck2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Applications</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#344e41] dark:text-[#b8d4e8]">Every job you apply to now shows up here, including applications submitted from other tabs.</p>
          {applications.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#bfd0af] bg-[#f8fbf6] p-4 text-sm text-[#5f6f52] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-[#d5e6f5]">
              No applications yet. Start applying to jobs and they will appear here automatically.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {applications.map((application) => (
                <div key={application.jobId} className="rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] p-4 dark:border-[#2a4a6f] dark:bg-[#102235]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-[#3a5a40] dark:text-white">{application.title}</h3>
                      <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">{application.company?.name || 'Company'}</p>
                    </div>
                    <span className="rounded-full border border-[#bfd0af] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#588157] dark:border-[#2a4a6f] dark:text-[#7dc4ff]">
                      {application.status || 'pending'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#5f6f52] dark:text-[#d5e6f5]">
                    {application.location ? <span>{application.location}</span> : null}
                    {application.type ? <span>{application.type}</span> : null}
                    {application.salary ? <span>{application.salary}</span> : null}
                    <span>Applied {new Date(application.appliedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SavedJobsPanel({ savedJobs, savedPosts }) {
  return (
    <div className="mx-auto max-w-4xl rounded-[24px] border border-[#a3b18a] bg-white p-6 shadow-[0_18px_48px_rgba(58,90,64,0.08)] dark:border-[#1e3a5f] dark:bg-[#162842] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#3a5a40] dark:bg-[#14304d] dark:text-[#7dc4ff]">
          <Bookmark className="h-6 w-6" />
        </div>
        <div className="w-full">
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Saved Jobs</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#344e41] dark:text-[#b8d4e8]">Save job listings and feed posts you want to revisit later. They stay grouped here across tabs.</p>
          {savedJobs.length === 0 && savedPosts.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#bfd0af] bg-[#f8fbf6] p-4 text-sm text-[#5f6f52] dark:border-[#2a4a6f] dark:bg-[#102235] dark:text-[#d5e6f5]">
              Nothing saved yet. Use the bookmark buttons on job listings or posts to save them here.
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {savedJobs.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#588157] dark:text-[#7dc4ff]">Saved job listings</h3>
                  {savedJobs.map((job) => (
                    <div key={job.id} className="rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] p-4 dark:border-[#2a4a6f] dark:bg-[#102235]">
                      <h4 className="font-semibold text-[#3a5a40] dark:text-white">{job.title}</h4>
                      <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">{job.company?.name || 'Company'}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#5f6f52] dark:text-[#d5e6f5]">
                        {job.location ? <span>{job.location}</span> : null}
                        {job.type ? <span>{job.type}</span> : null}
                        {job.salary ? <span>{job.salary}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {savedPosts.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#588157] dark:text-[#7dc4ff]">Saved posts</h3>
                  {savedPosts.map((post) => (
                    <div key={post.id} className="rounded-2xl border border-[#bfd0af] bg-[#f8fbf6] p-4 dark:border-[#2a4a6f] dark:bg-[#102235]">
                      <p className="whitespace-pre-wrap text-sm text-[#344e41] dark:text-[#d5e6f5]">{post.content || 'No content'}</p>
                      <p className="mt-2 text-xs text-[#5f6f52] dark:text-[#b8d4e8]">Saved {new Date(post.savedAt || post.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
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
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-[24px] border border-[#a3b18a] bg-white p-6 shadow-[0_18px_48px_rgba(58,90,64,0.08)] dark:border-[#1e3a5f] dark:bg-[#162842] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#3a5a40] dark:bg-[#14304d] dark:text-[#7dc4ff]">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Tips</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#344e41] dark:text-[#b8d4e8]">
              Practical tips to improve your profile, stand out in search, and make a stronger impression on recruiters and companies.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tips.map((tip) => (
          <div key={tip.title} className="rounded-[24px] border border-[#bfd0af] bg-white p-5 shadow-[0_12px_32px_rgba(58,90,64,0.06)] dark:border-[#2a4a6f] dark:bg-[#162842] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#588157] dark:bg-[#14304d] dark:text-[#7dc4ff]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#3a5a40] dark:text-white">{tip.title}</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#344e41] dark:text-[#d5e6f5]">{tip.description}</p>
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
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-[24px] border border-[#a3b18a] bg-white p-6 shadow-[0_18px_48px_rgba(58,90,64,0.08)] dark:border-[#1e3a5f] dark:bg-[#162842] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#3a5a40] dark:bg-[#14304d] dark:text-[#7dc4ff]">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Verified Users & Companies</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#344e41] dark:text-[#b8d4e8]">
              A dedicated view explaining what verified profiles represent for both developers and companies on KapIT.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {verifiedGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="rounded-[24px] border border-[#bfd0af] bg-white p-5 shadow-[0_12px_32px_rgba(58,90,64,0.06)] dark:border-[#2a4a6f] dark:bg-[#162842] dark:shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef6ee] text-[#588157] dark:bg-[#14304d] dark:text-[#7dc4ff]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#3a5a40] dark:text-white">{group.title}</h3>
              </div>
              <div className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <div key={item} className="rounded-2xl bg-[#f8fbf6] px-4 py-3 text-sm leading-7 text-[#344e41] dark:bg-[#102235] dark:text-[#d5e6f5]">
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
