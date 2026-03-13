import React, { useMemo, useState } from 'react';
import { ArrowLeft, Briefcase, LogOut, Moon, Sun, UserCircle2 } from 'lucide-react';
import { useTheme } from '@context/ThemeContext';
import KapITLogo from '@components/KapITLogo';
import SkillTags from '@components/developer/SkillTags';
import PortfolioCard from '@components/developer/PortfolioCard';
import ResumeUploader from '@components/developer/ResumeUploader';
import { navigate } from '@features/company/companyUtils';

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export default function DeveloperProfile({ user, onSubmit, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    profileImage: user?.profileImage || '',
    fullName: '',
    username: user?.username || '',
    location: user?.address || '',
    phoneNumber: user?.phone || '',
    email: user?.email || '',

    jobTitle: '',
    yearsOfExperience: '',
    skills: [],
    preferredRole: '',

    educationAttainment: '',
    school: '',
    certifications: '',

    github: '',
    portfolioWebsite: '',
    linkedin: '',
    otherLinks: '',

    workPreference: 'remote',
    aboutMe: '',
    resume: '',
  });

  const isComplete = useMemo(() => {
    return Boolean(
      String(form.fullName).trim() &&
        String(form.username).trim() &&
        String(form.location).trim() &&
        String(form.phoneNumber).trim() &&
        String(form.email).trim() &&
        String(form.jobTitle).trim() &&
        String(form.yearsOfExperience).trim() &&
        Array.isArray(form.skills) &&
        form.skills.length > 0 &&
        String(form.preferredRole).trim() &&
        String(form.educationAttainment).trim() &&
        String(form.school).trim() &&
        String(form.aboutMe).trim()
    );
  }, [form]);

  const onPickPhoto = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Please upload an image file.');
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      setForm((prev) => ({ ...prev, profileImage: dataUrl }));
    } catch {
      window.alert('Failed to read image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete || saving) return;
    setSaving(true);
    try {
      await onSubmit?.({
        profileImage: form.profileImage,
        fullName: form.fullName,
        username: form.username,
        location: form.location,
        phoneNumber: form.phoneNumber,
        email: form.email,
        jobTitle: form.jobTitle,
        yearsOfExperience: form.yearsOfExperience,
        skills: form.skills,
        preferredRole: form.preferredRole,
        educationAttainment: form.educationAttainment,
        school: form.school,
        certifications: form.certifications,
        github: form.github,
        portfolioWebsite: form.portfolioWebsite,
        linkedin: form.linkedin,
        otherLinks: form.otherLinks,
        workPreference: form.workPreference,
        aboutMe: form.aboutMe,
        resume: form.resume,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-slate-200 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="inline-flex items-center gap-3">
              <KapITLogo className="w-9 h-9 rounded-lg object-contain bg-white" />
              <span className="text-xl font-bold">KapIT</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-slate-200" /> : <Sun className="w-5 h-5 text-slate-200" />}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="rounded-xl shadow-lg shadow-black/30 border border-slate-800 bg-slate-800/60 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Complete your developer profile</h1>
              <p className="mt-1 text-sm text-slate-400">This helps companies find the right match for roles and projects.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <Section title="Profile Picture" icon={UserCircle2}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center">
                  {form.profileImage ? (
                    <img src={form.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-500 text-sm">No photo</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickPhoto(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-500/15 file:px-4 file:py-2 file:font-semibold file:text-blue-200 hover:file:bg-blue-500/25"
                  />
                  <p className="mt-2 text-xs text-slate-400">JPG/PNG recommended (stored as a base64 data URL).</p>
                </div>
              </div>
            </Section>

            <Section title="Basic Information">
              <Grid>
                <Field label="Full Name">
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="field"
                    placeholder="e.g. Juan Dela Cruz"
                    required
                  />
                </Field>
                <Field label="Username">
                  <input
                    value={form.username}
                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    className="field"
                    placeholder="e.g. juan_dev"
                    required
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    className="field"
                    placeholder="e.g. Cebu City, Philippines"
                    required
                  />
                </Field>
                <Field label="Phone Number">
                  <input
                    value={form.phoneNumber}
                    onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                    className="field"
                    placeholder="e.g. +63 9xx xxx xxxx"
                    required
                  />
                </Field>
                <Field label="Email">
                  <input value={form.email} readOnly className="field bg-[#f5f5f2] dark:bg-[#0f2139]/60" />
                </Field>
              </Grid>
            </Section>

            <Section title="Professional Details">
              <Grid>
                <Field label="Job Title">
                  <input
                    value={form.jobTitle}
                    onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                    className="field"
                    placeholder="e.g. Frontend Developer"
                    required
                  />
                </Field>
                <Field label="Years of Experience">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={form.yearsOfExperience}
                    onChange={(e) => setForm((p) => ({ ...p, yearsOfExperience: e.target.value }))}
                    className="field"
                    placeholder="e.g. 3"
                    required
                  />
                </Field>
                <Field label="Preferred IT Role" full>
                  <input
                    value={form.preferredRole}
                    onChange={(e) => setForm((p) => ({ ...p, preferredRole: e.target.value }))}
                    className="field"
                    placeholder="e.g. React Developer, Node.js Backend"
                    required
                  />
                </Field>
                <Field label="Skills (tag input)" full>
                  <SkillTags value={form.skills} onChange={(skills) => setForm((p) => ({ ...p, skills }))} />
                </Field>
              </Grid>
            </Section>

            <Section title="Education">
              <Grid>
                <Field label="Educational Attainment">
                  <input
                    value={form.educationAttainment}
                    onChange={(e) => setForm((p) => ({ ...p, educationAttainment: e.target.value }))}
                    className="field"
                    placeholder="e.g. BS Computer Science"
                    required
                  />
                </Field>
                <Field label="School / University">
                  <input
                    value={form.school}
                    onChange={(e) => setForm((p) => ({ ...p, school: e.target.value }))}
                    className="field"
                    placeholder="e.g. University of the Philippines"
                    required
                  />
                </Field>
                <Field label="Certifications (optional)" full>
                  <input
                    value={form.certifications}
                    onChange={(e) => setForm((p) => ({ ...p, certifications: e.target.value }))}
                    className="field"
                    placeholder="e.g. AWS CCP, Google UX"
                  />
                </Field>
              </Grid>
            </Section>

            <Section title="Portfolio">
              <div className="grid md:grid-cols-2 gap-4">
                <PortfolioCard title="GitHub" value={form.github} onChange={(github) => setForm((p) => ({ ...p, github }))} />
                <PortfolioCard
                  title="Portfolio Website"
                  value={form.portfolioWebsite}
                  onChange={(portfolioWebsite) => setForm((p) => ({ ...p, portfolioWebsite }))}
                />
                <PortfolioCard title="LinkedIn" value={form.linkedin} onChange={(linkedin) => setForm((p) => ({ ...p, linkedin }))} />
                <PortfolioCard
                  title="Other Links"
                  description="Comma-separated URLs (optional)"
                  value={form.otherLinks}
                  onChange={(otherLinks) => setForm((p) => ({ ...p, otherLinks }))}
                />
              </div>
            </Section>

            <Section title="Work Preferences">
              <div className="grid sm:grid-cols-3 gap-3">
                {['remote', 'hybrid', 'on-site'].map((value) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-xl border px-4 py-3 text-sm font-semibold ${
                      form.workPreference === value
                        ? 'border-blue-500/40 bg-blue-500/10 text-blue-100'
                        : 'border-slate-700 bg-slate-900/40 text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="workPreference"
                      value={value}
                      checked={form.workPreference === value}
                      onChange={(e) => setForm((p) => ({ ...p, workPreference: e.target.value }))}
                      className="hidden"
                    />
                    {value === 'on-site' ? 'On-site' : value.charAt(0).toUpperCase() + value.slice(1)}
                  </label>
                ))}
              </div>
            </Section>

            <Section title="About Me">
              <textarea
                value={form.aboutMe}
                onChange={(e) => setForm((p) => ({ ...p, aboutMe: e.target.value }))}
                className="field min-h-28"
                placeholder="Short description about you, your work style, and what you’re looking for."
                required
              />
            </Section>

            <Section title="Resume">
              <ResumeUploader value={form.resume} onChange={(resume) => setForm((p) => ({ ...p, resume }))} />
            </Section>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={!isComplete || saving}
                className="rounded-xl shadow-lg shadow-black/30 bg-blue-500/15 border border-blue-500/30 text-blue-200 hover:bg-blue-500/25 px-5 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="w-5 h-5 text-blue-400" /> : null}
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, full = false, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-semibold text-slate-200 mb-1">{label}</label>
      {children}
    </div>
  );
}
