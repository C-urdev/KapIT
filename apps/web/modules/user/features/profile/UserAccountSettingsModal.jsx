import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Calendar, MapPin, Search, UserCircle, X } from 'lucide-react';
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
export default function UserAccountSettingsModal({ isOpen, user, onClose, onSave }) {
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

  if (!isOpen) {
    return null;
  }

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
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 min-[420px]:p-6">
      <div className="flex w-full max-w-2xl flex-col bg-white dark:bg-[#0a1628] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5e7eb] dark:border-[#1e3a5f] p-4 sm:p-5">
          <div>
            <h3 className="text-[19px] font-bold text-[#1c2b1f] dark:text-white">Edit Profile Details</h3>
            <p className="text-sm text-[#5f6f52] dark:text-[#b8d4e8] mt-0.5">Update your personal and professional information.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10">
            <X className="w-5 h-5 text-[#344e41] dark:text-white/80" />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">



            <div className="grid grid-cols-1 gap-4">
              <SettingsCard title="Personal Information" icon={UserCircle}>
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#5f6f52] dark:text-[#9fb4ca] px-1">Full Name</label>
                      <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Real Name" className="w-full rounded-xl border border-[#dce5d4] bg-[#f8fbf6] px-3 py-2 text-[15px] font-medium text-[#1c2b1f] outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] dark:border-[#244060] dark:bg-[#0a1628] dark:text-white dark:focus:border-[#3ba9d6] dark:focus:ring-[#3ba9d6]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#5f6f52] dark:text-[#9fb4ca] px-1">Username</label>
                      <input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Display Name" className="w-full rounded-xl border border-[#dce5d4] bg-[#f8fbf6] px-3 py-2 text-[15px] font-medium text-[#1c2b1f] outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] dark:border-[#244060] dark:bg-[#0a1628] dark:text-white dark:focus:border-[#3ba9d6] dark:focus:ring-[#3ba9d6]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#5f6f52] dark:text-[#9fb4ca] px-1">Birthday</label>
                      <input type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} className="w-full rounded-xl border border-[#dce5d4] bg-[#f8fbf6] px-3 py-2 text-[15px] font-medium text-[#1c2b1f] outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] dark:border-[#244060] dark:bg-[#0a1628] dark:text-white dark:focus:border-[#3ba9d6] dark:focus:ring-[#3ba9d6]" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#5f6f52] dark:text-[#9fb4ca] px-1">Phone Number</label>
                      <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. 0912 345 6789" className="w-full rounded-xl border border-[#dce5d4] bg-[#f8fbf6] px-3 py-2 text-[15px] font-medium text-[#1c2b1f] outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] dark:border-[#244060] dark:bg-[#0a1628] dark:text-white dark:focus:border-[#3ba9d6] dark:focus:ring-[#3ba9d6]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#5f6f52] dark:text-[#9fb4ca] px-1">Sex</label>
                      <select
                        value={formData.sex}
                        onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                        className="w-full rounded-xl border border-[#dce5d4] bg-[#f8fbf6] px-3 py-2 text-[15px] font-medium text-[#1c2b1f] outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] dark:border-[#244060] dark:bg-[#0a1628] dark:text-white dark:focus:border-[#3ba9d6] dark:focus:ring-[#3ba9d6]"
                      >
                        <option value="">Select option...</option>
                        {SEX_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard title="Location" icon={MapPin}>
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-[#5f6f52] dark:text-[#9fb4ca] px-1">Registered Address</label>
                  <div className="col-span-full">
                    <SearchableSelect
                      value={formData.address}
                      onChange={(address) => setFormData({ ...formData, address })}
                      options={addressOptions}
                      placeholder="Select a municipality or city in the Philippines"
                      searchPlaceholder="Search municipality, city, or province"
                      className="w-full rounded-xl border border-[#dce5d4] bg-[#f8fbf6] px-3 py-2 text-[15px] font-medium text-[#1c2b1f] outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] dark:border-[#244060] dark:bg-[#0a1628] dark:text-white dark:focus:border-[#3ba9d6] dark:focus:ring-[#3ba9d6]"
                      searchInTrigger
                    />
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard title="Career Aspirations" icon={Calendar}>
                <div className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#5f6f52] dark:text-[#9fb4ca] px-1">Desired Job Role</label>
                    <SearchableSelect
                      value={formData.desiredJob}
                      onChange={(desiredJob) => setFormData({ ...formData, desiredJob })}
                      options={JOB_OPTIONS}
                      placeholder="Select preferred IT job"
                      searchPlaceholder="Search IT careers"
                      className="w-full rounded-xl border border-[#dce5d4] bg-[#f8fbf6] px-3 py-2 text-[15px] font-medium text-[#1c2b1f] outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] dark:border-[#244060] dark:bg-[#0a1628] dark:text-white dark:focus:border-[#3ba9d6] dark:focus:ring-[#3ba9d6]"
                      searchInTrigger
                    />
                  </div>
                  {formData.desiredJob === 'Other IT jobs' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#5f6f52] dark:text-[#9fb4ca] px-1">Custom IT Role</label>
                      <input
                        value={formData.customDesiredJob}
                        onChange={(e) => setFormData({ ...formData, customDesiredJob: e.target.value })}
                        placeholder="Specify preferred IT job"
                        className="w-full rounded-xl border border-[#dce5d4] bg-[#f8fbf6] px-3 py-2 text-[15px] font-medium text-[#1c2b1f] outline-none focus:border-[#5f6f52] focus:ring-1 focus:ring-[#5f6f52] dark:border-[#244060] dark:bg-[#0a1628] dark:text-white dark:focus:border-[#3ba9d6] dark:focus:ring-[#3ba9d6]"
                      />
                    </div>
                  )}
                </div>
              </SettingsCard>
            </div>
          </main>
          
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-[#e5e7eb] dark:border-[#1e3a5f] bg-[#f9fafb] p-4 dark:bg-[#162842]">
            <button onClick={onClose} className="px-5 py-2 rounded-xl font-semibold text-[#5f6f52] transition-colors hover:bg-black/5 dark:text-[#b8d4e8] dark:hover:bg-white/10">
              Cancel
            </button>
            <button onClick={handleSave} className="px-5 py-2 rounded-xl bg-[#3a5a40] text-white font-semibold transition-transform active:scale-95 dark:bg-[#3ba9d6] shadow-sm">
              Save Changes
            </button>
          </div>
        </div>
      </div>
  );
}



function SettingsCard({ title, icon: Icon, children }) {
  return (
    <section className="bg-white dark:bg-[#162842] border border-[#dce5d4] dark:border-[#1e3a5f] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 border-b border-[#f0f4ec] dark:border-white/5 pb-3">
        <Icon className="w-5 h-5 text-[#3a5a40] dark:text-[#3ba9d6]" />
        <h5 className="font-bold text-[15px] text-[#1c2b1f] dark:text-white">{title}</h5>
      </div>
      {children}
    </section>
  );
}





