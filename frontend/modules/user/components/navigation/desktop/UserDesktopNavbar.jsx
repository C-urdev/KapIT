import React from 'react';
import { Search, Home, Briefcase, FolderKanban, MessageCircle, Bell, Moon, Sun, LogOut, HelpCircle, Settings } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';

function NavButton({ icon: Icon, label, active, onClick, badgeCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex min-w-0 w-full flex-col items-center gap-1 rounded-2xl px-2.5 py-2 transition-colors duration-150 ease-out group sm:px-3 sm:py-2.5 ${
        active
          ? 'bg-[#eef6ee] text-[#588157] shadow-sm shadow-[#588157]/10 dark:bg-[#353c44] dark:text-[#6f9b74] dark:shadow-[#121416]/30'
          : 'text-[#344e41] dark:text-white hover:bg-[#f5f5f2] hover:text-[#3a5a40] dark:hover:bg-[#31363d] dark:hover:text-[#d0d7dd]'
      }`}
    >
      <span className="relative">
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-150 ease-out ${active ? 'scale-[1.02]' : 'scale-100'}`} />
        {badgeCount > 0 ? (
          <span className="absolute -top-2 -right-3 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-[#d14343] text-white text-[10px] leading-none font-semibold flex items-center justify-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : null}
      </span>
      <span className="text-xs font-medium truncate px-1">{label}</span>
    </button>
  );
}

export default function UserDesktopNavbar({
  activeNav,
  setActiveNav,
  user,
  profileMenuOpen,
  setProfileMenuOpen,
  profileMenuRef,
  searchRef,
  searchQuery,
  setSearchQuery,
  searchOpen,
  setSearchOpen,
  searchLoading,
  searchError,
  searchResults,
  onSearchResultSelect,
  onSearchSubmit,
  onHelp,
  onLogout,
  onOpenSettings,
  unreadNotificationCount = 0,
}) {
  const { theme, toggleTheme } = useTheme();
  const displayName = user?.fullName || user?.name || user?.username || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';
  const accountLabel = user?.headline || user?.title || 'User Account';

  return (
    <div className="hidden h-16 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 xl:grid 2xl:gap-5">
      <div className="flex min-w-0 items-center gap-2 2xl:gap-3">
        <button
          type="button"
          onClick={() => setActiveNav('home')}
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] sm:gap-3 sm:px-2"
          aria-label="Go to home"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#a3b18a]/60 bg-[#f5f5f2] dark:border-[#444d57] dark:bg-[#353c44] sm:h-10 sm:w-10">
            <KapITLogo className="h-7 w-7 object-contain sm:h-8 sm:w-8" alt="KapIT" />
          </div>
          <div className="hidden min-w-0 text-left min-[1180px]:block">
            <div className="truncate text-base font-bold leading-tight text-[#3a5a40] dark:text-white">KapIT</div>
          </div>
        </button>

        <div className="min-w-0 max-w-[min(420px,calc(100vw-28rem))] flex-1 xl:max-w-[min(440px,32vw)] 2xl:max-w-[min(480px,28vw)]">
          <div className="relative" ref={searchRef}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344e41] dark:text-[#adb5be]" />
            <input
              type="text"
              placeholder="Search skills, users, companies..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onSearchSubmit?.({ query: searchQuery, scope: 'all' });
                }
              }}
              className="w-full rounded-full border border-[#a3b18a] bg-[#f5f5f2] py-2 pl-10 pr-3 text-sm text-[#344e41] transition-colors placeholder:text-[#5f6f52] focus:outline-none focus:ring-2 focus:ring-[#588157] dark:border-[#444d57] dark:bg-[#353c44] dark:text-white dark:placeholder:text-[#adb5be] dark:focus:ring-[#6f9b74]"
            />
            {searchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl shadow-xl z-50">
                {searchLoading && (
                  <p className="px-4 py-3 text-sm text-[#344e41] dark:text-[#d0d7dd]">Searching...</p>
                )}

                {!searchLoading && searchError && (
                  <p className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{searchError}</p>
                )}

                {!searchLoading && !searchError && searchResults.length === 0 && (
                  <p className="px-4 py-3 text-sm text-[#344e41] dark:text-[#d0d7dd]">No users or companies found.</p>
                )}

                {!searchLoading && !searchError && searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      onSearchResultSelect?.(result);
                    }}
                    onClick={() => onSearchResultSelect?.(result)}
                    className="w-full text-left px-4 py-3 border-b last:border-b-0 border-[#d6d3c9] dark:border-[#353c44] hover:bg-[#f1f5eb] dark:hover:bg-[#353c44] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#588157] dark:bg-[#6f9b74] text-white flex items-center justify-center overflow-hidden shrink-0 font-bold">
                        {result.profileImage ? (
                          <img src={result.profileImage} alt={`${result.username || result.email || 'Account'} profile`} className="w-full h-full object-cover" />
                        ) : (
                          (result.username || result.email || 'A').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#3a5a40] dark:text-white truncate">{result.companyName || result.fullName || result.username || result.email}</p>
                          {result.isPremium ? <PremiumBadge compact /> : null}
                        </div>
                        <p className="text-xs text-[#344e41] dark:text-[#d0d7dd]">{result.type === 'company' ? 'Company' : 'User'} - {result.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-center px-1">
        <div className="grid w-[min(100%,520px)] grid-cols-5 gap-1 sm:gap-1.5">
          <NavButton icon={Home} label="Home" active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
          <NavButton icon={Briefcase} label="Jobs" active={activeNav === 'jobs'} onClick={() => setActiveNav('jobs')} />
          <NavButton icon={FolderKanban} label="Projects" active={activeNav === 'projects'} onClick={() => setActiveNav('projects')} />
          <NavButton icon={MessageCircle} label="Messages" active={activeNav === 'messages'} onClick={() => setActiveNav('messages')} />
          <NavButton
            icon={Bell}
            label="Notifications"
            active={activeNav === 'notifications'}
            onClick={() => setActiveNav('notifications')}
            badgeCount={unreadNotificationCount}
          />
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="hidden min-[1380px]:flex items-center gap-2 overflow-hidden rounded-xl border border-[#a3b18a] bg-[#f5f5f2] py-1.5 pl-1.5 pr-2.5 transition-all hover:ring-2 hover:ring-[#588157]/20 dark:border-[#444d57] dark:bg-[#353c44] dark:hover:ring-[#82ad86]/20 2xl:py-2 2xl:pl-2 2xl:pr-3"
            aria-label="Open profile menu"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] text-sm font-bold text-white dark:bg-[#6f9b74] 2xl:h-8 2xl:w-8">
              {profileImage ? <img src={profileImage} alt="" className="h-full w-full object-cover" /> : userInitial}
            </div>
            <div className="min-w-0 text-left">
              <div className="max-w-[7rem] truncate text-xs font-semibold text-[#3a5a40] dark:text-white 2xl:max-w-[180px] 2xl:text-sm">{displayName}</div>
              <div className="hidden max-w-[7rem] truncate text-[11px] text-[#4b5563] dark:text-[#d0d7dd] 2xl:block 2xl:max-w-[180px] 2xl:text-xs">{accountLabel}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#588157] text-sm font-semibold text-white transition-all hover:ring-2 hover:ring-[#588157] dark:bg-[#6f9b74] dark:hover:ring-[#82ad86] min-[1380px]:hidden"
            aria-label="Open profile menu"
          >
            {profileImage ? <img src={profileImage} alt="" className="h-full w-full object-cover" /> : userInitial}
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl shadow-lg overflow-hidden z-50">
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenSettings?.();
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-2 text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
              >
                <Settings className="w-4 h-4 text-[#588157] dark:text-[#6f9b74]" />
                Settings
              </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  onHelp?.();
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-2 text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-[#588157] dark:text-[#6f9b74]" />
                Help
              </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout?.();
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
