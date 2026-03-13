import { useEffect, useState } from 'react';
import { developerAPI } from './developerAPI';

export const useMyDeveloperProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await developerAPI.getMyProfile();
      setProfile(data?.profile || null);
    } catch (err) {
      setProfile(null);
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

