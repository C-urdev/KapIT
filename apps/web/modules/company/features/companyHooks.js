import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { companyAPI } from './companyAPI';

const EMPTY_LIST = [];
const RESOURCE_STALE_MS = 30 * 1000;
const WORKSPACE_PRIME_STALE_MS = 45 * 1000;
const resourceMemoryCache = new Map();
let workspacePrimePromise = null;
let workspacePrimeLastAt = 0;

const readCache = (key, fallback) => {
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

const writeCache = (key, value) => {
  if (typeof window === 'undefined' || !key) {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

const normalizeStoredCacheEntry = (entry, fallbackData) => {
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

const getCacheSnapshot = (cacheKey, fallbackData) => {
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

const setCacheData = (cacheKey, value) => {
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

const getInFlightRequest = (cacheKey) => {
  if (!cacheKey) {
    return null;
  }
  return resourceMemoryCache.get(cacheKey)?.promise || null;
};

const setInFlightRequest = (cacheKey, promise) => {
  if (!cacheKey) {
    return;
  }

  const existing = resourceMemoryCache.get(cacheKey);
  resourceMemoryCache.set(cacheKey, {
    ...(existing || {}),
    promise,
  });
};

const clearInFlightRequest = (cacheKey, promise) => {
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

const fetchWithDedupe = async (cacheKey, fetcher) => {
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
  fetcher,
  deps = [],
  { cacheKey = '', fallbackData = null, staleMs = RESOURCE_STALE_MS } = {},
) => {
  const cacheSnapshot = useMemo(() => getCacheSnapshot(cacheKey, fallbackData), [cacheKey, fallbackData]);
  const cachedData = cacheSnapshot.data;
  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(cachedData == null);
  const [error, setError] = useState('');
  const dataRef = useRef(cachedData);
  const lastFetchRef = useRef(Number(cacheSnapshot.lastSuccessAt || 0));

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const refetch = useCallback(async ({ force = false, silent = false } = {}) => {
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
      setData((previous) => (previous == null ? cachedData : previous));
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
  }, [refetch, ...deps]);

  return { data, loading, error, refetch };
};

const COMPANY_CACHE_KEYS = {
  jobs: 'kapit_company_jobs',
  applicants: 'kapit_company_applicants',
  analytics: 'kapit_company_analytics',
  profile: 'kapit_company_profile',
};

const COMPANY_CACHE_FALLBACKS = {
  jobs: { jobs: [] },
  applicants: { applicants: [], plan: { isPremium: false } },
  analytics: {
    analytics: {
      totalJobs: 0,
      totalApplicants: 0,
      jobsByStatus: {},
      applicantsByStatus: {},
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

export const useCompanyAnalytics = () => {
  const fetchAnalytics = useCallback(() => companyAPI.getAnalytics(), []);
  const { data, loading, error, refetch } = useAsyncResource(fetchAnalytics, [], {
    cacheKey: COMPANY_CACHE_KEYS.analytics,
    fallbackData: COMPANY_CACHE_FALLBACKS.analytics,
  });
  return { analytics: data?.analytics || null, loading, error, refetch };
};

export const primeCompanyProfileData = async () => {
  const response = await fetchWithDedupe(COMPANY_CACHE_KEYS.profile, () => companyAPI.getProfile());
  setCacheData(COMPANY_CACHE_KEYS.profile, response);
  return response;
};

export const useDeveloperSearch = (query) => {
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
} = {}) => {
  const now = Date.now();
  if (!force && workspacePrimePromise) {
    return workspacePrimePromise;
  }

  if (!force && workspacePrimeLastAt > 0 && now - workspacePrimeLastAt < WORKSPACE_PRIME_STALE_MS) {
    return [];
  }

  const tasks = [{
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
    tasks.map(async ({ key, fetcher }) => {
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
