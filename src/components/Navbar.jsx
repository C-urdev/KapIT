// Navbar 

import React, { useEffect, useRef, useState } from 'react';
import { Search, Home, Briefcase, MessageCircle, Bell, Moon, Sun, Menu, X, LogOut, HelpCircle, Settings } from 'lucide-react';
import { useTheme } from '@context/ThemeContext';
import { searchAccounts } from '../services/authService';

export default function Navbar({ activeNav, setActiveNav, user, mobileMenuOpen, setMobileMenuOpen, onHelp, onLogout, onOpenSettings, onOpenPublicProfile }) {
  const { theme, toggleTheme } = useTheme();
  const displayName = user?.username || user?.name || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const searchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState('');

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

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[#0a1628] border-b border-[#a3b18a] dark:border-[#1e3a5f] shadow-sm">
      <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex items-center gap-4 min-w-0 xl:flex-[0_0_42%]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveNav('home')}
                className="text-xl font-bold text-[#3a5a40] dark:text-white hidden sm:block"
                aria-label="Go to home"
              >
                kapIT
              </button>
            </div>
            
            <div className="flex-1 max-w-xl hidden md:block">
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

                    {!searchLoading &&
                      !searchError &&
                      searchResults.map((result) => (
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
                                <img
                                  src={result.profileImage}
                                  alt={`${result.username || result.email || 'Account'} profile`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (result.username || result.email || 'A').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#3a5a40] dark:text-white truncate">{result.username || result.email}</p>
                          <p className="text-xs text-[#344e41] dark:text-[#b8d4e8]">{result.type === 'company' ? 'Company' : 'User'} • {result.email}</p>
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
              <NavButton icon={Briefcase} label="Projects" active={activeNav === 'projects'} onClick={() => setActiveNav('projects')} />
              <NavButton icon={MessageCircle} label="Messages" active={activeNav === 'messages'} onClick={() => setActiveNav('messages')} />
              <NavButton icon={Bell} label="Notifications" active={activeNav === 'notifications'} onClick={() => setActiveNav('notifications')} />
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-2 xl:flex-[0_0_18%] justify-end">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
            </button>
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="w-8 h-8 bg-[#588157] dark:bg-[#3ba9d6] rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:ring-2 hover:ring-[#588157] dark:hover:ring-[#5bc0de] transition-all overflow-hidden"
                aria-label="Open profile menu"
              >
                {profileImage ? (
                  <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
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

          <button
            className="xl:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#344e41] dark:text-white" /> : <Menu className="w-6 h-6 text-[#344e41] dark:text-white" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#0a1628]">
          <div className="px-4 py-2 space-y-1">
            <MobileNavButton icon={Home} label="Home" active={activeNav === 'home'} onClick={() => { setActiveNav('home'); setMobileMenuOpen(false); }} />
            <MobileNavButton icon={Briefcase} label="Jobs" active={activeNav === 'jobs'} onClick={() => { setActiveNav('jobs'); setMobileMenuOpen(false); }} />
            <MobileNavButton icon={Briefcase} label="Projects" active={activeNav === 'projects'} onClick={() => { setActiveNav('projects'); setMobileMenuOpen(false); }} />
            <MobileNavButton icon={MessageCircle} label="Messages" active={activeNav === 'messages'} onClick={() => { setActiveNav('messages'); setMobileMenuOpen(false); }} />
            <MobileNavButton icon={Bell} label="Notifications" active={activeNav === 'notifications'} onClick={() => { setActiveNav('notifications'); setMobileMenuOpen(false); }} />
            <div className="border-t border-[#a3b18a] dark:border-[#1e3a5f] pt-2 mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings?.();
                }}
                className="w-full text-left px-4 py-3 rounded-lg text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors flex items-center gap-2"
              >
                <Settings className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
                Settings
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onHelp?.();
                }}
                className="w-full text-left px-4 py-3 rounded-lg text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors flex items-center gap-2"
              >
                <HelpCircle className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
                Help
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout?.();
                }}
                className="w-full text-left px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full min-w-0 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors group ${
        active ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#344e41] dark:text-white hover:text-[#3a5a40] dark:hover:text-[#b8d4e8]'
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs font-medium truncate px-1">{label}</span>
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#588157] dark:bg-[#3ba9d6]" />}
    </button>
  );
}

function MobileNavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
        active ? 'bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#588157] dark:text-[#3ba9d6]' : 'text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f]'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
