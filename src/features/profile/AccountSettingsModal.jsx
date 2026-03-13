import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Calendar, MapPin, Phone, Search, UserCircle, X } from 'lucide-react';

const JOB_OPTIONS = [
  'IT Professional',
  'Full Stack Developer',
  'IT Analyst',
  'Cybersecurity Specialist',
  'Other IT jobs',
];

export default function AccountSettingsModal({ isOpen, user, onClose, onSave }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    address: '',
    birthday: '',
    age: '',
    sex: '',
    phone: '',
    desiredJob: 'IT Professional',
    customDesiredJob: '',
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setActiveSection('profile');

    setFormData({
      name: user?.name || '',
      username: user?.username || '',
      address: user?.address || '',
      birthday: user?.birthday || '',
      age: user?.age || '',
      sex: user?.sex || '',
      phone: user?.phone || '',
      desiredJob: user?.desiredJob || 'IT Professional',
      customDesiredJob: '',
    });
  }, [isOpen, user]);

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
      age: formData.age,
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
                description="Name, username, birthday, age, sex, phone"
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
          </aside>

          <main className="p-5 sm:p-6 overflow-y-auto">
            <div className="bg-white dark:bg-[#162842] border border-[#d1d5db] dark:border-[#1e3a5f] rounded-xl p-5 mb-4">
              <h4 className="text-2xl font-bold text-[#3a5a40] dark:text-white">Account settings</h4>
              <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8] mt-1">Update your current website settings only.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {activeSection === 'profile' && (
                <SettingsCard title="Profile details" icon={UserCircle}>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Name (Real Name)" className="input-base" />
                    <input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="Username (Profile Name)" className="input-base" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} className="input-base" />
                    <input value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="Age" className="input-base" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 pt-1">
                    <select value={formData.sex} onChange={(e) => setFormData({ ...formData, sex: e.target.value })} className="input-base">
                      <option value="">Select sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone" className="input-base" />
                  </div>
                </div>
              </SettingsCard>
              )}

              {activeSection === 'address' && (
                <SettingsCard title="Address" icon={MapPin}>
                  <div className="space-y-3">
                  <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Address" className="input-base" />
                  </div>
                </SettingsCard>
              )}

              {activeSection === 'career' && (
                <SettingsCard title="Career preference" icon={Calendar}>
                  <div className="space-y-3">
                    <select
                      value={formData.desiredJob}
                      onChange={(e) => setFormData({ ...formData, desiredJob: e.target.value })}
                      className="input-base"
                    >
                      {JOB_OPTIONS.map((job) => (
                        <option key={job} value={job}>
                          {job}
                        </option>
                      ))}
                    </select>
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
