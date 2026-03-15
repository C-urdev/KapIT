import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Briefcase, LogOut, Moon, Sun, UserCircle2 } from 'lucide-react';
import phil from 'phil-reg-prov-mun-brgy';
import { useTheme } from '@context/ThemeContext';
import KapITLogo from '@components/KapITLogo';
import SkillTags from '@components/developer/SkillTags';
import PortfolioCard from '@components/developer/PortfolioCard';
import ResumeUploader from '@components/developer/ResumeUploader';
import { navigate } from '@features/company/companyUtils';

const JOB_TITLE_OPTIONS = {
  'Frontend Developer': ['React Developer', 'Vue Developer', 'Angular Developer', 'UI Developer'],
  'Backend Developer': ['Node.js Backend Developer', 'Java Backend Developer', 'PHP Backend Developer', 'Python Backend Developer'],
  'Full Stack Developer': ['MERN Stack Developer', 'MEAN Stack Developer', 'JavaScript Full Stack Developer', 'Web Application Developer'],
  'Mobile Developer': ['Android Developer', 'iOS Developer', 'React Native Developer', 'Flutter Developer'],
  'QA Engineer': ['Manual QA Tester', 'Automation QA Engineer', 'Software Test Engineer', 'Performance Tester'],
  'UI/UX Designer': ['Product Designer', 'UX Designer', 'UI Designer', 'Interaction Designer'],
  'DevOps Engineer': ['Cloud Engineer', 'Site Reliability Engineer', 'Platform Engineer', 'CI/CD Engineer'],
  'Data Analyst': ['Business Intelligence Analyst', 'Reporting Analyst', 'Product Analyst', 'Data Visualization Analyst'],
  'Cybersecurity Specialist': ['Security Analyst', 'SOC Analyst', 'Security Engineer', 'Penetration Tester'],
  'IT Support Specialist': ['Help Desk Specialist', 'Technical Support Engineer', 'System Support Specialist', 'Desktop Support Engineer'],
};

const JOB_TITLES = Object.keys(JOB_TITLE_OPTIONS);
const VOCATIONAL_EDUCATION_OPTION = 'Vocational / Technical Graduate';
const OTHER_EDUCATION_OPTION = 'Other educational attainment';
const OTHER_SCHOOL_OPTION = 'Other / School not listed';
const EDUCATIONAL_ATTAINMENT_OPTIONS = [
  'Senior High School Graduate',
  'High School Graduate',
  VOCATIONAL_EDUCATION_OPTION,
  'College Undergraduate',
  'Bachelor of Science in Information Technology',
  'Bachelor of Science in Computer Science',
  'Bachelor of Science in Information Systems',
  'Bachelor of Science in Computer Engineering',
  'Bachelor of Science in Electronics Engineering',
  'Bachelor of Science in Software Engineering',
  'Bachelor of Science in Multimedia Arts',
  'Bachelor of Science in Data Science',
  'Bachelor of Science in Cybersecurity',
  OTHER_EDUCATION_OPTION,
];
const SCHOOL_OPTIONS = [
  'University of the Philippines',
  'Ateneo de Manila University',
  'De La Salle University',
  'Mapua University',
  'Polytechnic University of the Philippines',
  'Technological University of the Philippines',
  'Technological Institute of the Philippines',
  'University of Santo Tomas',
  'Far Eastern University Institute of Technology',
  'Adamson University',
  'National University',
  'University of San Carlos',
  'Cebu Institute of Technology - University',
  'University of Cebu',
  'STI College',
  'AMA University',
  'Informatics College',
  'Our Lady of Fatima University',
  'Batangas State University',
  'Cavite State University',
  'Bulacan State University',
  'Laguna State Polytechnic University',
  'Pamantasan ng Lungsod ng Maynila',
  'Jose Rizal University',
  'Lyceum of the Philippines University',
  'University of Mindanao',
  'Ateneo de Davao University',
  'University of Southeastern Philippines',
  'Silliman University',
  'Xavier University - Ateneo de Cagayan',
  OTHER_SCHOOL_OPTION,
];
const NCR_PROVINCE_CODE = 'metro-manila';
const NCR_COMPONENT_CODES = ['1339', '1374', '1375', '1376'];
const EXCLUDED_PROVINCE_CODES = new Set(['0997', '1298']);

