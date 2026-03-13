import { useEffect, useMemo, useState } from 'react';
import { companyAPI } from './companyAPI';

const useAsyncResource = (fetcher, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = async () => {
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
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch };
};

export const useCompanyJobs = () => {
  const { data, loading, error, refetch } = useAsyncResource(() => companyAPI.getJobs(), []);
  return { jobs: data?.jobs || [], loading, error, refetch };
};

export const useCompanyApplicants = () => {
  const { data, loading, error, refetch } = useAsyncResource(() => companyAPI.getApplicants(), []);
  return { applicants: data?.applicants || [], loading, error, refetch };
};

export const useCompanyAnalytics = () => {
  const { data, loading, error, refetch } = useAsyncResource(() => companyAPI.getAnalytics(), []);
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
  const { data, loading, error, refetch } = useAsyncResource(() => companyAPI.searchDevelopers(normalized), deps);
  return { developers: data?.developers || [], loading, error, refetch };
};
