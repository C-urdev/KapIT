import React from 'react';
import { Search, Home, Briefcase, FolderKanban, MessageCircle, Bell, Moon, Sun, LogOut, HelpCircle, Settings, Award } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';

function NavButton({ icon: Icon, label, active, onClick, badgeCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full min-w-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl transition-all duration-300 ease-out group ${
        active
          ? 'bg-[#eef6ee] text-[#588157] shadow-sm shadow-[#588157]/10 dark:bg-[#1e3a5f] dark:text-[#3ba9d6] dark:shadow-[#0a1628]/30'
          : 'text-[#344e41] dark:text-white hover:bg-[#f5f5f2] hover:text-[#3a5a40] dark:hover:bg-[#16304a] dark:hover:text-[#b8d4e8]'
      }`}
    >
      <span className="relative">
        <Icon className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-105' : 'scale-100'}`} />
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
  onHelp,
  onLogout,
  onOpenSettings,
  onOpenPublicProfile,
  unreadNotificationCount = 0,
}) {
  const { theme, toggleTheme } = useTheme();
  const displayName = user?.username || user?.name || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';
  const accountLabel = user?.headline || user?.title || 'User Account';

  return (
    <>
      <div className="flex items-center gap-4 min-w-0 xl:flex-[0_0_42%]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            className="hidden sm:flex items-center gap-3 min-w-0 rounded-xl px-2 py-1.5 hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Go to home"
          >
            <div className="w-10 h-10 rounded-xl shrink-0 bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a]/60 dark:border-[#2a4a6f] flex items-center justify-center overflow-hidden">
              <KapITLogo className="w-8 h-8 object-contain" alt="KapIT" />
            </div>
            <div className="min-w-0 text-left">
              <div className="text-base font-bold text-[#3a5a40] dark:text-white leading-tight truncate">KapIT</div>
            </div>
          </button>
        </div>

        <div className="flex-1 max-w-xl hidden xl:block">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#344e41] dark:text-[#7d9ab8]" />
            <input
              type="text"
              placeholder="Search skills, users, companies..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="w-full pl-10 pr-4 py-2 bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] rounded-lg text-sm text-[#344e41] dark:text-white placeholder-[#3a5a40] dark:placeholder-[#7d9ab8] focus:outline-none focus:ring-2 focus:ring-[#588157] dark:focus:ring-[#3ba9d6] transition-colors"
            />
            {searchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl shadow-xl z-50">
                {searchLoading && (
                  <p className="px-4 py-3 text-sm text-[#344e41] dark:text-[#b8d4e8]">Searching...</p>
                )}

                {!searchLoading && searchError && (
                  <p className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{searchError}</p>
                )}

                {!searchLoading && !searchError && searchResults.length === 0 && (
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
                    className="w-full text-left px-4 py-3 border-b last:border-b-0 border-[#e5e7eb] dark:border-[#1e3a5f] hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#588157] dark:bg-[#3ba9d6] text-white flex items-center justify-center overflow-hidden shrink-0 font-bold">
                        {result.profileImage ? (
                          <img src={result.profileImage} alt={`${result.username || result.email || 'Account'} profile`} className="w-full h-full object-cover" />
                        ) : (
                          (result.username || result.email || 'A').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#3a5a40] dark:text-white truncate">{result.username || result.email}</p>
                          {result.isPremium ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f2b500] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white dark:bg-[#f5c84c] dark:text-[#0a1628]">
                              <Award className="h-3 w-3" />
                              Premium
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-[#344e41] dark:text-[#b8d4e8]">{result.type === 'company' ? 'Company' : 'User'} - {result.email}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden xl:flex flex-1 items-center justify-center">
        <div className="w-full max-w-[560px] grid grid-cols-5 gap-1">
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

      <div className="hidden xl:flex items-center gap-2 xl:flex-[0_0_18%] justify-end">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors">
          {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
        </button>
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="hidden 2xl:flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#1e3a5f] cursor-pointer hover:ring-2 hover:ring-[#588157]/20 dark:hover:ring-[#5bc0de]/20 transition-all overflow-hidden"
            aria-label="Open profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#588157] dark:bg-[#3ba9d6] text-white overflow-hidden flex items-center justify-center font-bold shrink-0">
              {profileImage ? <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" /> : userInitial}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-sm font-semibold text-[#3a5a40] dark:text-white truncate max-w-[180px]">{displayName}</div>
              <div className="text-xs text-[#4b5563] dark:text-[#b8d4e8] truncate max-w-[180px]">{accountLabel}</div>
            </div>
          </button>

          <button
            onClick={() => setProfileMenuOpen((prev) => !prev)}
            className="flex 2xl:hidden w-8 h-8 bg-[#588157] dark:bg-[#3ba9d6] rounded-full items-center justify-center text-white text-sm font-semibold cursor-pointer hover:ring-2 hover:ring-[#588157] dark:hover:ring-[#5bc0de] transition-all overflow-hidden"
            aria-label="Open profile menu"
          >
            {profileImage ? <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" /> : userInitial}
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl shadow-lg overflow-hidden z-50">
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenSettings?.();
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-2 text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
              >
                <Settings className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                Settings
              </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  onHelp?.();
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-2 text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
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
    </>
  );
}
