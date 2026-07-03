import { useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams as useRRSearchParams, type To } from 'react-router-dom';

/**
 * App-wide router hook that provides push/replace/back/forward helpers.
 * Drop-in replacement for the old next/navigation useRouter shim.
 */
export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useRRSearchParams();

  return useMemo(() => ({
    push: (url: To) => navigate(url),
    replace: (url: To) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    prefetch: () => {}, // no-op
    pathname: location.pathname,
    query: Object.fromEntries(searchParams.entries()) as Record<string, string>,
  }), [navigate, location.pathname, searchParams]);
}

export const usePathname = () => useLocation().pathname;
export const useSearchParams = () => {
  const [searchParams] = useRRSearchParams();
  return searchParams;
};
