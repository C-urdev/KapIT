import React from 'react';
import { Bell, BriefcaseBusiness, Building2, Search } from 'lucide-react';
import { clearCompanyPostJobFormDraft } from '@companyFeatures/postJobDraftStorage';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

export default function CompanyDesktopHeader({ user, unreadNotificationCount = 0 }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const companyName = user?.companyName || user?.username || 'Company';
  const profileImage = user?.profileImage || '';
  const initial = companyName.trim().charAt(0).toUpperCase() || 'C';

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) {
      params.set('query', query);
    }
    const suffix = params.toString();
    navigate(`${COMPANY_PATHS.search}${suffix ? `?${suffix}` : ''}`);
  };

  const handlePostJob = () => {
    clearCompanyPostJobFormDraft();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('company-post-job-draft');
    }
    navigate(COMPANY_PATHS.postJob);
  };

  return (
    <div className="hidden h-[68px] min-w-0 items-center justify-between gap-4 border-b border-[var(--workspace-border)] bg-[var(--workspace-appbar)] px-6 xl:flex 2xl:gap-6">
      <form onSubmit={handleSearch} className="flex min-w-0 max-w-[620px] flex-1 items-center">
        <label className="company-workspace-control relative block w-full">
          <span className="sr-only">Search developers</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--workspace-text-muted)]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search developers by skill, role, or location"
            className="h-10 w-full bg-transparent py-2 pl-10 pr-3 text-sm text-[var(--workspace-text-strong)] outline-none placeholder:text-[var(--workspace-text-muted)]"
          />
        </label>
      </form>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handlePostJob}
          className="company-workspace-primary-button inline-flex h-10 items-center gap-2 px-4"
        >
          <BriefcaseBusiness className="h-4 w-4" />
          <span>Post a job</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(COMPANY_PATHS.notifications)}
          className="relative flex h-10 w-10 items-center justify-center rounded-md border border-transparent text-[var(--workspace-text-muted)] transition-[background-color,border-color,color,transform] duration-150 hover:border-[var(--workspace-border)] hover:bg-[var(--workspace-surface-subtle)] hover:text-[var(--workspace-text-strong)] active:scale-[0.96]"
          aria-label="Open notifications"
          title="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadNotificationCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e63946] px-1 text-[10px] font-bold leading-none text-white">
              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => navigate(COMPANY_PATHS.profile)}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-transparent text-[var(--workspace-text-muted)] transition-[background-color,border-color,color,transform] duration-150 hover:border-[var(--workspace-border)] hover:bg-[var(--workspace-surface-subtle)] hover:text-[var(--workspace-text-strong)] active:scale-[0.96]"
          aria-label="Open company profile"
          title={companyName}
        >
          {profileImage ? (
            <img src={profileImage} alt={`${companyName} logo`} className="h-8 w-8 rounded-md object-cover" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--workspace-primary)] text-sm font-semibold text-white">
              {initial || <Building2 className="h-[18px] w-[18px]" />}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
