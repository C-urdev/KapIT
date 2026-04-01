import { useEffect, useMemo, useState } from 'react';
import { developerAPI } from './developerAPI';

const PROFILE_CACHE_KEY = 'kapit_user_developer_profile';

const readProfileCache = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeProfileCache = (profile) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (profile == null) {
      window.sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return;
    }

    window.sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore cache write failures.
  }
};

export const useMyDeveloperProfile = () => {
  const cachedProfile = useMemo(() => readProfileCache(), []);
  const [profile, setProfile] = useState(cachedProfile);
  const [loading, setLoading] = useState(cachedProfile == null);
  const [error, setError] = useState('');

  const refetch = async () => {
    if (profile == null) {
      setLoading(true);
    }
    setError('');
    try {
      const data = await developerAPI.getMyProfile();
      const nextProfile = data?.profile || null;
      setProfile(nextProfile);
      writeProfileCache(nextProfile);
    } catch (err) {
      if (profile == null) {
        setProfile(cachedProfile);
      }
      setError(err?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { profile, loading, error, refetch };
};
