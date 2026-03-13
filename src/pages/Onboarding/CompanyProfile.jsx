import React, { useMemo, useState } from 'react';
import { ArrowLeft, Building2, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@context/ThemeContext';
import KapITLogo from '@components/KapITLogo';
import CompanyLogoUpload from '@components/company/CompanyLogoUpload';
import ProjectForm from '@components/company/ProjectForm';
import { navigate } from '@features/company/companyUtils';

export default function CompanyProfile({ user, onSubmit, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: user?.companyName || user?.username || '',
    logoUrl: user?.profileImage || '',
    industry: user?.industry || '',
    companySize: user?.companySize || '',

    description: user?.bio || '',
    website: user?.website || '',
    location: user?.address || '',

    contactEmail: user?.email || '',
    phoneNumber: user?.phone || '',

    project: {
      title: '',
      description: '',
      budgetRange: '',
      timeline: '',
      servicesNeeded: [],
    },
  });

  const isComplete = useMemo(() => {
    return Boolean(
      String(form.companyName).trim() &&
        String(form.industry).trim() &&
        String(form.companySize).trim() &&
        String(form.location).trim() &&
        String(form.contactEmail).trim()
    );
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete || saving) return;
    setSaving(true);
    try {
      await onSubmit?.({
        companyName: form.companyName,
        logoUrl: form.logoUrl,
        industry: form.industry,
        companySize: form.companySize,
        description: form.description,
        website: form.website,
        location: form.location,
        contactEmail: form.contactEmail,
        phoneNumber: form.phoneNumber,
        servicesNeeded: form.project.servicesNeeded,
        projectTitle: form.project.title,
        projectDescription: form.project.description,
        budgetRange: form.project.budgetRange,
        timeline: form.project.timeline,
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
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Complete your company profile</h1>
              <p className="mt-1 text-sm text-slate-400">Set up your company details and hiring needs.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <Section title="Company Identity">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Company Name">
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                    className="field"
                    required
                  />
                </Field>
                <Field label="Industry">
                  <input
                    value={form.industry}
                    onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                    className="field"
                    placeholder="e.g. IT Services, E-commerce"
                    required
                  />
                </Field>
                <Field label="Company Size">
                  <input
                    value={form.companySize}
                    onChange={(e) => setForm((p) => ({ ...p, companySize: e.target.value }))}
                    className="field"
                    placeholder="e.g. 11-50"
                    required
                  />
                </Field>
                <Field label="Company Logo" full>
                  <CompanyLogoUpload value={form.logoUrl} onChange={(logoUrl) => setForm((p) => ({ ...p, logoUrl }))} />
                </Field>
              </div>
            </Section>

            <Section title="Company Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Website (optional)">
                  <input
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                    className="field"
                    placeholder="https://"
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    className="field"
                    placeholder="e.g. Manila, Philippines"
                    required
                  />
                </Field>
                <Field label="Company Description" full>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="field min-h-28"
                    placeholder="What does your company do?"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Project Details">
              <ProjectForm
                value={form.project}
                onChange={(project) => setForm((p) => ({ ...p, project }))}
              />
            </Section>

            <Section title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Contact Email">
                  <input value={form.contactEmail} readOnly className="field bg-[#f5f5f2] dark:bg-[#0f2139]/60" />
                </Field>
                <Field label="Phone Number (optional)">
                  <input
                    value={form.phoneNumber}
                    onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                    className="field"
                    placeholder="+63 9xx xxx xxxx"
                  />
                </Field>
              </div>
            </Section>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={!isComplete || saving}
                className="rounded-xl shadow-lg shadow-black/30 bg-blue-500/15 border border-blue-500/30 text-blue-200 hover:bg-blue-500/25 px-5 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save company profile'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, full = false, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-semibold text-slate-200 mb-1">{label}</label>
      {children}
    </div>
  );
}
