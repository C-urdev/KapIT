import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, Briefcase, Calendar, FileCheck2, FolderKanban, MapPin, Search, UserCircle, X } from 'lucide-react';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import { loadAddressOptions } from '@sharedUtils/philippinesLocations';
import { developerAPI } from '@userFeatures/developer/userDeveloperAPI';

const JOB_OPTIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile App Developer',
  'React Developer',
  'Vue Developer',
  'Angular Developer',
  'Node.js Developer',
  'PHP Developer',
  'Laravel Developer',
  'Python Developer',
  'Django Developer',
  'Java Developer',
  'Spring Boot Developer',
  '.NET Developer',
  'C# Developer',
  'Go Developer',
  'Rust Developer',
  'WordPress Developer',
  'Game Developer',
  'Embedded Systems Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Cloud Engineer',
  'Cloud Architect',
  'Solutions Architect',
  'System Administrator',
  'Network Engineer',
  'Database Administrator',
  'Data Engineer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'AI Engineer',
  'Business Intelligence Analyst',
  'Cybersecurity Analyst',
  'Security Engineer',
  'SOC Analyst',
  'Penetration Tester',
  'IT Support Specialist',
  'Technical Support Engineer',
  'Help Desk Specialist',
  'QA Engineer',
  'Software Tester',
  'Automation Test Engineer',
  'UI Designer',
  'UX Designer',
  'UI/UX Designer',
  'Product Designer',
  'Product Manager',
  'Technical Product Manager',
  'Project Manager',
  'Scrum Master',
  'Business Analyst',
  'Systems Analyst',
  'ERP Consultant',
  'IT Consultant',
  'Blockchain Developer',
  'AR/VR Developer',
  'IoT Engineer',
  'Other IT jobs',
];

