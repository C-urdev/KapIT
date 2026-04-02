import React, { useEffect, useMemo, useState } from 'react';
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
import { addPostForUser, getPostsForUser } from '@userFeatures/posts/userPostStorage';
import { getMyApplications, getPublicProfile } from '@sharedServices/authService';
import { getUnreadNotificationCount } from '@sharedServices/notificationsService';
import { ArrowLeft, Bookmark, FileCheck2 } from 'lucide-react';
import { getApplicationsForUser, getSavedJobsForUser, getSavedPostsForUser, toggleSavedPostForUser } from '@userFeatures/activity/userActivityStorage';

const USER_NAV_QUERY_KEY = 'tab';
const USER_NAV_TABS = new Set(['home', 'jobs', 'projects', 'messages', 'notifications', 'saved-jobs', 'applications', 'my-profile', 'help']);

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
  const [publicProfile, setPublicProfile] = useState(null);
  const [messageTargetId, setMessageTargetId] = useState('');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [applications, setApplications] = useState([]);
  const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

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
    setPosts(getPostsForUser(user));
    setSavedJobs(getSavedJobsForUser(user));
    setSavedPosts(getSavedPostsForUser(user));
    setApplications(getApplicationsForUser(user));
  }, [user]);

  useEffect(() => {
    let mounted = true;

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
    window.addEventListener('focus', loadApplications);
    return () => {
      mounted = false;
      window.removeEventListener('focus', loadApplications);
    };
  }, [user]);

  useEffect(() => {
    const syncActivity = () => {
      setSavedJobs(getSavedJobsForUser(user));
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
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== USER_PREMIUM_PAYMENT_SUCCESS) return;

      setPremiumPopupOpen(false);
      if (event.data?.updates) {
        await onUpdateUser?.(event.data.updates);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUpdateUser]);

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
    const nextPosts = addPostForUser(user, postInput);
    setPosts(nextPosts);
  };

  const handleToggleSavePost = (post) => {
    setSavedPosts(toggleSavedPostForUser(user, post));
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
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onHelp={() => updateActiveNav('help', { preserveSettingsReturn: true })}
        onLogout={onLogout}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPremium={() => setPremiumPopupOpen(true)}
        onOpenPublicProfile={handleOpenPublicProfile}
        onOpenMyProfile={() => updateActiveNav('my-profile')}
        onOpenProjects={() => updateActiveNav('projects')}
        onOpenSavedJobs={() => updateActiveNav('saved-jobs')}
        onOpenApplications={() => updateActiveNav('applications')}
        unreadNotificationCount={unreadNotificationCount}
      />

      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-6 pb-24 md:pb-8">
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
                posts={posts}
                onToggleSavePost={handleToggleSavePost}
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
          />
        )}

        {activeNav === 'jobs' && <UserJobsPage userType={userType} user={user} />}
        {activeNav === 'projects' && <UserProjectsPage userType={userType} />}
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
        {activeNav === 'public-profile' && (
          <PublicProfilePage profile={publicProfile} onBack={() => updateActiveNav('home')} onMessage={handleMessageProfile} />
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