const titleCase = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const cleanPlaceName = (value) =>
  titleCase(String(value || ''))
    .replace(/\s*\(Capital\)$/i, '')
    .replace(/^City Of /i, '')
    .replace(/\s+City$/i, '')
    .trim();

const provinceOptions = (() => {
  const unique = new Map();
  for (const province of phil.provinces || []) {
    if (EXCLUDED_PROVINCE_CODES.has(province.prov_code)) {
      continue;
    }
    if (NCR_COMPONENT_CODES.includes(province.prov_code)) {
      continue;
    }
    if (!unique.has(province.prov_code)) {
      unique.set(province.prov_code, {
        code: province.prov_code,
        label: cleanPlaceName(province.name),
      });
    }
  }

  const options = Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label));
  options.unshift({ code: NCR_PROVINCE_CODE, label: 'Metro Manila' });
  return options;
})();

const provinceLabelByCode = Object.fromEntries(provinceOptions.map((option) => [option.code, option.label]));
const provinceCodeByLabel = Object.fromEntries(provinceOptions.map((option) => [option.label.toLowerCase(), option.code]));

const ncrCityOptions = (() => {
  const seen = new Set(['Manila']);
  const cities = [{ name: 'Manila' }];

  for (const record of phil.city_mun || []) {
    if (!NCR_COMPONENT_CODES.includes(record.prov_code)) {
      continue;
    }

    const cleaned = cleanPlaceName(record.name);
    if (!cleaned || seen.has(cleaned)) {
      continue;
    }

    seen.add(cleaned);
    cities.push({ name: cleaned });
  }

  return cities.sort((a, b) => a.name.localeCompare(b.name));
})();

const getCitiesForProvince = (provinceCode) => {
  if (!provinceCode) {
    return [];
  }

  if (provinceCode === NCR_PROVINCE_CODE) {
    return ncrCityOptions;
  }

  const result = phil.getCityMunByProvince(provinceCode) || [];
  return result
    .map((record) => ({ name: cleanPlaceName(record.name) }))
    .filter((record, index, arr) => record.name && arr.findIndex((item) => item.name === record.name) === index)
    .sort((a, b) => a.name.localeCompare(b.name));
};

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const parseLocation = (rawLocation) => {
  const normalized = String(rawLocation || '')
    .replace(/,\s*Philippines\s*$/i, '')
    .trim();

  if (!normalized) {
    return { provinceCode: '', city: '' };
  }

  const parts = normalized.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const city = cleanPlaceName(parts[0]);
    const provinceCode = provinceCodeByLabel[cleanPlaceName(parts[1]).toLowerCase()] || '';
    return { provinceCode, city };
  }

  const cityOnly = cleanPlaceName(normalized);
  for (const option of provinceOptions) {
    const cities = getCitiesForProvince(option.code);
    if (cities.some((item) => item.name.toLowerCase() === cityOnly.toLowerCase())) {
      return { provinceCode: option.code, city: cityOnly };
    }
  }

  return { provinceCode: '', city: '' };
};

const formatLocation = (city, provinceCode) => {
  const provinceLabel = provinceLabelByCode[provinceCode] || '';
  if (!city || !provinceLabel) {
    return '';
  }
  return `${city}, ${provinceLabel}, Philippines`;
};