const SEX_OPTIONS = ['Male', 'Female', 'Prefer not to say'];
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
export default function UserAccountSettingsModal({ isOpen, user, onClose, onSave, onOpenMyProfile, onOpenProjects, onOpenSavedJobs, onOpenApplications }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [cachedDeveloperProfile] = useState(() => readProfileCache());
  const [profileLoading, setProfileLoading] = useState(false);
  const [developerProfile, setDeveloperProfile] = useState(cachedDeveloperProfile);
  const [addressOptions, setAddressOptions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    address: '',
    birthday: '',
    sex: '',
    phone: '',
    desiredJob: 'Software Engineer',
    customDesiredJob: '',
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setActiveSection('profile');
    const nextDesiredJob = String(user?.desiredJob || '').trim();
    const hasPresetDesiredJob = JOB_OPTIONS.includes(nextDesiredJob);

    setFormData({
      name: user?.name || '',
      username: user?.username || '',
      address: user?.address || '',
      birthday: user?.birthday || '',
      sex: user?.sex || '',
      phone: user?.phone || '',
      desiredJob: hasPresetDesiredJob ? nextDesiredJob : nextDesiredJob ? 'Other IT jobs' : 'Software Engineer',
      customDesiredJob: hasPresetDesiredJob ? '' : nextDesiredJob,
    });
  }, [isOpen, user]);

  useEffect(() => {
    let cancelled = false;

    const loadDeveloperProfile = async () => {
      if (!isOpen || user?.type === 'company') {
        return;
      }

      if (!developerProfile) {
        setProfileLoading(true);
      }
      try {
        const data = await developerAPI.getMyProfile();
        const nextProfile = data?.profile || null;
        writeProfileCache(nextProfile);
        if (!cancelled) {
          setDeveloperProfile(nextProfile);
        }
      } catch {
        if (!cancelled && !developerProfile) {
          setDeveloperProfile(cachedDeveloperProfile);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    loadDeveloperProfile();

    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.type]);

  useEffect(() => {
    let cancelled = false;

    const loadLocations = async () => {
      if (!isOpen) return;
      const options = await loadAddressOptions();
      if (!cancelled) {
        setAddressOptions(options);
      }
    };

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const desiredJobValue = useMemo(
    () =>
      formData.desiredJob === 'Other IT jobs' && formData.customDesiredJob.trim()
        ? formData.customDesiredJob.trim()
        : formData.desiredJob,
    [formData.desiredJob, formData.customDesiredJob]
  );

  const completeProfileRows = useMemo(() => {
    if (user?.type === 'company') {
      return [];
    }

    const socialLinks =
      typeof user?.socials === 'string'
        ? (() => {
            try {
              return JSON.parse(user.socials);
            } catch {
              return {};
            }
          })()
        : user?.socials || {};

    return [
      ['Full name', developerProfile?.full_name || user?.name || ''],
      ['Email', developerProfile?.email || user?.email || ''],
      ['Phone number', developerProfile?.phone_number || user?.phone || ''],
      ['Location', developerProfile?.location || user?.address || ''],
      ['Job title', developerProfile?.job_title || ''],
      ['Years of experience', developerProfile?.experience_years ?? ''],
      ['Preferred IT role', developerProfile?.preferred_it_role || user?.desiredJob || ''],
      ['Education', developerProfile?.education || user?.education || ''],
      ['School / University', developerProfile?.school_university || ''],
      ['Certifications', developerProfile?.certifications || ''],
      ['Work preference', developerProfile?.work_preference || ''],
      ['Skills', Array.isArray(developerProfile?.skills) ? developerProfile.skills.join(', ') : ''],
      ['GitHub', developerProfile?.github_link || socialLinks.github || ''],
      ['Portfolio website', developerProfile?.portfolio_link || socialLinks.portfolio || ''],
      ['LinkedIn', developerProfile?.linkedin_link || socialLinks.linkedin || ''],
      ['Other links', developerProfile?.other_links || socialLinks.other || ''],
      ['Resume', developerProfile?.resume_url || ''],
      ['About me', developerProfile?.bio || user?.bio || ''],
    ].filter(([, value]) => String(value ?? '').trim() !== '');
  }, [developerProfile, user]);

  if (!isOpen) {
    return null;
  }

  const handleQuickOpen = (callback) => {
    onClose?.();
    callback?.();
  };

  const handleSave = () => {
    onSave?.({
      name: formData.name,
      username: formData.username,
      address: formData.address,
      birthday: formData.birthday,
      sex: formData.sex,
      phone: formData.phone,
      desiredJob: desiredJobValue,
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-[#f3f4f6] dark:bg-[#0a1628] border border-[#d1d5db] dark:border-[#1e3a5f] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[70vh] max-h-[88vh]">
          <aside className="bg-white dark:bg-[#162842] border-r border-[#d1d5db] dark:border-[#1e3a5f] p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#3a5a40] dark:text-white">Settings</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f]">
                <X className="w-5 h-5 text-[#344e41] dark:text-white" />
              </button>
            </div>

            <div className="relative mb-5">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-[#7d9ab8]" />
              <input
                placeholder="Search settings"
                className="w-full pl-9 pr-3 py-2 rounded-full border border-[#d1d5db] dark:border-[#2a4a6f] bg-[#f3f4f6] dark:bg-[#0f2139] text-[#344e41] dark:text-white text-sm"
              />
            </div>

            <div className="space-y-3">
              <NavCard
                title="Profile details"
                description="Name, username, birthday, sex, phone"
                icon={UserCircle}
                active={activeSection === 'profile'}
                onClick={() => setActiveSection('profile')}
              />
              <NavCard
                title="Address"
                description="Where you are located"
                icon={MapPin}
                active={activeSection === 'address'}
                onClick={() => setActiveSection('address')}
              />
              <NavCard
                title="Career preference"
                description="Preferred IT role"
                icon={Briefcase}
                active={activeSection === 'career'}
                onClick={() => setActiveSection('career')}
              />
            </div>

            <section className="xl:hidden mt-6 border-t border-[#e5e7eb] dark:border-[#2a4a6f] pt-5">
              <div className="flex items-center gap-2 mb-3">
                <FolderKanban className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                <h5 className="font-semibold text-[#3a5a40] dark:text-white">Quick access</h5>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <NavCard
                  title="My Profile"
                  description="Open your public-facing profile workspace"
                  icon={UserCircle}
                  onClick={() => handleQuickOpen(onOpenMyProfile)}
                />
                <NavCard
                  title="My Projects"
                  description="Jump straight to your portfolio projects"
                  icon={FolderKanban}
                  onClick={() => handleQuickOpen(onOpenProjects)}
                />
                <NavCard
                  title="Saved Jobs"
                  description="Review everything you bookmarked"
                  icon={Bookmark}
                  onClick={() => handleQuickOpen(onOpenSavedJobs)}
                />
                <NavCard
                  title="Applications"
                  description="Check the jobs you already applied to"
                  icon={FileCheck2}
                  onClick={() => handleQuickOpen(onOpenApplications)}
                />
              </div>
            </section>

          </aside>

          <main className="p-5 sm:p-6 overflow-y-auto">
            <div className="bg-white dark:bg-[#162842] border border-[#d1d5db] dark:border-[#1e3a5f] rounded-xl p-5 mb-4">
              <h4 className="text-2xl font-bold text-[#3a5a40] dark:text-white">Account settings</h4>
              <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8] mt-1">Update your current website settings only.</p>
            </div>

            {user?.type !== 'company' && (
              <section className="bg-white dark:bg-[#162842] border border-[#d1d5db] dark:border-[#1e3a5f] rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                  <h5 className="font-semibold text-[#3a5a40] dark:text-white">Complete profile details</h5>
                </div>
                {profileLoading ? (
                  <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Loading your saved profile details...</p>
                ) : completeProfileRows.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {completeProfileRows.map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-[#e5e7eb] dark:border-[#2a4a6f] bg-[#f9fafb] dark:bg-[#0f2139] px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280] dark:text-[#7d9ab8]">{label}</p>
                        <p className="mt-1 text-sm text-[#344e41] dark:text-white break-words">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">No complete profile details saved yet.</p>
                )}
              </section>
            )}

            <div className="grid grid-cols-1 gap-4">
              {activeSection === 'profile' && (
                <SettingsCard title="Profile details" icon={UserCircle}>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Name (Real Name)" className="input-base" />
                    <input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Username (Profile Name)" className="input-base" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4">
                    <input type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} className="input-base" />
                    <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone" className="input-base" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-4 pt-1">
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                      className="input-base"
                    >
                      <option value="">Select sex</option>
                      {SEX_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </SettingsCard>
              )}

              {activeSection === 'address' && (
                <SettingsCard title="Address" icon={MapPin}>
                  <div className="space-y-3">
                    <SearchableSelect
                      value={formData.address}
                      onChange={(address) => setFormData({ ...formData, address })}
                      options={addressOptions}
                      placeholder="Select a municipality or city in the Philippines"
                      searchPlaceholder="Search municipality, city, or province"
                      className="input-base"
                      searchInTrigger
                    />
                  </div>
                </SettingsCard>
              )}

              {activeSection === 'career' && (
                <SettingsCard title="Career preference" icon={Calendar}>
                  <div className="space-y-3">
                    <SearchableSelect
                      value={formData.desiredJob}
                      onChange={(desiredJob) => setFormData({ ...formData, desiredJob })}
                      options={JOB_OPTIONS}
                      placeholder="Select preferred IT job"
                      searchPlaceholder="Search IT careers"
                      className="input-base"
                      searchInTrigger
                    />
                    {formData.desiredJob === 'Other IT jobs' && (
                      <input
                        value={formData.customDesiredJob}
                        onChange={(e) => setFormData({ ...formData, customDesiredJob: e.target.value })}
                        placeholder="Specify preferred IT job"
                        className="input-base"
                      />
                    )}
                  </div>
                </SettingsCard>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[#3a5a40] dark:bg-[#3ba9d6] text-white font-semibold">
                Save Settings
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function NavCard({ title, description, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition-colors ${
        active
          ? 'border-[#588157] dark:border-[#3ba9d6] bg-[#eef6ee] dark:bg-[#1e3a5f]'
          : 'border-[#d1d5db] dark:border-[#2a4a6f] bg-[#f9fafb] dark:bg-[#0f2139] hover:bg-[#f3f4f6] dark:hover:bg-[#1b3252]'
      }`}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 text-[#588157] dark:text-[#3ba9d6]" />
        <div>
          <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">{title}</p>
          <p className="text-xs text-[#4b5563] dark:text-[#b8d4e8]">{description}</p>
        </div>
      </div>
    </button>
  );
}

function SettingsCard({ title, icon: Icon, children }) {
  return (
    <section className="bg-white dark:bg-[#162842] border border-[#d1d5db] dark:border-[#1e3a5f] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
        <h5 className="font-semibold text-[#3a5a40] dark:text-white">{title}</h5>
      </div>
      {children}
    </section>
  );
}





