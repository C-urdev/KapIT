export const COMPANY_PATHS = {
  dashboard: '/company/dashboard',
  help: '/company/help',
  premium: '/company/premium',
  postJob: '/company/post-job',
  postJobPayment: '/company/post-job/payment',
  jobs: '/company/jobs',
  applicants: '/company/applicants',
  messages: '/company/messages',
  notifications: '/company/notifications',
  search: '/company/search',
  settings: '/company/settings',
  settingsCompanyInfo: '/company/settings/company-info',
  settingsNotifications: '/company/settings/notifications',
  profile: '/company/profile',
  publicProfile: '/company/public-profile',
};

let navigateWithRouter = null;

export const setCompanyNavigator = (handler) => {
  navigateWithRouter = typeof handler === 'function' ? handler : null;
  return () => {
    if (navigateWithRouter === handler) {
      navigateWithRouter = null;
    }
  };
};

export const isCompanyRoute = (pathname) => typeof pathname === 'string' && pathname.startsWith('/company/');

export const getCompanyRouteKey = (pathname) => {
  const path = String(pathname || '');
  const entry = Object.entries(COMPANY_PATHS).find(([, value]) => value === path);
  return entry ? entry[0] : null;
};

export const navigate = (to) => {
  const next = String(to || '/');
  if (typeof window === 'undefined') {
    return;
  }

  const nextUrl = new URL(next, window.location.origin);
  const currentPathWithSearch = `${window.location.pathname}${window.location.search}`;
  const nextPathWithSearch = `${nextUrl.pathname}${nextUrl.search}`;

  if (currentPathWithSearch === nextPathWithSearch) {
    return;
  }

  if (nextUrl.origin !== window.location.origin) {
    window.location.assign(nextPathWithSearch);
    return;
  }

  if (navigateWithRouter) {
    navigateWithRouter(nextPathWithSearch);
    return;
  }

  // Keep transitions instant even before router binding is attached.
  window.history.pushState({}, '', nextPathWithSearch);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export const formatSkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.filter(Boolean);
  if (typeof skills === 'string')
    return skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
};

export const statusBadgeClass = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'open')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30';
  if (value === 'closed')
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30';
  if (value === 'filled')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30';
  if (value === 'draft')
    return 'bg-[#f5f5f2] text-[#5f6f52] border-[#d6d3c9] dark:bg-[#2f343b]/50 dark:text-[#d8dee3] dark:border-[#444d57]';
  if (value === 'accepted')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30';
  if (value === 'rejected')
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-500/30';
  if (value === 'reviewed')
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30';
  return 'bg-[#f5f5f2] text-[#5f6f52] border-[#d6d3c9] dark:bg-[#2f343b]/50 dark:text-[#d8dee3] dark:border-[#444d57]';
};

export const formatJobStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
};
