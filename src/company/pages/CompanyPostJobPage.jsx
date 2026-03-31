import React, { useEffect, useMemo, useState } from 'react';
import { WalletCards, X } from 'lucide-react';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import { COMPANY_PATHS, formatSkills, navigate } from '@companyFeatures/companyUtils';
import { TECH_JOB_TITLE_OPTIONS } from '@companyFeatures/companyJobTitleOptions';
import { OTHER_SKILL_VALUE, TECH_SKILL_OPTIONS } from '@companyFeatures/companySkillOptions';
import { PAYMENT_CANCEL_MESSAGE_TYPE, PAYMENT_MESSAGE_TYPE, STORAGE_KEY } from '@companyPages/CompanyPostJobPaymentPage';
import { loadAddressOptions } from '@sharedUtils/philippinesLocations';
import { companyAPI } from '@companyFeatures/companyAPI';

const CUSTOM_JOB_VALUE = 'Other';
const JOB_TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const SALARY_CURRENCY_OPTIONS = ['PHP', 'USD', 'EUR'];
const SALARY_RANGE_OPTIONS = {
  PHP: [
    'PHP 25,000-40,000 / month',
    'PHP 40,000-60,000 / month',
    'PHP 60,000-90,000 / month',
    'PHP 90,000-130,000 / month',
    'PHP 130,000-180,000 / month',
    'PHP 180,000-250,000 / month',
    'PHP 250,000-350,000 / month',
    'Other',
  ],
  USD: [
    'USD 800-1,200 / month',
    'USD 1,200-1,800 / month',
    'USD 1,800-2,500 / month',
    'USD 2,500-3,500 / month',
    'USD 3,500-5,000 / month',
    'USD 5,000-7,000 / month',
    'USD 7,000-10,000 / month',
    'Other',
  ],
  EUR: [
    'EUR 700-1,100 / month',
    'EUR 1,100-1,700 / month',
    'EUR 1,700-2,400 / month',
    'EUR 2,400-3,300 / month',
    'EUR 3,300-4,700 / month',
    'EUR 4,700-6,500 / month',
    'EUR 6,500-9,000 / month',
    'Other',
  ],
};
const CUSTOM_SALARY_OPTION = 'Other';
export default function PostJob() {
  const [error, setError] = useState('');
  const [paymentPending, setPaymentPending] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [searchableLocations, setSearchableLocations] = useState([]);
  const [form, setForm] = useState({ selectedTitle: '', customTitle: '', description: '', salaryCurrency: 'PHP', salary: '', customSalary: '', location: '', type: 'Full-time', skills: [] });
  const salaryRangeOptions = useMemo(() => SALARY_RANGE_OPTIONS[form.salaryCurrency] || SALARY_RANGE_OPTIONS.PHP, [form.salaryCurrency]);
  const usingCustomSalary = form.salary === CUSTOM_SALARY_OPTION;

  useEffect(() => {
    let cancelled = false;

    const loadLocations = async () => {
      const options = await loadAddressOptions();
      if (!cancelled) {
        setSearchableLocations(options);
      }
    };

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === PAYMENT_MESSAGE_TYPE) {
        window.localStorage.removeItem(STORAGE_KEY);
        setPaymentPending(false);
        navigate(COMPANY_PATHS.jobs);
        return;
      }
      if (event.data?.type === PAYMENT_CANCEL_MESSAGE_TYPE) {
        setPaymentPending(false);
        setError('Payment was canceled or closed. Your job draft is still saved and unpublished, so you can try again.');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const addSkill = (skill) => {
    const nextSkill = String(skill || '').trim();
    if (!nextSkill || nextSkill === OTHER_SKILL_VALUE) return;
    setForm((prev) => ({ ...prev, skills: prev.skills.includes(nextSkill) ? prev.skills : [...prev.skills, nextSkill] }));
  };

  const removeSkill = (skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((item) => item !== skill) }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const title = form.selectedTitle === CUSTOM_JOB_VALUE ? String(form.customTitle || '').trim() : String(form.selectedTitle || '').trim();
    if (!title) return setError('Please choose a job title.');
    if (!String(form.description || '').trim()) return setError('Please enter a job description.');

    const payload = {
      title,
      description: String(form.description).trim(),
      salary: usingCustomSalary
        ? String(form.customSalary || '').trim()
        : String(form.salary || '').trim(),
      location: String(form.location || '').trim(),
      type: String(form.type || '').trim(),
      skills: formatSkills(form.skills),
    };

    try {
      const data = await companyAPI.createDraftJob(payload);
      const draftPayload = {
        ...payload,
        jobId: data?.job?.id || null,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPayload));
      const paymentWindow = window.open(COMPANY_PATHS.postJobPayment, 'company-post-job-payment', 'width=760,height=860,resizable=yes,scrollbars=yes');
      if (!paymentWindow) return setError('The payment window was blocked. Please allow pop-ups and try again.');
      setPaymentPending(true);
      paymentWindow.focus();
    } catch (err) {
      setError(err?.message || 'Unable to save the draft or open the payment window right now.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Post a job</h2>
        <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">Choose the role, complete payment, and then publish the listing.</p>
      </div>

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-[linear-gradient(135deg,#f8fbf5,#edf5ea)] dark:bg-[linear-gradient(135deg,#16304a,#102235)] p-5 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white/80 dark:bg-[#0f2139] p-3 border border-[#d6d3c9] dark:border-[#2a4a6f]"><WalletCards className="w-5 h-5 text-[#3a5a40] dark:text-[#7fd0ee]" /></div>
          <div>
            <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Payment before publishing</h3>
            <p className="mt-1 text-sm text-[#344e41] dark:text-[#dcecff]">Selecting <span className="font-semibold text-[#3a5a40] dark:text-white">Post job</span> first saves this role as a draft in your company account, then opens the secure payment window.</p>
            <p className="mt-1 text-sm text-[#344e41] dark:text-[#dcecff]">If checkout is canceled, the draft stays saved and unpublished so you can pay later from Manage Jobs.</p>
          </div>
        </div>
      </div>

      {paymentPending && <p className="text-sm text-[#3a5a40] dark:text-[#7fd0ee]">Draft saved. Finish the payment in the merchant window to publish this job.</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-8 space-y-6 transition-colors duration-300">
        <Field label="Job title">
          <SearchableSelect value={form.selectedTitle} onChange={(selectedTitle) => setForm((prev) => ({ ...prev, selectedTitle, customTitle: selectedTitle === CUSTOM_JOB_VALUE ? prev.customTitle : '' }))} options={TECH_JOB_TITLE_OPTIONS} placeholder="Select a tech job title" searchPlaceholder="Search tech job titles" />
        </Field>

        {form.selectedTitle === CUSTOM_JOB_VALUE && <Field label="Custom job title"><input value={form.customTitle} onChange={(e) => setForm((prev) => ({ ...prev, customTitle: e.target.value }))} className="field" placeholder="Enter the exact tech role" required /></Field>}

        <Field label="Description"><textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="field min-h-32" placeholder="Responsibilities, requirements, and what success looks like..." required /></Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Salary (optional)">
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
              <select
                value={form.salaryCurrency}
                onChange={(e) => setForm((prev) => ({ ...prev, salaryCurrency: e.target.value, salary: '', customSalary: '' }))}
                className="field"
              >
                {SALARY_CURRENCY_OPTIONS.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
              {usingCustomSalary ? (
                <input
                  value={form.customSalary}
                  onChange={(e) => setForm((prev) => ({ ...prev, customSalary: e.target.value }))}
                  className="field"
                  placeholder={`Enter ${form.salaryCurrency} salary range`}
                />
              ) : (
                <select
                  value={form.salary}
                  onChange={(e) => setForm((prev) => ({ ...prev, salary: e.target.value, customSalary: '' }))}
                  className="field"
                >
                  <option value="">Select salary range</option>
                  {salaryRangeOptions.map((range) => <option key={range} value={range}>{range}</option>)}
                </select>
              )}
            </div>
            {usingCustomSalary && (
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, salary: '', customSalary: '' }))}
                className="mt-2 text-xs font-semibold text-[#3a5a40] hover:text-[#344e41] dark:text-[#7fd0ee] dark:hover:text-[#b8d4e8]"
              >
                Back to preset salary ranges
              </button>
            )}
          </Field>
          <Field label="Location (optional)"><SearchableSelect value={form.location} onChange={(location) => setForm((prev) => ({ ...prev, location }))} options={searchableLocations} placeholder="Select a municipality or city in the Philippines" searchPlaceholder="Search municipality, city, or province" searchInTrigger /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Type (optional)">
            <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="field">
              {JOB_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Skills">
            <div className="space-y-3">
              <SearchableSelect value={selectedSkill} onChange={(skill) => { setSelectedSkill(skill); if (skill === OTHER_SKILL_VALUE) return; addSkill(skill); setSelectedSkill(''); }} options={TECH_SKILL_OPTIONS.filter((skill) => skill === OTHER_SKILL_VALUE || !form.skills.includes(skill))} placeholder="Select a skill" searchPlaceholder="Search tech skills" />
              {selectedSkill === OTHER_SKILL_VALUE && <input value={customSkill} onChange={(e) => { const nextValue = e.target.value; setCustomSkill(nextValue); const trimmed = nextValue.trim(); if (!trimmed) return; if (trimmed.endsWith(',') || trimmed.endsWith(';')) { addSkill(trimmed.slice(0, -1)); setCustomSkill(''); setSelectedSkill(''); } }} onBlur={() => { if (!customSkill.trim()) { setSelectedSkill(''); return; } addSkill(customSkill); setCustomSkill(''); setSelectedSkill(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(customSkill); setCustomSkill(''); setSelectedSkill(''); } }} className="field" placeholder="Type other skill and press Enter" autoFocus />}
              {form.skills.length > 0 && <div className="flex flex-wrap gap-2">{form.skills.map((skill) => <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#0f2139] px-3 py-1 text-sm text-[#344e41] dark:text-white">{skill}<button type="button" onClick={() => removeSkill(skill)} className="text-[#5f6f52] dark:text-[#b8d4e8]" aria-label={`Remove ${skill}`}><X className="h-3.5 w-3.5" /></button></span>)}</div>}
            </div>
          </Field>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(COMPANY_PATHS.dashboard)} className="px-4 py-2.5 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors">Cancel</button>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold transition-colors">Continue to payment</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1"><label className="text-sm font-semibold text-[#3a5a40] dark:text-white">{label}</label>{children}</div>;
}




