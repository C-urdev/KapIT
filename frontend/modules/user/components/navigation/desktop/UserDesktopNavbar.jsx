import React from 'react';
import {
  Bell,
  Crown,
  Search,
} from 'lucide-react';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';

export default function UserDesktopNavbar({
  hideProfileControl = false,
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
  onOpenPremium,
  onOpenNotifications,
  unreadNotificationCount = 0,
}) {
  return (
    <div className="hidden h-[68px] min-w-0 items-center justify-between gap-4 xl:flex 2xl:gap-6">
      {/* Search */}
      <div className="flex min-w-0 flex-1 max-w-[620px] items-center gap-4">
        <div ref={searchRef} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--user-text-muted)]" />
          <input
            type="search"
            placeholder="Search people, companies, projects, or jobs"
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
            className="h-10 w-full rounded-lg border border-[var(--user-border)] bg-[var(--user-surface-subtle)] py-2 pl-10 pr-3 text-sm text-[var(--user-text-strong)] outline-none transition-[border-color,background-color,box-shadow] duration-150 placeholder:text-[var(--user-text-muted)] focus:border-[var(--user-primary)] focus:bg-[var(--user-surface)] focus:ring-2 focus:ring-[var(--user-primary-soft)]"
          />

          {searchOpen && searchQuery.trim() ? (
            <div className="user-workspace-elevated absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto p-1.5">
              {searchLoading ? (
                <p className="px-3 py-3 text-sm text-[var(--user-text-muted)]">Searching...</p>
              ) : null}

              {!searchLoading && searchError ? (
                <p className="px-3 py-3 text-sm text-[var(--user-danger)]">{searchError}</p>
              ) : null}

              {!searchLoading && !searchError && searchResults.length === 0 ? (
                <p className="px-3 py-3 text-sm text-[var(--user-text-muted)]">No matching accounts found.</p>
              ) : null}

              {!searchLoading && !searchError
                ? searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        onSearchResultSelect?.(result);
                      }}
                      onClick={() => onSearchResultSelect?.(result)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[var(--user-surface-selected)]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--user-primary)] text-sm font-semibold text-white">
                        {result.profileImage ? (
                          <img src={result.profileImage} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (result.username || result.email || 'A').charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-[var(--user-text-strong)]">
                            {result.companyName || result.fullName || result.username || result.email}
                          </span>
                          {result.isPremium ? <PremiumBadge compact /> : null}
                        </span>
                        <span className="block truncate text-xs text-[var(--user-text-muted)]">
                          {result.type === 'company' ? 'Company' : 'User'}{result.email ? ` - ${result.email}` : ''}
                        </span>
                      </span>
                    </button>
                  ))
                : null}
            </div>
          ) : null}
        </div>
      </div>

      {!hideProfileControl ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Buy Premium"
            onClick={onOpenPremium}
            className="flex h-10 items-center gap-2 rounded-lg bg-[var(--user-premium)] px-4 text-sm font-semibold text-[var(--user-premium-ink)] transition-[background-color,box-shadow,transform] duration-150 hover:brightness-105 hover:shadow-md active:scale-[0.98]"
          >
            <Crown className="h-4 w-4" />
            <span>Buy Premium</span>
          </button>
          <HeaderIconButton
            icon={Bell}
            label="Notifications"
            ariaLabel="Open notifications"
            onClick={onOpenNotifications}
            badgeCount={unreadNotificationCount}
          />
        </div>
      ) : null}
    </div>
  );
}

function HeaderIconButton({ icon: Icon, label, ariaLabel, onClick, badgeCount = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-[var(--user-text-muted)] transition-[background-color,border-color,color,transform] duration-150 hover:border-[var(--user-border)] hover:bg-[var(--user-surface-subtle)] hover:text-[var(--user-text-strong)] active:scale-[0.96]"
    >
      <Icon className="h-[18px] w-[18px]" />
      {badgeCount > 0 ? (
        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e63946] px-1 text-[10px] font-bold leading-none text-white">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
    </button>
  );
}
