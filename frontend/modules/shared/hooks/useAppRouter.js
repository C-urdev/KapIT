import { useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams as useRRSearchParams } from 'react-router-dom';

/**
 * App-wide router hook that provides push/replace/back/forward helpers.
 * Drop-in replacement for the old next/navigation useRouter shim.
 */
export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useRRSearchParams();

  return useMemo(() => ({
    push: (url) => navigate(url),
    replace: (url) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    prefetch: () => {}, // no-op
    pathname: location.pathname,
    query: Object.fromEntries(searchParams.entries()),
  }), [navigate, location.pathname, searchParams]);
}

export const usePathname = () => useLocation().pathname;
export const useSearchParams = () => {
  const [searchParams] = useRRSearchParams();
  return searchParams;
};
