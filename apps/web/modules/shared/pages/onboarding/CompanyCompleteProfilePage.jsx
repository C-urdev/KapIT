// Onboarding: company profile completion
import React, { useMemo, useState } from 'react';
import { Building2, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { normalizeSocialsText } from '@sharedUtils/socials';

const COMPANY_SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export default function CompleteCompanyProfilePage({ user, onSubmit, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: user?.companyName || user?.username || '',
    address: user?.address || '',
    industry: user?.industry || '',
    companySize: user?.companySize || '',
    website: user?.website || '',
    hiringFor: user?.hiringFor || '',
    phone: user?.phone || '',
    email: user?.email || '',
    socials: normalizeSocialsText(user?.socials),
    bio: user?.bio || '',
  });

  const isFormComplete = useMemo(
    () =>
      Boolean(
        formData.companyName.trim() &&
          formData.address.trim() &&
          formData.industry.trim() &&
          formData.companySize &&
          formData.email.trim()
      ),
    [formData]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!isFormComplete) {
      setError('Please fill in the required fields.');
      return;
    }

    onSubmit({
      companyName: formData.companyName,
      address: formData.address,
      industry: formData.industry,
      companySize: formData.companySize,
      website: formData.website,
      hiringFor: formData.hiringFor,
      phone: formData.phone,
      socials: normalizeSocialsText(formData.socials),
      bio: formData.bio,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f2] dark:bg-[#121416]">
      <header className="border-b border-[#a3b18a] dark:border-[#353c44] bg-white dark:bg-[#121416]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3">
              <KapITLogo className="w-10 h-10 rounded-lg object-contain bg-white" />
              <span className="text-2xl font-bold text-[#3a5a40] dark:text-white">KapIT</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 text-sm rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#588157] dark:bg-[#6f9b74] text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#3a5a40] dark:text-white">Complete your company profile</h1>
              <p className="text-sm text-[#344e41] dark:text-[#d0d7dd]">This information will appear on your profile.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Name">
              <input
                type="text"
                value={formData.companyName}
                onChange={(event) => setFormData({ ...formData, companyName: event.target.value })}
                className="w-full input-base"
                required
              />
            </Field>

            <Field label="Industry">
              <input
                type="text"
                value={formData.industry}
                onChange={(event) => setFormData({ ...formData, industry: event.target.value })}
                className="w-full input-base"
                placeholder="e.g. Software, IT Services"
                required
              />
            </Field>

            <Field label="Company Size">
              <SearchableSelect
                value={formData.companySize}
                onChange={(companySize) => setFormData({ ...formData, companySize })}
                options={COMPANY_SIZE_OPTIONS}
                placeholder="Select company size"
                searchPlaceholder="Search company size"
                className="w-full input-base"
              />
            </Field>

            <Field label="Website (Optional)">
              <input
                type="url"
                value={formData.website}
                onChange={(event) => setFormData({ ...formData, website: event.target.value })}
                className="w-full input-base"
                placeholder="https://"
              />
            </Field>

            <Field label="Address">
              <input
                type="text"
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                className="w-full input-base"
                placeholder="City, Province"
                required
              />
            </Field>

            <Field label="Phone (Optional)">
              <input
                type="tel"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                className="w-full input-base"
              />
            </Field>

            <Field label="Email Address (Account)">
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className="w-full input-base"
                readOnly
                required
              />
            </Field>

            <Field label="Socials (Optional)">
              <input
                type="text"
                value={formData.socials}
                onChange={(event) => setFormData({ ...formData, socials: event.target.value })}
                className="w-full input-base"
                placeholder="LinkedIn, Facebook, GitHub"
              />
            </Field>

            <Field label="Hiring For (Optional)" fullWidth>
              <input
                type="text"
                value={formData.hiringFor}
                onChange={(event) => setFormData({ ...formData, hiringFor: event.target.value })}
                className="w-full input-base"
                placeholder="e.g. Full Stack Developer, QA Engineer"
              />
            </Field>

            <Field label="About (Optional)" fullWidth>
              <textarea
                value={formData.bio}
                onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
                className="w-full input-base min-h-24 resize-y"
                placeholder="Tell candidates about your company."
              />
            </Field>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={!isFormComplete}
                className="w-full bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children, fullWidth = false }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <label className="block text-sm font-medium text-[#3a5a40] dark:text-white mb-1">{label}</label>
      {children}
    </div>
  );
}




