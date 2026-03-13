// HomePage 

import React, { useState } from 'react';
import Navbar from '@components/Navbar';
import LeftSidebar from '@components/LeftSidebar';
import RightSidebar from '@components/RightSidebar';
import CenterFeed from './CenterFeed';
import JobsPage from '@pages/Jobs/JobsPage';
import ProjectsPage from '@pages/Projects/ProjectsPage';
import MessagesPage from '@pages/Messages/MessagesPage';
import NotificationsPage from '@pages/Notifications/NotificationsPage';
import PublicProfilePage from '@pages/PublicProfile/PublicProfilePage';
import PremiumPopup from '@pages/Premium/PremiumPopup';
import PostComposerModal from '@features/posts/PostComposerModal';
import MyProfilePage from '@features/profile/MyProfilePage';
import AccountSettingsModal from '@features/profile/AccountSettingsModal';
import { addPostForUser, getPostsForUser } from '@features/posts/postStorage';
import { getPublicProfile } from '../../services/authService';
import { Home, Briefcase, MessageCircle, Bell } from 'lucide-react';
import { useEffect } from 'react';

export default function HomePage({ user, userType, onOpenHelp, onLogout, onUpdateUser }) {
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [premiumPopupOpen, setPremiumPopupOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [publicProfile, setPublicProfile] = useState(null);
  useEffect(() => {
    setPosts(getPostsForUser(user));
  }, [user]);

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
        {activeNav === 'messages' && <MessagesPage user={user} />}
        {activeNav === 'notifications' && <NotificationsPage user={user} />}
        {activeNav === 'public-profile' && (
          <PublicProfilePage
            profile={publicProfile}
            onBack={() => setActiveNav('home')}
          />
        )}
      </div>

      <PremiumPopup
        isOpen={premiumPopupOpen}
        onClose={() => setPremiumPopupOpen(false)}
      />
      <PostComposerModal
        isOpen={composerOpen}
        user={user}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleCreatePost}
      />
      <AccountSettingsModal
        isOpen={settingsOpen}
        user={user}
        onClose={() => setSettingsOpen(false)}
        onSave={onUpdateUser}
      />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#162842] border-t border-[#a3b18a] dark:border-[#1e3a5f] z-50">
        <div className="max-w-md mx-auto h-16 px-2 flex justify-center">
          <div className="w-full flex justify-between items-center">
            <MobileBottomNavButton icon={Home} active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
            <MobileBottomNavButton icon={Briefcase} active={activeNav === 'jobs'} onClick={() => setActiveNav('jobs')} />
            <MobileBottomNavButton icon={Briefcase} active={activeNav === 'projects'} onClick={() => setActiveNav('projects')} />
            <MobileBottomNavButton icon={MessageCircle} active={activeNav === 'messages'} onClick={() => setActiveNav('messages')} />
            <MobileBottomNavButton icon={Bell} active={activeNav === 'notifications'} onClick={() => setActiveNav('notifications')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileBottomNavButton({ icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 transition-colors ${
        active ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#344e41] dark:text-white'
      }`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}
