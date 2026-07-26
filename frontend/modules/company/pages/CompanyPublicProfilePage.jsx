import React from 'react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';
import { getPublicProfile, getStoredUser } from '@sharedServices/authService';

const getSearchParam = (key) => {
  try {
    const params = new URLSearchParams(window.location.search);
    return String(params.get(key) || '').trim();
  } catch {
    return '';
  }
};

export default function CompanyPublicProfilePage() {
  const viewer = getStoredUser();
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
    return <p className="text-sm text-[#4b5563] dark:text-[#d0d7dd]">Loading profile...</p>;
  }

  if (error || !profile) {
    return (
      <div className="company-workspace-page space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="company-workspace-secondary-button inline-flex items-center gap-2 px-3 py-2"
        >
          Back
        </button>

        <div className="company-workspace-panel max-w-2xl p-5">
          <h2 className="company-workspace-section-title">Public profile is not available yet</h2>
          <p className="mt-2 text-sm text-[#4b5f4a] dark:text-[#d0d7dd]">
            Add or update your company details so your public profile can be viewed by developers.
          </p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error || 'Profile not found.'}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(COMPANY_PATHS.settingsCompanyInfo)}
              className="company-workspace-primary-button inline-flex items-center px-3.5 py-2"
            >
              Edit company information
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="company-workspace-secondary-button inline-flex items-center px-3.5 py-2"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <PublicProfilePage profile={profile} onBack={handleBack} onMessage={handleMessage} viewer={viewer} />;
}
