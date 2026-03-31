import React, { useEffect, useRef, useState } from 'react';
import { searchAccounts } from '@sharedServices/authService';
import UserDesktopNavbar from './navigation/desktop/UserDesktopNavbar';
import UserMobileTopbar from './navigation/mobile/UserMobileTopbar';
import UserMobileMenuDrawer from './navigation/mobile/UserMobileMenuDrawer';

export default function Navbar({
  activeNav,
  setActiveNav,
  user,
  mobileMenuOpen,
  setMobileMenuOpen,
  onHelp,
  onLogout,
  onOpenSettings,
  onOpenPremium,
  onOpenPublicProfile,
  onOpenMyProfile,
  onOpenProjects,
  onOpenSavedJobs,
  onOpenApplications,
  unreadNotificationCount = 0,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const searchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [mobileMenuActive, setMobileMenuActive] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchError('');
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError('');
        const results = await searchAccounts(query);
        setSearchResults(results);
      } catch (error) {
        setSearchResults([]);
        setSearchError(error.message || 'Search failed');
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuVisible(true);
      const frame = window.requestAnimationFrame(() => setMobileMenuActive(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setMobileMenuActive(false);
    const timeout = window.setTimeout(() => setMobileMenuVisible(false), 260);
    return () => window.clearTimeout(timeout);
  }, [mobileMenuOpen]);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[#0a1628] border-b border-[#a3b18a] dark:border-[#1e3a5f] shadow-sm">
      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12">
        <div className="hidden xl:flex items-center h-16 gap-6">
          <UserDesktopNavbar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            user={user}
            profileMenuOpen={profileMenuOpen}
            setProfileMenuOpen={setProfileMenuOpen}
            profileMenuRef={profileMenuRef}
            searchRef={searchRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            searchLoading={searchLoading}
            searchError={searchError}
            searchResults={searchResults}
            onHelp={onHelp}
            onLogout={onLogout}
            onOpenSettings={onOpenSettings}
            onOpenPublicProfile={onOpenPublicProfile}
            unreadNotificationCount={unreadNotificationCount}
          />
        </div>

        <div className="xl:hidden flex items-center justify-between h-16 gap-4">
          <UserMobileTopbar
            user={user}
            setActiveNav={setActiveNav}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
        </div>
      </div>

      <UserMobileMenuDrawer
        open={mobileMenuVisible}
        active={mobileMenuActive}
        user={user}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenMyProfile={onOpenMyProfile}
        onOpenProjects={onOpenProjects}
        onOpenSavedJobs={onOpenSavedJobs}
        onOpenApplications={onOpenApplications}
        onOpenSettings={onOpenSettings}
        onOpenPremium={onOpenPremium}
        onHelp={onHelp}
        onLogout={onLogout}
      />
    </nav>
  );
}



