import React from 'react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';
import { getPublicProfile } from '@sharedServices/authService';

const getSearchParam = (key) => {
  try {
    const params = new URLSearchParams(window.location.search);
    return String(params.get(key) || '').trim();
  } catch {
    return '';
  }
};

export default function CompanyPublicProfilePage() {
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const profileId = getSearchParam('id');
  const fromPath = getSearchParam('from') || COMPANY_PATHS.search;

  React.useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!profileId) {
        setError('Profile not found.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getPublicProfile(profileId);
        if (!cancelled) {
          setProfile(data || null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError?.message || 'Failed to load profile.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const handleBack = () => {
    navigate(fromPath || COMPANY_PATHS.search);
  };

  const handleMessage = (targetProfile) => {
    if (!targetProfile?.id) return;
    navigate(`${COMPANY_PATHS.messages}?contact=${encodeURIComponent(targetProfile.id)}`);
  };

  if (loading) {
    return <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading profile...</p>;
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] px-3 py-2 text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:text-white dark:hover:bg-[#1e3a5f]"
        >
          Back
        </button>
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Profile not found.'}</p>
      </div>
    );
  }

  return <PublicProfilePage profile={profile} onBack={handleBack} onMessage={handleMessage} />;
}
