import React, { useEffect, useMemo, useState } from 'react';
import { WalletCards, X } from 'lucide-react';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import { COMPANY_PATHS, formatSkills, navigate, openCompanyPaymentPopup } from '@companyFeatures/companyUtils';
import { TECH_JOB_TITLE_OPTIONS } from '@companyFeatures/companyJobTitleOptions';
import { OTHER_SKILL_VALUE, TECH_SKILL_OPTIONS } from '@companyFeatures/companySkillOptions';
import { PAYMENT_CANCEL_MESSAGE_TYPE, PAYMENT_FINISH_MESSAGE_TYPE, PAYMENT_MESSAGE_TYPE, STORAGE_KEY } from '@companyPages/CompanyPostJobPaymentPage';
import { getCountryOptions } from '@sharedUtils/countryOptions';
import { cleanPlaceName, loadProvinceCityData } from '@sharedUtils/philippinesLocations';
import { companyAPI } from '@companyFeatures/companyAPI';
import {
  createPreAssessmentQuestionDraft,
  DEFAULT_COMPANY_POST_JOB_FORM,
  loadCompanyPostJobFormDraft,
  saveCompanyPostJobFormDraft,
} from '@companyFeatures/postJobDraftStorage';

const CUSTOM_JOB_VALUE = 'Other';
const JOB_TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
const EXPERIENCE_LEVEL_OPTIONS = ['Intern', 'Junior', 'Mid', 'Senior'];
const ATS_OPTIONS = ['Not using an ATS', 'Greenhouse', 'Lever', 'Workday', 'Ashby', 'BambooHR', 'SmartRecruiters', 'Other'];
const HIRING_TIMELINE_OPTIONS = ['ASAP', '1-2 weeks', 'This month', 'This quarter', 'Flexible'];
const WORK_PREFERENCE_OPTIONS = [
  { value: 'fully-remote', label: 'Fully remote' },
  { value: 'asynchronous-remote', label: 'Asynchronous remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' },
];
const SALARY_CURRENCY_OPTIONS = ['PHP', 'USD', 'EUR'];
const POST_JOB_SECTIONS = [
  { label: 'Details', description: 'Role, pay, location' },
  { label: 'Workflow', description: 'Timeline and filters' },
  { label: 'Skills', description: 'Search matching' },
  { label: 'Assessment', description: 'Optional screening' },
];
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
const parseLocation = (rawLocation, provinceOptions, provinceCodeByLabel, getCitiesForProvince) => {
  const locationText = String(rawLocation || '').trim();
  const locationParts = locationText
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const hasCountrySegment = locationParts.length >= 3;
  const country = hasCountrySegment ? locationParts[locationParts.length - 1] : 'Philippines';
  const normalized = hasCountrySegment ? locationParts.slice(0, -1).join(', ') : locationText.replace(/,\s*Philippines\s*$/i, '').trim();

  if (!normalized) {
    return { provinceCode: '', city: '', country };
  }
  if (String(country || '').trim().toLowerCase() !== 'philippines') {
    return { provinceCode: '', city: cleanPlaceName(normalized), country };
  }

  const parts = normalized.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const city = cleanPlaceName(parts[0]);
    const provinceCode = provinceCodeByLabel[cleanPlaceName(parts[1]).toLowerCase()] || '';
    return { provinceCode, city, country };
  }

  const cityOnly = cleanPlaceName(normalized);
  for (const option of provinceOptions) {
    const cities = getCitiesForProvince(option.code);
    if (cities.some((item) => item.name.toLowerCase() === cityOnly.toLowerCase())) {
      return { provinceCode: option.code, city: cityOnly, country };
    }
  }

  return { provinceCode: '', city: '', country };
};

const formatLocation = (city, provinceCode, provinceLabelByCode, country) => {
  const normalizedCountry = String(country || 'Philippines').trim() || 'Philippines';
  if (normalizedCountry.toLowerCase() !== 'philippines') {
    const cityText = String(city || '').trim();
    return cityText ? `${cityText}, ${normalizedCountry}` : normalizedCountry;
  }
  const provinceLabel = provinceLabelByCode[provinceCode] || '';
  if (!city || !provinceLabel) {
    return '';
  }
  return `${city}, ${provinceLabel}, ${normalizedCountry}`;
};

