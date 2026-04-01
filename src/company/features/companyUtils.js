export const COMPANY_PATHS = {
  dashboard: '/company/dashboard',
  premium: '/company/premium',
  postJob: '/company/post-job',
  postJobPayment: '/company/post-job/payment',
  jobs: '/company/jobs',
  applicants: '/company/applicants',
  messages: '/company/messages',
  notifications: '/company/notifications',
  search: '/company/search',
  profile: '/company/profile',
  publicProfile: '/company/public-profile',
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

  window.location.assign(nextPathWithSearch);
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
    return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/30';
  if (value === 'draft')
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30';
  if (value === 'accepted')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30';
  if (value === 'rejected')
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-500/30';
  if (value === 'reviewed')
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/30';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30';
};

export const formatJobStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
};
