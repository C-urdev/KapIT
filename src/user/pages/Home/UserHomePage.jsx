import React, { useState } from 'react';
import Navbar from '@userComponents/UserNavbar';
import LeftSidebar from '@userComponents/UserLeftSidebar';
import RightSidebar from '@userComponents/UserRightSidebar';
import CenterFeed from './UserCenterFeed';
import JobsPage from '@userPages/Jobs/UserJobsPage';
import ProjectsPage from '@userPages/Projects/UserProjectsPage';
import MessagesPage from '@userPages/Messages/UserMessagesPage';
import NotificationsPage from '@userPages/Notifications/UserNotificationsPage';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';
import PremiumPopup from '@userPages/Premium/UserPremiumPopup';
import PostComposerModal from '@userFeatures/posts/UserPostComposerModal';
import MyProfilePage from '@userFeatures/profile/UserMyProfilePage';
import AccountSettingsModal from '@userFeatures/profile/UserAccountSettingsModal';
import UserMobileBottomNav from '@userComponents/navigation/UserMobileBottomNav';
import { addPostForUser, getPostsForUser } from '@userFeatures/posts/userPostStorage';
import { getPublicProfile } from '@sharedServices/authService';
import { getUnreadNotificationCount } from '@sharedServices/notificationsService';
import { useEffect } from 'react';

export default function HomePage({ user, userType, onOpenHelp, onLogout, onUpdateUser }) {
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [publicProfile, setPublicProfile] = useState(null);
  const [messageTargetId, setMessageTargetId] = useState('');
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    setPosts(getPostsForUser(user));
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

  const handleCreatePost = (postInput) => {
    const nextPosts = addPostForUser(user, postInput);
    setPosts(nextPosts);
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
    setActiveNav('messages');
  };

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628]">
      <Navbar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onHelp={onOpenHelp}
        onLogout={onLogout}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenPublicProfile={handleOpenPublicProfile}
        unreadNotificationCount={unreadNotificationCount}
      />

      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-6 pb-24 md:pb-8">
        {activeNav === 'home' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 2xl:gap-8">
            <aside className="hidden xl:block xl:col-span-3">
              <LeftSidebar
                user={user}
                userType={userType}
                onOpenPremium={() => setPremiumPopupOpen(true)}
                onOpenMyProfile={() => setActiveNav('my-profile')}
              />
            </aside>
            <main className="xl:col-span-9 2xl:col-span-6">
              <CenterFeed
                user={user}
                userType={userType}
                onOpenComposer={() => setComposerOpen(true)}
                posts={posts}
              />
            </main>
            <aside className="hidden 2xl:block 2xl:col-span-3">
              <RightSidebar userType={userType} />
            </aside>
          </div>
        )}

        {activeNav === 'my-profile' && (
          <MyProfilePage
            user={user}
            posts={posts}
            onUpdateUser={onUpdateUser}
            onOpenComposer={() => setComposerOpen(true)}
          />
        )}

        {activeNav === 'jobs' && <JobsPage userType={userType} />}
        {activeNav === 'projects' && <ProjectsPage userType={userType} />}
        {activeNav === 'messages' && <MessagesPage user={user} initialContactId={messageTargetId} />}
        {activeNav === 'notifications' && <NotificationsPage user={user} onReadAll={() => setUnreadNotificationCount(0)} />}
        {activeNav === 'public-profile' && (
          <PublicProfilePage profile={publicProfile} onBack={() => setActiveNav('home')} onMessage={handleMessageProfile} />
        )}
      </div>

      <PremiumPopup isOpen={premiumPopupOpen} onClose={() => setPremiumPopupOpen(false)} />
      <PostComposerModal isOpen={composerOpen} user={user} onClose={() => setComposerOpen(false)} onSubmit={handleCreatePost} />
      <AccountSettingsModal isOpen={settingsOpen} user={user} onClose={() => setSettingsOpen(false)} onSave={onUpdateUser} />
      <UserMobileBottomNav
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        unreadNotificationCount={unreadNotificationCount}
      />
    </div>
  );
}



