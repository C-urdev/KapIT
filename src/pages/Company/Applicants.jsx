import React, { useState } from 'react';
import ApplicantCard from '@components/company/ApplicantCard';
import { useCompanyApplicants } from '@features/company/companyHooks';
import { getPublicProfile } from '../../services/authService';
import PublicProfilePage from '@pages/PublicProfile/PublicProfilePage';
import { sendMessage } from '../../services/messageService';

export default function Applicants() {
  const { applicants, loading, error, refetch } = useCompanyApplicants();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const handleViewProfile = async (user) => {
    if (!user?.id) return;
    setProfileLoading(true);
    try {
      const data = await getPublicProfile(user.id);
      setProfile({ ...user, ...data });
    } catch {
      setProfile(user);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleMessage = async (user) => {
    const name = user?.username;
    if (!name) return;
    const text = window.prompt(`Message to ${name}:`);
    if (!text || !text.trim()) return;
    try {
      await sendMessage(name, text.trim());
      window.alert('Message sent.');
    } catch (err) {
      window.alert(err?.message || 'Failed to send message.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Applicants</h2>
          <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">Review candidates who applied to your jobs.</p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="px-4 py-2.5 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading applicants…</p>
      ) : applicants.length === 0 ? (
        <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-6 transition-colors duration-300">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">No applicants yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onViewProfile={handleViewProfile}
              onMessage={handleMessage}
            />
          ))}
        </div>
      )}

      {profile && (
        <Modal title="Candidate Profile" onClose={() => setProfile(null)}>
          {profileLoading ? (
            <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading profile…</p>
          ) : (
            <div className="bg-white dark:bg-[#0f2139] rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] p-4 transition-colors duration-300">
              <PublicProfilePage profile={profile} onBack={() => setProfile(null)} />
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
