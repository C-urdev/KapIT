import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchAccounts } from '@sharedServices/authService';
import UserDesktopNavbar from './navigation/desktop/UserDesktopNavbar';
import UserMobileTopbar from './navigation/mobile/UserMobileTopbar';
import UserMobileMenuDrawer from './navigation/mobile/UserMobileMenuDrawer';

export default function UserNavbar({
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

        <div className="xl:hidden" ref={searchRef}>
          <div className="flex items-center justify-between h-16 gap-4">
            <UserMobileTopbar
              user={user}
              setActiveNav={setActiveNav}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              onOpenSearch={() => setSearchOpen((prev) => !prev)}
            />
          </div>

          {searchOpen && (
            <div className="pb-3">
              <div className="rounded-2xl border border-[#a3b18a] bg-white p-3 shadow-lg dark:border-[#1e3a5f] dark:bg-[#162842]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344e41] dark:text-[#7d9ab8]" />
                  <input
                    type="text"
                    placeholder="Search users or companies..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-[#a3b18a] bg-[#f5f5f2] py-3 pl-10 pr-4 text-sm text-[#344e41] outline-none transition-colors focus:ring-2 focus:ring-[#588157] dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:text-white dark:focus:ring-[#3ba9d6]"
                  />
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-[#e5e7eb] dark:border-[#1e3a5f]">
                  {searchLoading && (
                    <p className="px-4 py-3 text-sm text-[#344e41] dark:text-[#b8d4e8]">Searching...</p>
                  )}

                  {!searchLoading && searchError && (
                    <p className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{searchError}</p>
                  )}

                  {!searchLoading && !searchError && !searchQuery.trim() && (
                    <p className="px-4 py-3 text-sm text-[#344e41] dark:text-[#b8d4e8]">
                      Search for developers, users, or companies.
                    </p>
                  )}

                  {!searchLoading && !searchError && searchQuery.trim() && searchResults.length === 0 && (
                    <p className="px-4 py-3 text-sm text-[#344e41] dark:text-[#b8d4e8]">No users or companies found.</p>
                  )}

                  {!searchLoading && !searchError && searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(result.username || result.email || '');
                        setSearchOpen(false);
                        onOpenPublicProfile?.(result);
                      }}
                      className="w-full border-b border-[#e5e7eb] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#f5f5f2] dark:border-[#1e3a5f] dark:hover:bg-[#1e3a5f]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] font-bold text-white dark:bg-[#3ba9d6]">
                          {result.profileImage ? (
                            <img
                              src={result.profileImage}
                              alt={`${result.username || result.email || 'Account'} profile`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (result.username || result.email || 'A').charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#3a5a40] dark:text-white">
                            {result.username || result.email}
                          </p>
                          <p className="text-xs text-[#344e41] dark:text-[#b8d4e8]">
                            {result.type === 'company' ? 'Company' : 'User'} - {result.email}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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



