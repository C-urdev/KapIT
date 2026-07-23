import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchAccounts } from '@sharedServices/authService';
import UserDesktopNavbar from './navigation/desktop/UserDesktopNavbar';
import UserMobileTopbar from './navigation/mobile/UserMobileTopbar';
import UserMobileMenuDrawer from './navigation/mobile/UserMobileMenuDrawer';

export default function UserNavbar({
  activeNav,
  setActiveNav,
  user,
  hideDesktopProfileControl = false,
  mobileHidden = false,
  mobileMenuOpen,
  setMobileMenuOpen,
  onHelp,
  onLogout,
  onOpenSettings,
  onOpenTips,
  onOpenVerifiedDirectory,
  onOpenPremium,
  onOpenPublicProfile,
  onSubmitSearch,
  onOpenMyProfile,
  onOpenProjects,
  onOpenSavedJobs,
  onOpenApplications,
  unreadNotificationCount = 0,
}) {
  const searchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const searchRequestRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [mobileMenuActive, setMobileMenuActive] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
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
      const requestId = searchRequestRef.current + 1;
      searchRequestRef.current = requestId;

      try {
        setSearchLoading(true);
        setSearchError('');
        const results = await searchAccounts(query);
        if (searchRequestRef.current === requestId) {
          setSearchResults(results);
        }
      } catch (error) {
        if (searchRequestRef.current === requestId) {
          setSearchResults([]);
          setSearchError(error.message || 'Search failed');
        }
      } finally {
        if (searchRequestRef.current === requestId) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (mobileMenuOpen) {
      setSearchOpen(false);
      setMobileMenuVisible(true);
      const frame = window.requestAnimationFrame(() => setMobileMenuActive(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setMobileMenuActive(false);
    const timeout = window.setTimeout(() => setMobileMenuVisible(false), 260);
    return () => window.clearTimeout(timeout);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      mobileSearchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [searchOpen]);

  const handleMobileSearchToggle = () => {
    setMobileMenuOpen(false);
    setSearchOpen((prev) => !prev);
  };
  const handleSearchResultSelect = (result) => {
    setSearchQuery(result?.companyName || result?.fullName || result?.username || result?.email || '');
    setSearchOpen(false);
    onOpenPublicProfile?.(result);
  };
  const handleSearchSubmit = () => {
    const normalizedQuery = String(searchQuery || '').trim();
    if (!normalizedQuery) {
      return;
    }
    setSearchOpen(false);
    onSubmitSearch?.({ query: normalizedQuery, scope: 'all' });
  };

  const shouldKeepNavbarVisible = searchOpen || mobileMenuVisible;

  const desktopOnlyNavbar = activeNav === 'settings' || activeNav === 'search';

  return (
    <>
      <nav
        className={`${
          activeNav === 'messages' ? 'fixed left-0 right-0 w-full xl:inset-auto xl:w-auto xl:sticky' : 'sticky'
        } top-0 z-50 overflow-visible bg-[var(--user-appbar)] backdrop-blur-xl transition-transform duration-150 ease-out xl:border-b xl:border-[var(--user-border)] xl:shadow-none xl:backdrop-blur-none ${
          activeNav === 'messages'
            ? 'border-transparent shadow-none dark:border-transparent dark:shadow-none'
            : 'border-b border-white/40 shadow-sm dark:border-white/10 dark:shadow-[0_6px_24px_rgba(0,0,0,0.18)]'
        } ${desktopOnlyNavbar ? 'hidden xl:block' : ''} ${mobileHidden && !shouldKeepNavbarVisible ? '-translate-y-full xl:translate-y-0' : 'translate-y-0'}`}
      >
        <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-6 xl:px-6 2xl:px-10">
          <div className="hidden min-w-0 xl:block">
            <UserDesktopNavbar
              activeNav={activeNav}
              setActiveNav={setActiveNav}
              hideProfileControl={hideDesktopProfileControl}
              searchRef={searchRef}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchOpen={searchOpen}
              setSearchOpen={setSearchOpen}
              searchLoading={searchLoading}
              searchError={searchError}
              searchResults={searchResults}
              onSearchResultSelect={handleSearchResultSelect}
              onSearchSubmit={handleSearchSubmit}
              onOpenPremium={onOpenPremium}
              onOpenNotifications={() => setActiveNav?.('notifications')}
              unreadNotificationCount={unreadNotificationCount}
            />
          </div>

          <div className="xl:hidden">
            <div className="flex items-center justify-between gap-4">
              <UserMobileTopbar
                user={user}
                setActiveNav={setActiveNav}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                onOpenSearch={handleMobileSearchToggle}
              />
            </div>
          </div>
        </div>
      </nav>

      {searchOpen && (
        <div className="xl:hidden fixed inset-0 z-[80]">
          <div
            className="absolute inset-0 flex flex-col bg-[#f5f7f2]/90 backdrop-blur-2xl dark:bg-[#121416]/90"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
            ref={searchRef}
          >
            <div className="border-b border-white/40 bg-white/40 px-4 pb-4 pt-3 dark:border-white/10 dark:bg-[#1a1d20]/40">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:text-white dark:hover:bg-white/10"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6f52] dark:text-white/45" />
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="Search users or companies"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                    className="w-full rounded-full border border-white/40 bg-white/50 py-3 pl-11 pr-4 text-base text-[#344e41] outline-none transition-colors placeholder:text-[#6b7280] shadow-sm focus:ring-2 focus:ring-[#588157]/20 focus:bg-white/70 dark:border-white/10 dark:bg-[#1a1d20]/50 dark:text-white dark:placeholder:text-white/40 dark:focus:ring-[#82ad86]/20 dark:focus:bg-[#1a1d20]/70"
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-transparent px-4 py-4">
              {!searchQuery.trim() && (
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-[1.7rem] font-extrabold text-[#3a5a40] dark:text-white">Recent</h2>
                  <button type="button" className="text-sm font-semibold text-[#588157] dark:text-[#6aa8ff]">See all</button>
                </div>
              )}

              {searchLoading && (
                <p className="px-1 py-3 text-sm text-[#344e41] dark:text-white/75">Searching...</p>
              )}

              {!searchLoading && searchError && (
                <p className="px-1 py-3 text-sm text-red-600 dark:text-red-400">{searchError}</p>
              )}

              {!searchLoading && !searchError && !searchQuery.trim() && (
                <div className="space-y-1">
                  {searchResults.slice(0, 5).map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        handleSearchResultSelect(result);
                      }}
                      onClick={() => handleSearchResultSelect(result)}
                      className="flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-left transition-colors hover:bg-[#f1f3ec] dark:hover:bg-white/5"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] font-bold text-white dark:bg-[#4c8dff]">
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
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-[#3a5a40] dark:text-white">
                          {result.companyName || result.fullName || result.username || result.email}
                        </p>
                        <p className="text-sm text-[#5f6f52] dark:text-white/65">
                          {result.type === 'company' ? 'Company' : 'User'}{result.email ? ` • ${result.email}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                  {searchResults.length === 0 ? (
                    <p className="px-1 py-3 text-sm text-[#5f6f52] dark:text-white/65">
                      Start typing to search for users or companies.
                    </p>
                  ) : null}
                </div>
              )}

              {!searchLoading && !searchError && searchQuery.trim() && searchResults.length === 0 && (
                <p className="px-1 py-3 text-sm text-[#344e41] dark:text-white/75">No users or companies found.</p>
              )}

              {!searchLoading && !searchError && searchQuery.trim() && searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        handleSearchResultSelect(result);
                      }}
                      onClick={() => handleSearchResultSelect(result)}
                      className="flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-left transition-colors hover:bg-[#f1f3ec] dark:hover:bg-white/5"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] font-bold text-white dark:bg-[#4c8dff]">
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
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-[#3a5a40] dark:text-white">
                          {result.companyName || result.fullName || result.username || result.email}
                        </p>
                        <p className="text-sm text-[#5f6f52] dark:text-white/65">
                          {result.type === 'company' ? 'Company' : 'User'}{result.email ? ` • ${result.email}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
        onOpenTips={onOpenTips}
        onOpenVerifiedDirectory={onOpenVerifiedDirectory}
        onOpenPremium={onOpenPremium}
        onHelp={onHelp}
        onLogout={onLogout}
      />
    </>
  );
}



