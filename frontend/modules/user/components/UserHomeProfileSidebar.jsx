import React, { useEffect, useRef, useState } from 'react';
import { ChevronsUpDown, CheckCircle2 } from 'lucide-react';

const PROGRESS_SEGMENTS = 28;

export default function UserHomeProfileSidebar({ user, userType, onOpenMyProfile, onLogout }) {
  const displayName = user?.fullName || user?.name || user?.username || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || user?.avatarUrl || '';
  const profileCompletion = user?.profileCompletion ?? 34;
  const completedSegmentCount = Math.round((profileCompletion / 100) * PROGRESS_SEGMENTS);
  const profileSubLabel = user?.headline || user?.desiredJob || 'Open profile';
  const isComplete = profileCompletion >= 100;
  const actionsRef = useRef(null);
  const [profileActionsOpen, setProfileActionsOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    if ((!profileActionsOpen && !logoutDialogOpen) || typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileActionsOpen(false);
        setLogoutDialogOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileActionsOpen, logoutDialogOpen]);

  useEffect(() => {
    if (!profileActionsOpen || typeof document === 'undefined') {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setProfileActionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [profileActionsOpen]);

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    onLogout?.();
  };

  const handleOpenLogoutDialog = () => {
    setProfileActionsOpen(false);
    setLogoutDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Onboarding Hub - hidden when 100% complete */}
      {!isComplete && (
        <section
          className="overflow-hidden rounded-xl border border-[var(--user-border)] bg-[var(--user-surface)] shadow-[0_4px_16px_rgba(25,42,28,0.06)]"
          aria-label="Onboarding hub"
        >
          <div className="px-4 pb-3 pt-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold leading-none text-[var(--user-text-strong)]">Onboarding hub</p>
              <span className="text-[10px] font-semibold tabular-nums text-[var(--user-primary)]">{profileCompletion}%</span>
            </div>

            <div
              className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--user-border)]"
              aria-label="Profile completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={profileCompletion}
              role="progressbar"
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--user-primary)] transition-[width] duration-500 ease-out"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

          </div>
        </section>
      )}

      {/* Completed state - shown when 100% */}
      {isComplete && (
        <section
          className="flex items-center gap-2 overflow-hidden rounded-xl border border-[var(--user-primary)]/30 bg-[var(--user-primary-soft)] px-4 py-3"
          aria-label="Onboarding complete"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--user-primary)]" />
          <p className="text-[11px] font-semibold text-[var(--user-primary)]">100% Completed</p>
        </section>
      )}

      {/* User Profile Card */}
      <section
        ref={actionsRef}
        className="relative rounded-xl border border-[var(--user-border)] bg-[var(--user-surface)] shadow-[0_4px_16px_rgba(25,42,28,0.06)]"
        aria-label="User profile"
      >
        {logoutDialogOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-actions-title"
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20 px-4 py-6 backdrop-blur-[2px]"
            onClick={() => setLogoutDialogOpen(false)}
          >
            <div
              className="w-full max-w-[21rem] rounded-[1.35rem] border border-[var(--user-border)] bg-[var(--user-surface)] p-4 text-left shadow-[0_24px_70px_rgba(15,23,18,0.24)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="text-center">
                <h2 id="profile-actions-title" className="text-[17px] font-semibold leading-6 text-[var(--user-text-strong)]">Are you sure you want to log out?</h2>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLogoutDialogOpen(false)}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border border-[var(--user-border)] bg-[var(--user-surface)] text-[13px] font-semibold text-[var(--user-text)] transition-[background-color,border-color,color,transform] duration-150 ease-out hover:border-[var(--user-primary)]/35 hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-text-strong)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--user-primary)]/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-[#dc2626] text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(220,38,38,0.24)] transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-[#b91c1c] hover:shadow-[0_12px_30px_rgba(220,38,38,0.3)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--user-surface)]"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {profileActionsOpen ? (
          <div
            role="menu"
            aria-label="Profile actions"
            className="absolute bottom-[calc(100%+0.5rem)] right-1 z-30 w-40 rounded-xl border border-[var(--user-border)] bg-[var(--user-surface)] p-1.5 text-left shadow-[0_18px_42px_rgba(15,23,18,0.2)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenLogoutDialog}
              className="flex h-10 w-full items-center rounded-lg px-3 text-[13px] font-semibold text-[#dc2626] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#dc2626]/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dc2626]/35"
            >
              Log out
            </button>
          </div>
        ) : null}

        <div className="flex items-center overflow-hidden rounded-xl">
          <button
            type="button"
            onClick={() => onOpenMyProfile?.()}
            aria-label="Open profile"
            className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-3 text-left transition-[background-color] duration-150 ease-out hover:bg-[var(--user-surface-selected)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--user-primary)]/45"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--user-primary)] text-[13px] font-semibold text-white shadow-sm ring-2 ring-[var(--user-surface)]">
              {profileImage ? (
                <img src={profileImage} alt={`${displayName} profile`} className="h-full w-full object-cover" />
              ) : (
                userInitial
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-5 text-[var(--user-text-strong)]">{displayName}</p>
              <p className="truncate text-[11px] leading-4 text-[var(--user-text-muted)]">{profileSubLabel}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setProfileActionsOpen((current) => !current)}
            aria-label="Open profile actions"
            aria-haspopup="menu"
            aria-expanded={profileActionsOpen}
            className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--user-text-muted)] transition-[background-color,color,transform] duration-150 ease-out hover:bg-[var(--user-surface-selected)] hover:text-[var(--user-text-strong)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--user-primary)]/45"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ChevronsUpDown className={`h-3.5 w-3.5 transition-[color,transform] duration-150 ease-out ${profileActionsOpen ? 'rotate-180 text-[var(--user-text-strong)]' : ''}`} />
          </button>
        </div>
      </section>
    </div>
  );
}
