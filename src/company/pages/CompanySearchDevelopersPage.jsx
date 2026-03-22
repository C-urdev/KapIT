import React, { useState } from 'react';
import DeveloperCard from '@companyComponents/CompanyDeveloperCard';
import { useDeveloperSearch } from '@companyFeatures/companyHooks';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import PublicProfilePage from '@sharedPages/public-profile/PublicProfilePage';
import { getPublicProfile } from '@sharedServices/authService';

export default function SearchDevelopers() {
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [location, setLocation] = useState('');
  const { developers, loading, error } = useDeveloperSearch({ q: query, skill, minExperience, location });
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleViewProfile = async (developer) => {
    if (!developer?.id) return;
    setProfileLoading(true);
    try {
      const data = await getPublicProfile(developer.id);
      setProfile({ ...developer, ...data });
    } catch {
      setProfile(developer);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleMessage = (developer) => {
    if (!developer?.id) return;
    navigate(`${COMPANY_PATHS.messages}?contact=${encodeURIComponent(developer.id)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Search developers</h2>
        <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">Filter by skill, years of experience, and location.</p>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-6 space-y-4 transition-colors duration-300">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, desired role, education…"
          className="field"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Skill (e.g. React)"
            className="field"
          />
          <input
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
            placeholder="Min exp (years)"
            inputMode="numeric"
            className="field"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g. Philippines)"
            className="field"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Searching…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {developers.map((developer) => (
            <DeveloperCard
              key={developer.id}
              developer={developer}
              onViewProfile={handleViewProfile}
              onMessage={handleMessage}
            />
          ))}
        </div>
      )}

      {profile && (
        <Modal title="Developer Profile" onClose={() => setProfile(null)}>
          {profileLoading ? (
            <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading profile…</p>
          ) : (
            <div className="bg-white dark:bg-[#0f2139] rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] p-4 transition-colors duration-300">
              <PublicProfilePage profile={profile} onBack={() => setProfile(null)} onMessage={handleMessage} />
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-2xl shadow-black/20 dark:shadow-black/50 transition-colors duration-300">
        <div className="sticky top-0 z-10 px-5 py-4 border-b border-[#a3b18a] dark:border-[#1e3a5f] bg-white/90 dark:bg-[#162842]/90 backdrop-blur flex items-center justify-between transition-colors duration-300">
          <div className="text-[#3a5a40] dark:text-white font-bold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}



