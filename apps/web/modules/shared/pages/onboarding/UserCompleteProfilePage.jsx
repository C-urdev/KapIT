// Onboarding: developer profile completion
import React, { useMemo, useState } from 'react';
import { User, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { normalizeSocialsText } from '@sharedUtils/socials';

const VOCATIONAL_OPTION = 'High School Graduate with Vocational Course';
const OTHER_JOB_OPTION = 'Other IT jobs';

const EDUCATION_OPTIONS = [
  'College Graduate',
  'High School Graduate',
  'Elementary Graduate',
  VOCATIONAL_OPTION,
];

const JOB_OPTIONS = [
  'IT Professional',
  'Full Stack Developer',
  'IT Analyst',
  'Cybersecurity Specialist',
  OTHER_JOB_OPTION,
];

const getAgeFromBirthday = (birthday) => {
  if (!birthday) {
    return '';
  }

  const birthDate = new Date(birthday);
  if (Number.isNaN(birthDate.getTime())) {
    return '';
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 0 ? String(age) : '';
};

export default function CompleteProfilePage({ user, onSubmit, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    education: user?.education || '',
    vocationalCourse: user?.vocationalCourse || '',
    desiredJob: user?.desiredJob || 'IT Professional',
    customDesiredJob: '',
    birthday: user?.birthday || '',
    sex: user?.sex || '',
    phone: user?.phone || '',
    email: user?.email || '',
    socials: normalizeSocialsText(user?.socials),
  });

  const age = useMemo(() => getAgeFromBirthday(formData.birthday), [formData.birthday]);
  const isVocationalSelected = formData.education === VOCATIONAL_OPTION;
  const isOtherJobSelected = formData.desiredJob === OTHER_JOB_OPTION;
  const desiredJobValue = isOtherJobSelected ? formData.customDesiredJob.trim() : formData.desiredJob;
  const isFormComplete = Boolean(
    formData.name.trim() &&
      formData.address.trim() &&
      formData.education &&
      formData.desiredJob &&
      formData.birthday &&
      age &&
      formData.sex &&
      formData.phone.trim() &&
      formData.email.trim() &&
      (!isVocationalSelected || formData.vocationalCourse.trim()) &&
      (!isOtherJobSelected || formData.customDesiredJob.trim())
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!age) {
      setError('Please provide a valid birthday.');
      return;
    }

    if (!formData.sex) {
      setError('Please select a sex.');
      return;
    }

    if (isVocationalSelected && !formData.vocationalCourse.trim()) {
      setError('Please specify your vocational course.');
      return;
    }

    if (isOtherJobSelected && !formData.customDesiredJob.trim()) {
      setError('Please specify your preferred IT job.');
      return;
    }

    onSubmit({
      name: formData.name,
      username: formData.name.trim(),
      address: formData.address,
      education: formData.education,
      vocationalCourse: formData.vocationalCourse,
      desiredJob: desiredJobValue,
      birthday: formData.birthday,
      sex: formData.sex,
      phone: formData.phone,
      socials: normalizeSocialsText(formData.socials),
      age,
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
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#3a5a40] dark:text-white">Complete Your Profile</h1>
              <p className="text-sm text-[#344e41] dark:text-[#d0d7dd]">
                Finish your details before entering the homepage.
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 px-3 py-2 rounded-lg text-sm bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <Field label="Full Name (First name, M.I., Last name)">
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="e.g. Juan D. Dela Cruz"
                title="Enter your full name in this format: First name, middle initial, last name."
                className="w-full input-base"
                required
              />
              <p className="mt-1 text-xs text-[#5f6f52] dark:text-[#adb5be]">Use your full name format: First name, middle initial, and last name.</p>
            </Field>

            <Field label="Address">
              <input
                type="text"
                value={formData.address}
                onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                className="w-full input-base"
                required
              />
            </Field>

            <Field label="Educational Attainment">
              <SearchableSelect
                value={formData.education}
                onChange={(education) =>
                  setFormData({
                    ...formData,
                    education,
                    vocationalCourse: education === VOCATIONAL_OPTION ? formData.vocationalCourse : '',
                  })
                }
                options={EDUCATION_OPTIONS}
                placeholder="Select education"
                searchPlaceholder="Search education"
                className="w-full input-base"
              />
            </Field>

            <Field label="Preferred IT Job">
              <SearchableSelect
                value={formData.desiredJob}
                onChange={(desiredJob) =>
                  setFormData({
                    ...formData,
                    desiredJob,
                    customDesiredJob: desiredJob === OTHER_JOB_OPTION ? formData.customDesiredJob : '',
                  })
                }
                options={JOB_OPTIONS}
                placeholder="Select preferred IT job"
                searchPlaceholder="Search jobs"
                className="w-full input-base"
              />
            </Field>

            {isVocationalSelected && (
              <Field label="Vocational Course">
                <input
                  type="text"
                  value={formData.vocationalCourse}
                  onChange={(event) => setFormData({ ...formData, vocationalCourse: event.target.value })}
                  className="w-full input-base"
                  placeholder="e.g. Computer Technician NC II"
                  required
                />
              </Field>
            )}

            {isOtherJobSelected && (
              <Field label="Specify Preferred IT Job">
                <input
                  type="text"
                  value={formData.customDesiredJob}
                  onChange={(event) => setFormData({ ...formData, customDesiredJob: event.target.value })}
                  className="w-full input-base"
                  placeholder="e.g. QA Engineer"
                  required
                />
              </Field>
            )}

            <Field label="Birthday">
              <input
                type="date"
                value={formData.birthday}
                onChange={(event) => setFormData({ ...formData, birthday: event.target.value })}
                className="w-full input-base"
                required
              />
            </Field>

            <Field label="Age">
              <input type="text" value={age} readOnly className="w-full input-base bg-[#f1f5f0] dark:bg-[#1a1d20]" />
            </Field>

            <Field label="Phone Number">
              <input
                type="tel"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                className="w-full input-base"
                required
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

            <Field label="Sex">
              <div className="flex gap-4 pt-2">
                <label className="text-sm text-[#344e41] dark:text-white flex items-center gap-2">
                  <input
                    type="radio"
                    name="sex"
                    value="male"
                    checked={formData.sex === 'male'}
                    onChange={(event) => setFormData({ ...formData, sex: event.target.value })}
                  />
                  Male
                </label>
                <label className="text-sm text-[#344e41] dark:text-white flex items-center gap-2">
                  <input
                    type="radio"
                    name="sex"
                    value="female"
                    checked={formData.sex === 'female'}
                    onChange={(event) => setFormData({ ...formData, sex: event.target.value })}
                  />
                  Female
                </label>
              </div>
            </Field>

            <Field label="Other Socials (Optional)" fullWidth>
              <textarea
                value={formData.socials}
                onChange={(event) => setFormData({ ...formData, socials: event.target.value })}
                className="w-full input-base min-h-24 resize-y"
                placeholder="LinkedIn, Facebook, GitHub, portfolio, etc."
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




