import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { companyAPI } from './companyAPI';

const EMPTY_LIST: any[] = [];
const RESOURCE_STALE_MS = 30 * 1000;
const WORKSPACE_PRIME_STALE_MS = 45 * 1000;
const resourceMemoryCache = new Map<string, any>();
let workspacePrimePromise: Promise<any> | null = null;
let workspacePrimeLastAt = 0;

const readCache = (key: string, fallback: any): any => {
  if (typeof window === 'undefined' || !key) {
    return fallback;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeCache = (key: string, value: any): void => {
  if (typeof window === 'undefined' || !key) {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

const normalizeStoredCacheEntry = (entry: any, fallbackData: any): { data: any; lastSuccessAt: number } => {
  if (entry && typeof entry === 'object' && Object.prototype.hasOwnProperty.call(entry, 'data')) {
    return {
      data: entry.data,
      lastSuccessAt: Number(entry.lastSuccessAt || 0),
    };
  }

  return {
    data: entry == null ? fallbackData : entry,
    lastSuccessAt: 0,
  };
};

const getCacheSnapshot = (cacheKey: string, fallbackData: any): { data: any; lastSuccessAt: number } => {
  if (!cacheKey) {
    return { data: fallbackData, lastSuccessAt: 0 };
  }

  const memoryEntry = resourceMemoryCache.get(cacheKey);
  if (memoryEntry && memoryEntry.data != null) {
    return {
      data: memoryEntry.data,
      lastSuccessAt: Number(memoryEntry.lastSuccessAt || 0),
    };
  }

  const sessionEntry = normalizeStoredCacheEntry(readCache(cacheKey, fallbackData), fallbackData);
  resourceMemoryCache.set(cacheKey, {
    ...(memoryEntry || {}),
    data: sessionEntry.data,
    lastSuccessAt: Number(sessionEntry.lastSuccessAt || 0),
  });
  return {
    data: sessionEntry.data,
    lastSuccessAt: Number(sessionEntry.lastSuccessAt || 0),
  };
};

const setCacheData = (cacheKey: string, value: any): void => {
  if (!cacheKey) {
    return;
  }

  const existing = resourceMemoryCache.get(cacheKey);
  const nextLastSuccessAt = Date.now();
  resourceMemoryCache.set(cacheKey, {
    ...(existing || {}),
    data: value,
    lastSuccessAt: nextLastSuccessAt,
  });
  writeCache(cacheKey, {
    data: value,
    lastSuccessAt: nextLastSuccessAt,
  });
};

const getInFlightRequest = (cacheKey: string): Promise<any> | null => {
  if (!cacheKey) {
    return null;
  }
  return resourceMemoryCache.get(cacheKey)?.promise || null;
};

const setInFlightRequest = (cacheKey: string, promise: Promise<any>): void => {
  if (!cacheKey) {
    return;
  }

  const existing = resourceMemoryCache.get(cacheKey);
  resourceMemoryCache.set(cacheKey, {
    ...(existing || {}),
    promise,
  });
};

const clearInFlightRequest = (cacheKey: string, promise: Promise<any>): void => {
  if (!cacheKey) {
    return;
  }

  const existing = resourceMemoryCache.get(cacheKey);
  if (!existing || existing.promise !== promise) {
    return;
  }

  resourceMemoryCache.set(cacheKey, {
    ...existing,
    promise: null,
  });
};

const fetchWithDedupe = async (cacheKey: string, fetcher: () => Promise<any> | any): Promise<any> => {
  if (!cacheKey) {
    return fetcher();
  }

  const pending = getInFlightRequest(cacheKey);
  if (pending) {
    return pending;
  }

  const request = Promise.resolve()
    .then(fetcher)
    .then((result) => {
      setCacheData(cacheKey, result);
      return result;
    })
    .finally(() => {
      clearInFlightRequest(cacheKey, request);
    });

  setInFlightRequest(cacheKey, request);
  return request;
};

const useAsyncResource = (
  fetcher: () => Promise<any> | any,
  deps: any[] = [],
  { cacheKey = '', fallbackData = null, staleMs = RESOURCE_STALE_MS }: { cacheKey?: string; fallbackData?: any; staleMs?: number } = {},
) => {
  const cacheSnapshot = useMemo(() => getCacheSnapshot(cacheKey, fallbackData), [cacheKey, fallbackData]);
  const cachedData = cacheSnapshot.data;
  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(cachedData == null);
  const [error, setError] = useState('');
  const dataRef = useRef(cachedData);
  const lastFetchRef = useRef(Number(cacheSnapshot.lastSuccessAt || 0));
  const depsSignature = useMemo(
    () => JSON.stringify(deps, (_key, value) => {
      if (typeof value === 'function') {
        return '[function]';
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }),
    [deps],
  );

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const refetch = useCallback(async ({ force = false, silent = false }: { force?: boolean; silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(dataRef.current == null);
    }
    setError('');

    try {
      const now = Date.now();
      const isFresh = !force && lastFetchRef.current > 0 && now - lastFetchRef.current < staleMs;
      const existingData = dataRef.current;
      const result = isFresh && existingData != null
        ? existingData
        : await fetchWithDedupe(cacheKey, fetcher);

      setData(result);
      lastFetchRef.current = Date.now();
    } catch (err) {
      const hadData = dataRef.current != null || cachedData != null;
      setData((previous: any) => (previous == null ? cachedData : previous));
      // Keep the UI stable when we already have data (e.g. transient 429).
      setError(hadData ? '' : (err?.message || 'Request failed'));
    } finally {
      setLoading(false);
    }
  }, [cacheKey, cachedData, fetcher, staleMs]);

  useEffect(() => {
    const hasVisibleData = dataRef.current != null;
    const now = Date.now();
    const isFresh = lastFetchRef.current > 0 && now - lastFetchRef.current < staleMs;

    if (hasVisibleData && isFresh) {
      return;
    }

    refetch({ silent: hasVisibleData });
  }, [depsSignature, refetch, staleMs]);

  return { data, loading, error, refetch };
};

const COMPANY_CACHE_KEYS = {
  jobs: 'kapit_company_jobs',
  applicants: 'kapit_company_applicants',
  analytics: 'kapit_company_analytics',
  profile: 'kapit_company_profile',
};

const COMPANY_CACHE_FALLBACKS: Record<string, any> = {
  jobs: { jobs: [] },
  applicants: { applicants: [], plan: { isPremium: false } },
  analytics: {
    analytics: {
      totalJobs: 0,
      openJobs: 0,
      draftJobs: 0,
      filledJobs: 0,
      closedJobs: 0,
      totalApplicants: 0,
      newApplicantsInRange: 0,
      applicantsAwaitingReview: 0,
      averageApplicantsPerOpenJob: 0,
      averageDaysOpen: null,
      jobsByStatus: {},
      applicantsByStatus: {},
      applicationsOverTime: [],
      range: null,
      previousPeriod: null,
    },
  },
  profile: { company: null },
};

export const useCompanyJobs = () => {
  const fetchJobs = useCallback(() => companyAPI.getJobs(), []);
  const { data, loading, error, refetch } = useAsyncResource(fetchJobs, [], {
    cacheKey: COMPANY_CACHE_KEYS.jobs,
    fallbackData: COMPANY_CACHE_FALLBACKS.jobs,
  });
  const jobs = useMemo(() => (Array.isArray(data?.jobs) ? data.jobs : EMPTY_LIST), [data]);
  return { jobs, loading, error, refetch };
};

export const useCompanyApplicants = () => {
  const fetchApplicants = useCallback(() => companyAPI.getApplicants(), []);
  const { data, loading, error, refetch } = useAsyncResource(fetchApplicants, [], {
    cacheKey: COMPANY_CACHE_KEYS.applicants,
    fallbackData: COMPANY_CACHE_FALLBACKS.applicants,
  });
  const applicants = useMemo(() => (Array.isArray(data?.applicants) ? data.applicants : EMPTY_LIST), [data]);
  return { applicants, plan: data?.plan || { isPremium: false }, loading, error, refetch };
};

export const useCompanyAnalytics = (input: any = {}) => {
  const normalized = useMemo(() => {
    const days = Number(input?.days || 30);
    return {
      days: Number.isFinite(days) ? days : 30,
      start: String(input?.start || '').trim(),
      end: String(input?.end || '').trim(),
    };
  }, [input?.days, input?.end, input?.start]);
  const deps = useMemo(() => [JSON.stringify(normalized)], [normalized]);
  const cacheKey = useMemo(() => `${COMPANY_CACHE_KEYS.analytics}:${JSON.stringify(normalized)}`, [normalized]);
  const fetchAnalytics = useCallback(() => companyAPI.getAnalytics(normalized), [normalized]);
  const { data, loading, error, refetch } = useAsyncResource(fetchAnalytics, deps, {
    cacheKey,
    fallbackData: COMPANY_CACHE_FALLBACKS.analytics,
  });
  return { analytics: data?.analytics || null, loading, error, refetch };
};

export const primeCompanyProfileData = async () => {
  const response = await fetchWithDedupe(COMPANY_CACHE_KEYS.profile, () => companyAPI.getProfile());
  setCacheData(COMPANY_CACHE_KEYS.profile, response);
  return response;
};

export const useDeveloperSearch = (query: any) => {
  const normalized = useMemo(() => {
    if (query && typeof query === 'object') {
      return {
        q: String(query.q || '').trim(),
        skill: String(query.skill || '').trim(),
        location: String(query.location || '').trim(),
        minExperience: query.minExperience == null ? '' : String(query.minExperience).trim(),
      };
    }
    return String(query || '').trim();
  }, [query]);

  const deps = useMemo(() => [JSON.stringify(normalized)], [normalized]);
  const fetchDevelopers = useCallback(() => companyAPI.searchDevelopers(normalized), [normalized]);
  const { data, loading, error, refetch } = useAsyncResource(fetchDevelopers, deps);
  const developers = useMemo(() => (Array.isArray(data?.developers) ? data.developers : EMPTY_LIST), [data]);
  return { developers, loading, error, refetch };
};

export const primeCompanyWorkspaceData = ({
  includeApplicants = false,
  includeAnalytics = false,
  force = false,
}: { includeApplicants?: boolean; includeAnalytics?: boolean; force?: boolean } = {}): Promise<any> | any[] => {
  const now = Date.now();
  if (!force && workspacePrimePromise) {
    return workspacePrimePromise;
  }

  if (!force && workspacePrimeLastAt > 0 && now - workspacePrimeLastAt < WORKSPACE_PRIME_STALE_MS) {
    return [];
  }

  const tasks: Array<{ key: string; fetcher: () => Promise<any> | any }> = [{
    key: COMPANY_CACHE_KEYS.jobs,
    fetcher: () => companyAPI.getJobs(),
  }];

  if (includeAnalytics) {
    tasks.push({
      key: COMPANY_CACHE_KEYS.analytics,
      fetcher: () => companyAPI.getAnalytics(),
    });
  }

  if (includeApplicants) {
    tasks.push({
      key: COMPANY_CACHE_KEYS.applicants,
      fetcher: () => companyAPI.getApplicants(),
    });
  }

  workspacePrimePromise = Promise.allSettled(
    tasks.map(async ({ key, fetcher }: { key: string; fetcher: () => Promise<any> | any }) => {
      const response = await fetchWithDedupe(key, fetcher);
      setCacheData(key, response);
      return response;
    }),
  ).finally(() => {
    workspacePrimeLastAt = Date.now();
    workspacePrimePromise = null;
  });

  return workspacePrimePromise;
};