export default function DeveloperProfile({ user, onSubmit, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const initialLocation = parseLocation(user?.location || user?.address || '');
  const savedEducation = String(user?.educationAttainment || user?.education || '');
  const isSavedVocational = savedEducation.toLowerCase().startsWith(VOCATIONAL_EDUCATION_OPTION.toLowerCase());
  const savedVocationalCourse = isSavedVocational ? savedEducation.slice(VOCATIONAL_EDUCATION_OPTION.length).replace(/^\s*[-:]\s*/, '').trim() : '';
  const isSavedCustomEducation = Boolean(savedEducation) && !isSavedVocational && !EDUCATIONAL_ATTAINMENT_OPTIONS.includes(savedEducation);
  const savedSchool = String(user?.school || '');
  const isSavedCustomSchool = savedSchool && !SCHOOL_OPTIONS.includes(savedSchool);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    profileImage: user?.profileImage || '',
    fullName: user?.fullName || user?.name || '',
    username: user?.username || '',
    provinceCode: initialLocation.provinceCode,
    city: initialLocation.city,
    location: formatLocation(initialLocation.city, initialLocation.provinceCode),
    phoneNumber: user?.phoneNumber || user?.phone || '',
    email: user?.email || '',

    jobTitle: user?.jobTitle || '',
    yearsOfExperience: user?.yearsOfExperience || '',
    skills: Array.isArray(user?.skills) ? user.skills : [],
    preferredRole: user?.preferredRole || user?.desiredJob || '',

    educationAttainment: isSavedVocational ? VOCATIONAL_EDUCATION_OPTION : isSavedCustomEducation ? OTHER_EDUCATION_OPTION : savedEducation,
    vocationalCourse: savedVocationalCourse,
    customEducationAttainment: isSavedCustomEducation ? savedEducation : '',
    school: isSavedCustomSchool ? OTHER_SCHOOL_OPTION : savedSchool,
    customSchool: isSavedCustomSchool ? savedSchool : '',
    certifications: user?.certifications || '',

    github: user?.github || '',
    portfolioWebsite: user?.portfolioWebsite || '',
    linkedin: user?.linkedin || '',
    otherLinks: user?.otherLinks || '',

    workPreference: user?.workPreference || 'remote',
    aboutMe: user?.aboutMe || user?.bio || '',
    resume: user?.resume || '',
  });

  const preferredRoleOptions = useMemo(() => JOB_TITLE_OPTIONS[form.jobTitle] || [], [form.jobTitle]);
  const cityOptions = useMemo(() => getCitiesForProvince(form.provinceCode), [form.provinceCode]);
  const requiresVocationalCourse = form.educationAttainment === VOCATIONAL_EDUCATION_OPTION;
  const requiresCustomEducation = form.educationAttainment === OTHER_EDUCATION_OPTION;
  const requiresCustomSchool = form.school === OTHER_SCHOOL_OPTION;

  useEffect(() => {
    if (!form.jobTitle) {
      if (form.preferredRole) {
        setForm((prev) => ({ ...prev, preferredRole: '' }));
      }
      return;
    }

    if (preferredRoleOptions.length && !preferredRoleOptions.includes(form.preferredRole)) {
      setForm((prev) => ({ ...prev, preferredRole: preferredRoleOptions[0] }));
    }
  }, [form.jobTitle, form.preferredRole, preferredRoleOptions]);

  useEffect(() => {
    setForm((prev) => {
      const nextCities = getCitiesForProvince(prev.provinceCode);
      const hasCity = nextCities.some((option) => option.name === prev.city);
      const nextCity = hasCity ? prev.city : '';
      return {
        ...prev,
        city: nextCity,
        location: formatLocation(nextCity, prev.provinceCode),
      };
    });
  }, [form.provinceCode]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      location: formatLocation(prev.city, prev.provinceCode),
    }));
  }, [form.city]);

  const isComplete = useMemo(() => {
    return Boolean(
      String(form.fullName).trim() &&
        String(form.username).trim() &&
        String(form.location).trim() &&
        String(form.phoneNumber).trim() &&
        String(form.email).trim() &&
        String(form.jobTitle).trim() &&
        String(form.yearsOfExperience).trim() &&
        String(form.preferredRole).trim() &&
        String(form.educationAttainment).trim() &&
        (!requiresVocationalCourse || String(form.vocationalCourse).trim()) &&
        (!requiresCustomEducation || String(form.customEducationAttainment).trim()) &&
        String(form.school).trim() &&
        (!requiresCustomSchool || String(form.customSchool).trim())
    );
  }, [form, requiresCustomEducation, requiresCustomSchool, requiresVocationalCourse]);

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
      const educationAttainment = requiresVocationalCourse
        ? `${VOCATIONAL_EDUCATION_OPTION} - ${String(form.vocationalCourse || '').trim()}`
        : requiresCustomEducation
          ? String(form.customEducationAttainment || '').trim()
          : form.educationAttainment;
      const school = requiresCustomSchool ? String(form.customSchool || '').trim() : form.school;

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
        educationAttainment,
        school,
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
    <div className="min-h-screen bg-[#f5f5f2] text-[#344e41] dark:bg-[#0a1628] dark:text-slate-200">
      <header className="sticky top-0 z-30 border-b border-[#a3b18a] bg-white dark:border-[#1e3a5f] dark:bg-[#0a1628]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-[#344e41] hover:text-[#3a5a40] dark:text-slate-200 dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="inline-flex items-center gap-3">
              <KapITLogo className="h-9 w-9 rounded-lg object-contain bg-white" />
              <span className="text-xl font-bold text-[#3a5a40] dark:text-white">KapIT</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 transition-colors hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f]"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5 text-[#344e41]" /> : <Sun className="h-5 w-5 text-white" />}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-2xl border border-[#a3b18a] bg-white p-6 shadow-lg shadow-black/5 dark:border-[#1e3a5f] dark:bg-[#162842] dark:shadow-black/30 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#a3b18a] bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#0f2139]">
              <Briefcase className="h-6 w-6 text-[#588157] dark:text-[#3ba9d6]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white sm:text-3xl">Complete your developer profile</h1>
              <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">This helps companies find the right match for roles and projects.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <Section title="Profile Picture (Optional)" icon={UserCircle2}>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-[#a3b18a] bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#0f2139]">
                  {form.profileImage ? (
                    <img src={form.profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm text-[#5f6f52] dark:text-slate-500">No photo</span>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickPhoto(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-[#344e41] dark:text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef6ee] file:px-4 file:py-2 file:font-semibold file:text-[#3a5a40] hover:file:bg-[#e3eee3] dark:file:bg-[#1e3a5f] dark:file:text-[#b8d4e8] dark:hover:file:bg-[#24496d]"
                  />
                  <p className="mt-2 text-xs text-[#5f6f52] dark:text-slate-400">JPG/PNG recommended.</p>
                </div>
              </div>
            </Section>

            <Section title="Basic Information">
              <Grid>
                <Field label="Full Name">
                  <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} className="field" placeholder="e.g. Juan Dela Cruz" required />
                </Field>
                <Field label="Username">
                  <input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} className="field" placeholder="e.g. juan_dev" required />
                </Field>
                <Field label="Province">
                  <select value={form.provinceCode} onChange={(e) => setForm((p) => ({ ...p, provinceCode: e.target.value }))} className="field" required>
                    <option value="">Select a province</option>
                    {provinceOptions.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="City / Municipality">
                  <select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="field" required disabled={!form.provinceCode}>
                    <option value="">{form.provinceCode ? 'Select a city or municipality' : 'Select a province first'}</option>
                    {cityOptions.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Country">
                  <input value="Philippines" readOnly className="field bg-[#f5f5f2] dark:bg-[#0f2139]/60" />
                </Field>
                <Field label="Phone Number">
                  <input value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} className="field" placeholder="e.g. +63 9xx xxx xxxx" required />
                </Field>
                <Field label="Email">
                  <input value={form.email} readOnly className="field bg-[#f5f5f2] dark:bg-[#0f2139]/60" />
                </Field>
                <Field label="Saved Location" full>
                  <input value={form.location} readOnly className="field bg-[#f5f5f2] dark:bg-[#0f2139]/60" />
                </Field>
              </Grid>
            </Section>

            <Section title="Professional Details">
              <Grid>
                <Field label="Job Title">
                  <select value={form.jobTitle} onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))} className="field" required>
                    <option value="">Select a job title</option>
                    {JOB_TITLES.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Years of Experience">
                  <input type="number" min="0" max="60" value={form.yearsOfExperience} onChange={(e) => setForm((p) => ({ ...p, yearsOfExperience: e.target.value }))} className="field" placeholder="e.g. 3" required />
                </Field>
                <Field label="Preferred IT Role" full>
                  <select value={form.preferredRole} onChange={(e) => setForm((p) => ({ ...p, preferredRole: e.target.value }))} className="field" required disabled={!form.jobTitle}>
                    <option value="">{form.jobTitle ? 'Select a preferred IT role' : 'Select a job title first'}</option>
                    {preferredRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Skills (Optional)" full>
                  <SkillTags value={form.skills} onChange={(skills) => setForm((p) => ({ ...p, skills }))} placeholder="Type a skill and press Enter" />
                </Field>
              </Grid>
            </Section>

            <Section title="Education">
              <Grid>
                <Field label="Educational Attainment">
                  <select value={form.educationAttainment} onChange={(e) => setForm((p) => ({ ...p, educationAttainment: e.target.value, vocationalCourse: e.target.value === VOCATIONAL_EDUCATION_OPTION ? p.vocationalCourse : '', customEducationAttainment: e.target.value === OTHER_EDUCATION_OPTION ? p.customEducationAttainment : '' }))} className="field" required>
                    <option value="">Select educational attainment</option>
                    {EDUCATIONAL_ATTAINMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="School / University">
                  <select value={form.school} onChange={(e) => setForm((p) => ({ ...p, school: e.target.value, customSchool: e.target.value === OTHER_SCHOOL_OPTION ? p.customSchool : '' }))} className="field" required>
                    <option value="">Select a school or university</option>
                    {SCHOOL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                {requiresVocationalCourse ? (
                  <Field label="Specify Vocational Course">
                    <input value={form.vocationalCourse} onChange={(e) => setForm((p) => ({ ...p, vocationalCourse: e.target.value }))} className="field" placeholder="e.g. Computer Programming NC IV" required />
                  </Field>
                ) : null}
                {requiresCustomEducation ? (
                  <Field label="Specify Educational Attainment">
                    <input value={form.customEducationAttainment} onChange={(e) => setForm((p) => ({ ...p, customEducationAttainment: e.target.value }))} className="field" placeholder="Type your educational attainment" required />
                  </Field>
                ) : null}
                {requiresCustomSchool ? (
                  <Field label="Specify School / University">
                    <input value={form.customSchool} onChange={(e) => setForm((p) => ({ ...p, customSchool: e.target.value }))} className="field" placeholder="Type your school or university" required />
                  </Field>
                ) : null}
                <Field label="Certifications (Optional)" full>
                  <input value={form.certifications} onChange={(e) => setForm((p) => ({ ...p, certifications: e.target.value }))} className="field" placeholder="e.g. AWS CCP, Google UX" />
                </Field>
              </Grid>
            </Section>

            <Section title="Portfolio (Optional)">
              <div className="grid gap-4 md:grid-cols-2">
                <PortfolioCard title="GitHub" value={form.github} onChange={(github) => setForm((p) => ({ ...p, github }))} />
                <PortfolioCard title="Portfolio Website" value={form.portfolioWebsite} onChange={(portfolioWebsite) => setForm((p) => ({ ...p, portfolioWebsite }))} />
                <PortfolioCard title="LinkedIn" value={form.linkedin} onChange={(linkedin) => setForm((p) => ({ ...p, linkedin }))} />
                <PortfolioCard title="Other Links" description="Comma-separated URLs (optional)" value={form.otherLinks} onChange={(otherLinks) => setForm((p) => ({ ...p, otherLinks }))} />
              </div>
            </Section>

            <Section title="Work Preferences">
              <div className="grid gap-3 sm:grid-cols-3">
                {['remote', 'hybrid', 'on-site'].map((value) => {
                  const selected = form.workPreference === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, workPreference: value }))}
                      aria-pressed={selected}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.99] ${
                        selected
                          ? 'border-[#588157] bg-[#eef6ee] text-[#3a5a40] dark:border-[#3ba9d6] dark:bg-[#1e3a5f] dark:text-white'
                          : 'border-[#a3b18a] bg-[#f5f5f2] text-[#344e41] hover:bg-[#eef6ee] dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {value === 'on-site' ? 'On-site' : value.charAt(0).toUpperCase() + value.slice(1)}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="About Me">
              <textarea value={form.aboutMe} onChange={(e) => setForm((p) => ({ ...p, aboutMe: e.target.value }))} className="field min-h-28" placeholder="Short description about you, your work style, and what you're looking for. (Optional)" />
            </Section>

            <Section title="Resume (Optional)">
              <ResumeUploader value={form.resume} onChange={(resume) => setForm((p) => ({ ...p, resume }))} />
            </Section>

            <div className="flex items-center justify-end gap-3">
              <button type="submit" disabled={!isComplete || saving} className="rounded-xl bg-[#3a5a40] px-5 py-3 font-semibold text-white hover:bg-[#344e41] disabled:cursor-not-allowed disabled:opacity-60 dark:border dark:border-[#3ba9d6]/30 dark:bg-[#1e3a5f] dark:text-[#dcecff] dark:hover:bg-[#24496d]">
                {saving ? 'Saving...' : 'Save profile'}
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
        {Icon ? <Icon className="h-5 w-5 text-[#588157] dark:text-[#3ba9d6]" /> : null}
        <h2 className="text-lg font-bold text-[#2f3e2f] dark:text-white">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, full = false, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-sm font-semibold text-[#3a5a40] dark:text-slate-200">{label}</label>
      {children}
    </div>
  );
}
