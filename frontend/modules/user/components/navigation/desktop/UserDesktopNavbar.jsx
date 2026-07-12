import React from 'react';
import { Search, Home, Briefcase, FolderKanban, MessageCircle, Bell, LogOut, HelpCircle, Settings } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';
import PillNavButton from '@sharedComponents/navigation/PillNavButton';

const USER_DESKTOP_NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'messages', label: 'Messages', icon: MessageCircle },
  { key: 'notifications', label: 'Notifications', icon: Bell, badgeCount: true },
];

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
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const displayName = user?.fullName || user?.name || user?.username || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';
  const accountLabel = user?.headline || user?.title || 'User Account';
  const navShellClass = isDarkMode
    ? 'border border-white/10 bg-[#22272b]/70 shadow-[0_16px_34px_rgba(0,0,0,0.24)]'
    : 'border border-white/40 bg-white/70 shadow-[0_16px_34px_rgba(0,0,0,0.08)]';
  const activeNavButtonClass = isDarkMode
    ? 'bg-[#1a1d20]/50 text-[#82ad86] shadow-sm'
    : 'bg-white/60 text-[#3a5a40] shadow-sm';
  const inactiveNavButtonClass = isDarkMode
    ? 'text-[#d0d7dd] hover:bg-[#1a1d20]/30 hover:text-white'
    : 'text-[#344e41] hover:bg-white/40 hover:text-[#3a5a40]';
  const activeLabelClass = isDarkMode ? 'font-semibold text-white' : 'font-semibold text-[#3a5a40]';
  const inactiveLabelClass = isDarkMode ? 'font-normal text-white/70' : 'font-normal text-[#344e41]';
  const inactiveIconClass = isDarkMode ? 'text-white/70' : 'text-[#4b5563]';
  const activeIconClass = isDarkMode ? 'text-white' : 'text-[#3a5a40]';
  return (
    <div className="hidden h-20 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 xl:grid 2xl:gap-6">
      <div className="relative z-20 flex min-w-0 items-center gap-3 2xl:gap-4">
        <button
          type="button"
          onClick={() => setActiveNav('home')}
          className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] sm:gap-3 sm:px-2.5"
          aria-label="Go to home"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/40 bg-white/50 shadow-sm dark:border-white/10 dark:bg-[#1a1d20]/50 sm:h-11 sm:w-11">
            <KapITLogo className="h-full w-full scale-[1.05] object-contain" alt="KapIT" />
          </div>
          <div className="hidden min-w-0 text-left min-[1180px]:block">
            <div className="truncate text-[1.05rem] font-bold leading-tight text-[#3a5a40] dark:text-white">KapIT</div>
          </div>
        </button>

        <div className="relative z-20 min-w-0 max-w-[min(420px,calc(100vw-28rem))] flex-1 xl:max-w-[min(440px,32vw)] 2xl:max-w-[min(480px,28vw)]">
          <div className="relative" ref={searchRef}>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#344e41] dark:text-[#adb5be]" />
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
              className="w-full rounded-full border border-white/40 bg-white/50 py-3 pl-11 pr-4 text-[0.98rem] text-[#344e41] shadow-sm transition-all placeholder:text-[#5f6f52] focus:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#588157]/20 dark:border-white/10 dark:bg-[#1a1d20]/50 dark:text-white dark:placeholder:text-[#adb5be] dark:focus:bg-[#1a1d20]/70 dark:focus:ring-[#82ad86]/20"
            />
            {searchOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#22272b]/80">
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

      <div className="relative z-10 flex shrink-0 justify-center px-1 overflow-visible">
        <div className={`flex items-center gap-1.5 rounded-full p-1.5 backdrop-blur-2xl ${navShellClass}`}>
          {USER_DESKTOP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;

            return (
              <PillNavButton
                key={item.key}
                layoutId="user-desktop-nav-lamp"
                icon={Icon}
                label={item.label}
                active={isActive}
                onClick={() => setActiveNav(item.key)}
                variant="stacked"
                indicatorMode="line"
                className="min-w-[4.2rem] px-3 py-2"
                iconClassName={isActive ? activeIconClass : inactiveIconClass}
                labelClassName="text-[0.73rem] tracking-[0.01em]"
                activeLabelClassName={activeLabelClass}
                inactiveLabelClassName={inactiveLabelClass}
                activeClassName={activeNavButtonClass}
                inactiveClassName={inactiveNavButtonClass}
                title={item.label}
                badgeCount={item.badgeCount ? unreadNotificationCount : 0}
              />
            );
          })}
        </div>
      </div>

      <div className="relative z-20 flex min-w-0 items-center justify-end gap-2 sm:gap-2.5">
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="hidden min-[1380px]:flex items-center gap-2 overflow-hidden rounded-full border border-white/40 bg-white/50 py-1.5 pl-1.5 pr-2.5 shadow-sm transition-all hover:bg-white/70 hover:ring-2 hover:ring-[#588157]/20 dark:border-white/10 dark:bg-[#1a1d20]/50 dark:hover:bg-[#1a1d20]/70 dark:hover:ring-[#82ad86]/20 2xl:py-2 2xl:pl-2 2xl:pr-3"
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
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#22272b]/80">
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