export default function CompanyPostJobPage() {
  const [error, setError] = useState('');
  const [paymentInfoOpen, setPaymentInfoOpen] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [locationData, setLocationData] = useState({
    provinceOptions: [],
    provinceLabelByCode: {},
    provinceCodeByLabel: {},
    getCitiesForProvince: () => [],
  });
  const [hydratedForm, setHydratedForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_COMPANY_POST_JOB_FORM);
  const countryOptions = useMemo(() => getCountryOptions(), []);
  const isPhilippines = String(form.country || '').trim().toLowerCase() === 'philippines';
  const cityOptions = useMemo(() => locationData.getCitiesForProvince(form.provinceCode), [form.provinceCode, locationData]);
  const salaryRangeOptions = useMemo(() => SALARY_RANGE_OPTIONS[form.salaryCurrency] || SALARY_RANGE_OPTIONS.PHP, [form.salaryCurrency]);
  const usingCustomSalary = form.salary === CUSTOM_SALARY_OPTION;

  useEffect(() => {
    const draft = loadCompanyPostJobFormDraft();
    setForm(draft);
    setHydratedForm(true);
  }, []);

  useEffect(() => {
    if (!hydratedForm) {
      return;
    }
    saveCompanyPostJobFormDraft(form);
  }, [form, hydratedForm]);

  useEffect(() => {
    let cancelled = false;

    const loadLocations = async () => {
      const nextData = await loadProvinceCityData();
      if (!cancelled) {
        setLocationData(nextData);
      }
    };

    loadLocations();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!locationData.provinceOptions.length) {
      return;
    }

    setForm((prev) => {
      if (prev.provinceCode || prev.city) {
        return prev;
      }

      const nextLocation = parseLocation(
        prev.location || '',
        locationData.provinceOptions,
        locationData.provinceCodeByLabel,
        locationData.getCitiesForProvince
      );
      return {
        ...prev,
        provinceCode: nextLocation.provinceCode,
        city: nextLocation.city,
        country: nextLocation.country || prev.country || 'Philippines',
        location: formatLocation(nextLocation.city, nextLocation.provinceCode, locationData.provinceLabelByCode, nextLocation.country || prev.country),
      };
    });
  }, [locationData]);

  useEffect(() => {
    if (!isPhilippines) {
      return;
    }
    setForm((prev) => {
      const nextCities = locationData.getCitiesForProvince(prev.provinceCode);
      const hasCity = nextCities.some((option) => option.name === prev.city);
      const nextCity = hasCity ? prev.city : '';
      return {
        ...prev,
        city: nextCity,
        location: formatLocation(nextCity, prev.provinceCode, locationData.provinceLabelByCode, prev.country),
      };
    });
  }, [form.provinceCode, locationData, isPhilippines]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      location: formatLocation(prev.city, prev.provinceCode, locationData.provinceLabelByCode, prev.country),
    }));
  }, [form.city, form.country, locationData]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === PAYMENT_MESSAGE_TYPE) {
        window.localStorage.removeItem(STORAGE_KEY);
        setPaymentPending(false);
        navigate(COMPANY_PATHS.jobs);
        return;
      }
      if (event.data?.type === PAYMENT_FINISH_MESSAGE_TYPE) {
        setPaymentPending(false);
        navigate(COMPANY_PATHS.jobs);
        window.focus();
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
    if (form.preAssessmentEnabled && form.preAssessmentQuestions.length === 0) {
      return setError('Add at least one pre-assessment question or turn off pre-assessment.');
    }

    const normalizedPreAssessmentQuestions = form.preAssessmentQuestions
      .map((question, index) => ({
        id: String(question?.id || `q${index + 1}`).trim().slice(0, 80) || `q${index + 1}`,
        question: String(question?.question || '').trim(),
        imageUrl: String(question?.imageUrl || '').trim(),
        criteria: Array.isArray(question?.criteria)
          ? question.criteria.map((item) => String(item || '').trim()).filter(Boolean)
          : [],
      }))
      .filter((question) => question.question);

    if (form.preAssessmentEnabled) {
      if (normalizedPreAssessmentQuestions.length === 0) {
        return setError('Each pre-assessment question needs text.');
      }
      const missingCriteria = normalizedPreAssessmentQuestions.find((question) => question.criteria.length === 0);
      if (missingCriteria) {
        return setError('Each pre-assessment question needs at least one answer criterion.');
      }
    }

    const payload = {
      title,
      description: String(form.description).trim(),
      salary: usingCustomSalary
        ? String(form.customSalary || '').trim()
        : String(form.salary || '').trim(),
      location: String(form.location || '').trim(),
      type: String(form.type || '').trim(),
      experienceLevel: String(form.experienceLevel || '').trim().toLowerCase(),
      workPreference: String(form.workPreference || '').trim().toLowerCase(),
      applicationDeadline: String(form.applicationDeadline || '').trim(),
      hiresNeeded: Math.max(1, Math.min(50, Number(form.hiresNeeded || 1) || 1)),
      ats: String(form.ats || '').trim(),
      hiringTimeline: String(form.hiringTimeline || '').trim(),
      mustHaves: String(form.mustHaves || '').trim(),
      dealbreakers: String(form.dealbreakers || '').trim(),
      skills: formatSkills(form.skills),
      preAssessment: {
        enabled: Boolean(form.preAssessmentEnabled),
        instructions: String(form.preAssessmentInstructions || '').trim(),
        questions: form.preAssessmentEnabled ? normalizedPreAssessmentQuestions : [],
      },
    };

    try {
      const data = await companyAPI.createDraftJob(payload);
      const draftPayload = {
        ...payload,
        jobId: data?.job?.id || null,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPayload));
      const openInCurrentTab = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
      if (openInCurrentTab) {
        setPaymentPending(true);
        navigate(COMPANY_PATHS.postJobPayment);
        return;
      }
      const paymentWindow = openCompanyPaymentPopup();
      if (!paymentWindow) {
        setPaymentPending(true);
        navigate(COMPANY_PATHS.postJobPayment);
        return;
      }
      setPaymentPending(true);
    } catch (err) {
      setError(err?.message || 'Unable to save the draft or open the payment window right now.');
    }
  };

  const handleTogglePreAssessment = (checked) => {
    if (!checked) {
      setForm((prev) => ({
        ...prev,
        preAssessmentEnabled: false,
      }));
      return;
    }

    setForm((prev) => {
      const next = {
        ...prev,
        preAssessmentEnabled: true,
        preAssessmentQuestions: prev.preAssessmentQuestions.length > 0
          ? prev.preAssessmentQuestions
          : [createPreAssessmentQuestionDraft()],
      };
      saveCompanyPostJobFormDraft(next);
      return next;
    });
    navigate(COMPANY_PATHS.postJobPreAssessment);
  };

  return (
    <div className="company-workspace-page company-workspace-form-page space-y-6">
      <div>
        <h1 className="company-workspace-page-title">Post a job</h1>
        <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Create the role, define candidate requirements, and prepare it for publishing.</p>
      </div>

      {paymentInfoOpen ? (
        <div className="fixed inset-0 z-[80] pointer-events-none">
          <div className="pointer-events-auto absolute right-4 top-[72px] w-[min(92vw,620px)] rounded-2xl border border-[#a3b18a] dark:border-[#444d57] bg-[#f8fbf6] dark:bg-[#22272b] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[#f8fbf6]/80 dark:bg-[#1a1d20] p-3 border border-[#d6d3c9] dark:border-[#444d57]">
                  <WalletCards className="w-4.5 h-4.5 text-[#3a5a40] dark:text-[#f0c766]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Payment before publishing</h3>
                  <p className="mt-2 text-[15px] leading-7 text-[#344e41] dark:text-[#eceff2]">
                    Selecting <span className="font-semibold text-[#3a5a40] dark:text-white">Post job</span> first saves this role as a draft in your company account, then opens the secure payment window.
                  </p>
                  <p className="mt-1.5 text-[15px] leading-7 text-[#344e41] dark:text-[#eceff2]">
                    If checkout is canceled, the draft stays saved and unpublished so you can pay later from Manage Jobs.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentInfoOpen(false)}
                className="rounded-lg p-2 text-[#344e41] hover:bg-[#eef3e8] dark:text-[#d0d7dd] dark:hover:bg-[#353c44]"
                aria-label="Close payment information"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {paymentPending && <p className="text-sm text-[#3a5a40] dark:text-[#f0c766]">Draft saved. Finish the payment in the merchant window to publish this job.</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="company-workspace-form-shell company-post-job-composer">
        <aside className="company-post-job-rail" aria-label="Post job sections">
          <div className="company-post-job-rail-heading">Role setup</div>
          <ol className="company-post-job-rail-list">
            {POST_JOB_SECTIONS.map((section, index) => (
              <li key={section.label} className="company-post-job-rail-item">
                <span className="company-post-job-rail-number">{index + 1}</span>
                <span className="min-w-0">
                  <span className="company-post-job-rail-label">{section.label}</span>
                  <span className="company-post-job-rail-copy">{section.description}</span>
                </span>
              </li>
            ))}
          </ol>
        </aside>

        <div className="company-post-job-main">
          <section className="company-workspace-form-section company-post-job-section space-y-6">
            <div className="company-post-job-section-intro">
              <h2 className="company-workspace-section-title">Job details</h2>
              <p className="mt-1 text-xs text-[var(--workspace-text-muted)]">The role information developers will see in the listing.</p>
            </div>
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
                  className="mt-2 text-xs font-semibold text-[#3a5a40] hover:text-[#344e41] dark:text-[#f0c766] dark:hover:text-[#d0d7dd]"
                >
                  Back to preset salary ranges
                </button>
              )}
            </Field>
            <Field label="Country (optional)">
              <SearchableSelect
                value={form.country}
                onChange={(country) =>
                  setForm((prev) => ({
                    ...prev,
                    country,
                    provinceCode: String(country || '').trim().toLowerCase() === 'philippines' ? prev.provinceCode : '',
                  }))}
                options={countryOptions}
                placeholder="Select a country"
                searchPlaceholder="Search country"
                searchInTrigger
              />
            </Field>
            <Field label="Location (optional)">
              {isPhilippines ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <SearchableSelect
                    value={form.provinceCode}
                    onChange={(provinceCode) => setForm((prev) => ({ ...prev, provinceCode }))}
                    options={locationData.provinceOptions.map((province) => ({ value: province.code, label: province.label }))}
                    placeholder="Select a province"
                    searchPlaceholder="Search provinces"
                    searchInTrigger
                  />
                  <SearchableSelect
                    value={form.city}
                    onChange={(city) => setForm((prev) => ({ ...prev, city }))}
                    options={cityOptions.map((city) => ({ value: city.name, label: city.name }))}
                    placeholder={form.provinceCode ? 'Select a city or municipality' : 'Select a province first'}
                    searchPlaceholder="Search city or municipality"
                    disabled={!form.provinceCode}
                    searchInTrigger
                  />
                </div>
              ) : (
                <input
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  className="field"
                  placeholder="Enter your location in this country"
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Type (optional)">
              <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="field">
                {JOB_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
            <Field label="Experience level (optional)">
              <select value={form.experienceLevel} onChange={(e) => setForm((prev) => ({ ...prev, experienceLevel: e.target.value }))} className="field">
                <option value="">Select experience level</option>
                {EXPERIENCE_LEVEL_OPTIONS.map((option) => <option key={option} value={option.toLowerCase()}>{option}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Work preference (optional)">
              <select value={form.workPreference || ''} onChange={(e) => setForm((prev) => ({ ...prev, workPreference: e.target.value }))} className="field">
                <option value="">Select work preference</option>
                {WORK_PREFERENCE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field label="Hires needed">
              <input
                type="number"
                min={1}
                max={50}
                value={form.hiresNeeded}
                onChange={(e) => {
                  const nextValue = Number(e.target.value || 1);
                  const normalized = Number.isFinite(nextValue) ? nextValue : 1;
                  setForm((prev) => ({ ...prev, hiresNeeded: Math.max(1, Math.min(50, normalized)) }));
                }}
                className="field"
                placeholder="1"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Application deadline (optional)">
              <input
                type="date"
                value={form.applicationDeadline}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm((prev) => ({ ...prev, applicationDeadline: e.target.value }))}
                className="field"
              />
            </Field>
            <Field label="Hiring timeline (optional)">
              <select value={form.hiringTimeline || ''} onChange={(e) => setForm((prev) => ({ ...prev, hiringTimeline: e.target.value }))} className="field">
                <option value="">Select timeline</option>
                {HIRING_TIMELINE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
          </div>
        </section>

        <section className="company-workspace-form-section company-workspace-form-section-subtle company-post-job-section space-y-4">
          <div className="company-post-job-section-intro">
            <h2 className="company-workspace-section-title">Hiring workflow</h2>
            <p className="text-xs text-[#4f6654] dark:text-[#b9c1c8]">Role-specific details for matching and recruiter handoff.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="ATS used (optional)">
              <select value={form.ats || ''} onChange={(e) => setForm((prev) => ({ ...prev, ats: e.target.value }))} className="field">
                <option value="">Select ATS</option>
                {ATS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Must-haves (optional)">
              <textarea value={form.mustHaves || ''} onChange={(e) => setForm((prev) => ({ ...prev, mustHaves: e.target.value }))} className="field min-h-24 resize-y" placeholder="Required skills, certifications, tools, or experience..." />
            </Field>
            <Field label="Dealbreakers (optional)">
              <textarea value={form.dealbreakers || ''} onChange={(e) => setForm((prev) => ({ ...prev, dealbreakers: e.target.value }))} className="field min-h-24 resize-y" placeholder="Constraints that would make a candidate unsuitable..." />
            </Field>
          </div>
        </section>

        <section className="company-workspace-form-section company-post-job-section space-y-4">
          <div className="company-post-job-section-intro">
            <h2 className="company-workspace-section-title">Skills</h2>
            <p className="text-xs text-[#4f6654] dark:text-[#b9c1c8]">List the tools and capabilities that should show up in matching and search.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Skills">
              <div className="space-y-3">
                <SearchableSelect value={selectedSkill} onChange={(skill) => { setSelectedSkill(skill); if (skill === OTHER_SKILL_VALUE) return; addSkill(skill); setSelectedSkill(''); }} options={TECH_SKILL_OPTIONS.filter((skill) => skill === OTHER_SKILL_VALUE || !form.skills.includes(skill))} placeholder="Select a skill" searchPlaceholder="Search tech skills" />
                {selectedSkill === OTHER_SKILL_VALUE && <input value={customSkill} onChange={(e) => { const nextValue = e.target.value; setCustomSkill(nextValue); const trimmed = nextValue.trim(); if (!trimmed) return; if (trimmed.endsWith(',') || trimmed.endsWith(';')) { addSkill(trimmed.slice(0, -1)); setCustomSkill(''); setSelectedSkill(''); } }} onBlur={() => { if (!customSkill.trim()) { setSelectedSkill(''); return; } addSkill(customSkill); setCustomSkill(''); setSelectedSkill(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(customSkill); setCustomSkill(''); setSelectedSkill(''); } }} className="field" placeholder="Type other skill and press Enter" autoFocus />}
                {form.skills.length > 0 && <div className="flex flex-wrap gap-2">{form.skills.map((skill) => <span key={skill} className="inline-flex items-center gap-2 rounded-full border border-[#a3b18a] dark:border-[#444d57] bg-[#f5f5f2] dark:bg-[#1a1d20] px-3 py-1 text-sm text-[#344e41] dark:text-white">{skill}<button type="button" onClick={() => removeSkill(skill)} className="text-[#5f6f52] dark:text-[#d0d7dd]" aria-label={`Remove ${skill}`}><X className="h-3.5 w-3.5" /></button></span>)}</div>}
              </div>
            </Field>
          </div>
        </section>

        <section className="company-workspace-form-section company-workspace-form-section-subtle company-post-job-section space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="company-post-job-section-intro">
              <h2 className="company-workspace-section-title">Assessment</h2>
              <p className="text-xs text-[#4f6654] dark:text-[#b9c1c8]">Enable this to redirect into a dedicated builder page where you can create multiple questions, add images, and define answer criteria.</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#344e41] dark:text-white">
              <input
                type="checkbox"
                checked={form.preAssessmentEnabled}
                onChange={(event) => handleTogglePreAssessment(event.target.checked)}
                className="h-4 w-4 rounded border-[#a3b18a] text-[#3a5a40] focus:ring-[#588157]"
              />
              Enable pre-assessment
            </label>
          </div>
          {form.preAssessmentEnabled ? (
            <div className="rounded-xl border border-[#bfd0af] dark:border-[#444d57] bg-[#f8fbf6] dark:bg-[#22272b] p-4">
              <p className="text-sm text-[#344e41] dark:text-[#d0d7dd]">
                {form.preAssessmentQuestions.length} question{form.preAssessmentQuestions.length === 1 ? '' : 's'} configured.
                Use the dedicated builder page to add/edit questions, references, and criteria.
              </p>
              <button
                type="button"
                onClick={() => navigate(COMPANY_PATHS.postJobPreAssessment)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] dark:border-[#444d57] px-3 py-2 text-sm font-semibold text-[#344e41] dark:text-white hover:bg-[#eef3e8] dark:hover:bg-[#353c44]"
              >
                Edit pre-assessment
              </button>
            </div>
          ) : null}
        </section>

        <div className="company-workspace-form-actions company-post-job-actions">
          <button type="button" onClick={() => navigate(COMPANY_PATHS.dashboard)} className="company-workspace-secondary-button px-4 py-2.5">Cancel</button>
          <button type="submit" className="company-workspace-primary-button px-4 py-2.5">Continue to payment</button>
        </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="company-post-job-field"><label>{label}</label>{children}</div>;
}




