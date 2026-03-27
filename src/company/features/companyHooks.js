import { useCallback, useEffect, useMemo, useState } from 'react';
import { companyAPI } from './companyAPI';

const useAsyncResource = (fetcher, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setData(null);
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch, ...deps]);

  return { data, loading, error, refetch };
};

export const useCompanyJobs = () => {
  const fetchJobs = useCallback(() => companyAPI.getJobs(), []);
  const { data, loading, error, refetch } = useAsyncResource(fetchJobs, []);
  return { jobs: data?.jobs || [], loading, error, refetch };
};

export const useCompanyApplicants = () => {
  const fetchApplicants = useCallback(() => companyAPI.getApplicants(), []);
  const { data, loading, error, refetch } = useAsyncResource(fetchApplicants, []);
  return { applicants: data?.applicants || [], loading, error, refetch };
};

export const useCompanyAnalytics = () => {
  const fetchAnalytics = useCallback(() => companyAPI.getAnalytics(), []);
  const { data, loading, error, refetch } = useAsyncResource(fetchAnalytics, []);
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
  return { developers: data?.developers || [], loading, error, refetch };
};



