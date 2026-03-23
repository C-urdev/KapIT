import React from 'react';
import { X, LogOut, HelpCircle, Settings, Zap, TrendingUp } from 'lucide-react';

export default function UserMobileMenuDrawer({ open, active, user, setMobileMenuOpen, onOpenSettings, onOpenPremium, onHelp, onLogout }) {
  const displayName = user?.fullName || user?.username || user?.email || 'User';
  const profileImage = user?.profileImage || '';
  const initial = displayName.charAt(0).toUpperCase();
  const userType = user?.type === 'company' || user?.accountType === 'company' ? 'company' : 'employee';
  const isPremium = !!user?.isPremium;

  if (!open) return null;

  return (
    <div className={`xl:hidden fixed inset-0 z-[70] transition-all duration-300 ease-out ${active ? 'bg-black/45 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0'}`}>
      <button type="button" className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" />
      <div className={`absolute left-0 top-0 bottom-0 flex w-80 max-w-[90vw] flex-col overflow-hidden border-r border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#0a1628] shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}>
        <div className="flex items-center justify-between border-b border-[#a3b18a] dark:border-[#1e3a5f] px-4 py-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#a3b18a]/60 bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#102235]">
              {profileImage ? (
                <img src={profileImage} alt={`${displayName} avatar`} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-[#588157] text-lg font-bold text-white">
                  {initial}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-[#3a5a40] dark:text-white">{displayName}</div>
              <div className="truncate text-xs text-[#4b5563] dark:text-[#b8d4e8]">User account</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSettings?.();
            }}
            className="w-full text-left px-4 py-3 rounded-2xl text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors flex items-center gap-3"
          >
            <Settings className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
            Settings
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onHelp?.();
            }}
            className="w-full text-left px-4 py-3 rounded-2xl text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors flex items-center gap-3"
          >
            <HelpCircle className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
            Help
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLogout?.();
            }}
            className="w-full text-left px-4 py-3 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-3"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>

          {!isPremium ? (
            <div className="pt-2 rounded-2xl border border-[#f2c84b] bg-[#fffdf5] p-4 shadow-[0_8px_24px_rgba(242,200,75,0.12)] dark:border-[#8a6a15] dark:bg-[#2b2206]">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#d69100] dark:bg-[#3a2f0d] dark:text-[#f5c84c]">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-[#3a5a40] dark:text-white">Upgrade to Premium</h4>
                  <p className="mb-3 text-xs text-[#344e41] dark:text-[#e7d9a5]">
                    {userType === 'employee'
                      ? 'Top search rankings, unlimited projects, premium badge'
                      : 'Priority candidate access, advanced filters, unlimited views'}
                  </p>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenPremium?.();
                    }}
                    className="w-full rounded-xl bg-[#f2b500] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#dfaa00] dark:bg-[#d9a300] dark:hover:bg-[#c39200]"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="pt-2 rounded-2xl border border-[#c8d7f2] bg-[#f8fbff] p-4 shadow-[0_8px_24px_rgba(105,145,214,0.12)] dark:border-[#30538a] dark:bg-[#102235]">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#4a77c4] dark:bg-[#183154] dark:text-[#8ebbf7]">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h4 className="mb-1 font-semibold text-[#3a5a40] dark:text-white">
                  {userType === 'employee' ? 'Career Tip' : 'Hiring Tip'}
                </h4>
                <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">
                  {userType === 'employee'
                    ? 'Showcase live projects in your portfolio. Recruiters spend 6x more time on profiles with working demos.'
                    : 'Candidates with GitHub profiles get 3x more responses. Look for active contributors to find passionate developers.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
