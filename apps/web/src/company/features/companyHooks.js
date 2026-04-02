import { useCallback, useEffect, useMemo, useState } from 'react';
import { companyAPI } from './companyAPI';

const EMPTY_LIST = [];
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

const useAsyncResource = (fetcher, deps = [], { cacheKey = '', fallbackData = null } = {}) => {
  const cachedData = useMemo(() => readCache(cacheKey, fallbackData), [cacheKey, fallbackData]);
  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(cachedData == null);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    if (data == null) {
      setLoading(true);
    }
    setError('');
    try {
      const result = await fetcher();
      setData(result);
      writeCache(cacheKey, result);
    } catch (err) {
      if (data == null) {
        setData(cachedData);
      }
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [cacheKey, cachedData, data, fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch, ...deps]);

  return { data, loading, error, refetch };
};

export const useCompanyJobs = () => {
  const fetchJobs = useCallback(() => companyAPI.getJobs(), []);
  const { data, loading, error, refetch } = useAsyncResource(fetchJobs, [], {
    cacheKey: 'kapit_company_jobs',
    fallbackData: { jobs: [] },
  });
  const jobs = useMemo(() => (Array.isArray(data?.jobs) ? data.jobs : EMPTY_LIST), [data]);
  return { jobs, loading, error, refetch };
};

export const useCompanyApplicants = () => {
  const fetchApplicants = useCallback(() => companyAPI.getApplicants(), []);
  const { data, loading, error, refetch } = useAsyncResource(fetchApplicants, [], {
    cacheKey: 'kapit_company_applicants',
    fallbackData: { applicants: [] },
  });
  const applicants = useMemo(() => (Array.isArray(data?.applicants) ? data.applicants : EMPTY_LIST), [data]);
  return { applicants, loading, error, refetch };
};

export const useCompanyAnalytics = () => {
  const fetchAnalytics = useCallback(() => companyAPI.getAnalytics(), []);
  const { data, loading, error, refetch } = useAsyncResource(fetchAnalytics, [], {
    cacheKey: 'kapit_company_analytics',
    fallbackData: {
      analytics: {
        totalJobs: 0,
        totalApplicants: 0,
        jobsByStatus: {},
        applicantsByStatus: {},
      },
    },
  });
  return { analytics: data?.analytics || null, loading, error, refetch };
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
