import React, { useEffect, useId, useMemo, useState } from 'react';
import { ArrowLeft, Briefcase, LogOut, Moon, Sun, UserCircle2, ChevronDown, Check } from 'lucide-react';
import { useToast } from '@sharedComponents/ui/ToastProvider';
import ImageCropperModal from '@sharedComponents/modals/ImageCropperModal';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import SkillTags from '@userComponents/developer/UserSkillTags';
import PortfolioCard from '@userComponents/developer/UserPortfolioCard';
import ResumeUploader from '@userComponents/developer/UserResumeUploader';
import { developerAPI } from '@userFeatures/developer/userDeveloperAPI';
import { navigate } from '@companyFeatures/companyUtils';
import { readFileAsDataUrl, validateImageFile } from '@sharedUtils/imageUpload';
import { cleanPlaceName, loadProvinceCityData } from '@sharedUtils/philippinesLocations';

const JOB_TITLE_OPTIONS = {
  'Software Engineer': ['Application Developer', 'Software Engineer', 'Software Developer', 'Programmer Analyst'],
  'Software Developer': ['Application Developer', 'Desktop Application Developer', 'Systems Software Developer', 'Software Programmer'],
  'Application Developer': ['Web Application Developer', 'Mobile Application Developer', 'Enterprise Application Developer', 'API Developer'],
  'Frontend Developer': ['React Developer', 'Vue Developer', 'Angular Developer', 'UI Developer'],
  'Backend Developer': ['Node.js Backend Developer', 'Java Backend Developer', 'PHP Backend Developer', 'Python Backend Developer'],
  'Full Stack Developer': ['MERN Stack Developer', 'MEAN Stack Developer', 'JavaScript Full Stack Developer', 'Web Application Developer'],
  'Web Developer': ['Front-End Web Developer', 'Back-End Web Developer', 'Full-Stack Web Developer', 'WordPress Developer'],
  'Mobile Developer': ['Android Developer', 'iOS Developer', 'React Native Developer', 'Flutter Developer'],
  'Game Developer': ['Gameplay Programmer', 'Game Engine Developer', 'Unity Developer', 'Unreal Developer'],
  'Embedded Systems Engineer': ['Firmware Engineer', 'IoT Developer', 'Embedded Software Engineer', 'Robotics Software Engineer'],
  'QA Engineer': ['Manual QA Tester', 'Automation QA Engineer', 'Software Test Engineer', 'Performance Tester'],
  'Test Engineer': ['SDET', 'Test Automation Engineer', 'Integration Test Engineer', 'Quality Engineer'],
  'UI/UX Designer': ['Product Designer', 'UX Designer', 'UI Designer', 'Interaction Designer'],
  'Product Manager': ['Technical Product Manager', 'Product Owner', 'Associate Product Manager', 'Growth Product Manager'],
  'Project Manager': ['IT Project Manager', 'Agile Project Manager', 'Scrum Master', 'Program Manager'],
  'Business Analyst': ['IT Business Analyst', 'Systems Analyst', 'Business Systems Analyst', 'Requirements Analyst'],
  'Systems Analyst': ['Functional Analyst', 'Technical Analyst', 'Application Analyst', 'Process Analyst'],
  'Solutions Architect': ['Enterprise Architect', 'Application Architect', 'Cloud Solutions Architect', 'Technical Architect'],
  'DevOps Engineer': ['Cloud Engineer', 'Site Reliability Engineer', 'Platform Engineer', 'CI/CD Engineer'],
  'Cloud Engineer': ['AWS Cloud Engineer', 'Azure Cloud Engineer', 'Google Cloud Engineer', 'Cloud Operations Engineer'],
  'Site Reliability Engineer': ['Reliability Engineer', 'Production Engineer', 'Infrastructure Reliability Engineer', 'Operations Engineer'],
  'Database Administrator': ['SQL Database Administrator', 'NoSQL Database Administrator', 'Database Engineer', 'Data Platform Administrator'],
  'Data Engineer': ['ETL Developer', 'Analytics Engineer', 'Big Data Engineer', 'Data Platform Engineer'],
  'Data Analyst': ['Business Intelligence Analyst', 'Reporting Analyst', 'Product Analyst', 'Data Visualization Analyst'],
  'Data Scientist': ['Machine Learning Scientist', 'Applied Data Scientist', 'AI Research Engineer', 'Quantitative Analyst'],
  'Machine Learning Engineer': ['AI Engineer', 'NLP Engineer', 'Computer Vision Engineer', 'MLOps Engineer'],
  'AI Engineer': ['Generative AI Engineer', 'LLM Engineer', 'Prompt Engineer', 'Applied AI Engineer'],
  'MLOps Engineer': ['ML Platform Engineer', 'Model Deployment Engineer', 'ML Infrastructure Engineer', 'AI Operations Engineer'],
  'Cybersecurity Specialist': ['Security Analyst', 'SOC Analyst', 'Security Engineer', 'Penetration Tester'],
  'Security Engineer': ['Application Security Engineer', 'Cloud Security Engineer', 'Network Security Engineer', 'Identity and Access Engineer'],
  'Network Engineer': ['Network Administrator', 'Network Operations Engineer', 'Infrastructure Engineer', 'Network Security Engineer'],
  'Systems Administrator': ['Server Administrator', 'Linux Administrator', 'Windows Administrator', 'Infrastructure Administrator'],
  'IT Support Specialist': ['Help Desk Specialist', 'Technical Support Engineer', 'System Support Specialist', 'Desktop Support Engineer'],
  'Technical Writer': ['API Documentation Writer', 'Software Documentation Specialist', 'Knowledge Base Writer', 'Developer Documentation Writer'],
  'ERP/CRM Developer': ['SAP Developer', 'Salesforce Developer', 'Dynamics 365 Developer', 'Oracle ERP Developer'],
  'Blockchain Developer': ['Smart Contract Developer', 'Web3 Developer', 'Blockchain Engineer', 'DApp Developer'],
  'AR/VR Developer': ['XR Developer', 'AR Engineer', 'VR Engineer', 'Spatial Computing Developer'],
  'Tech Lead': ['Frontend Tech Lead', 'Backend Tech Lead', 'Full Stack Tech Lead', 'Software Development Lead'],
  'Engineering Manager': ['Software Engineering Manager', 'Development Manager', 'Platform Engineering Manager', 'Technical Manager'],
  'IT Consultant': ['Technology Consultant', 'Digital Transformation Consultant', 'Solution Consultant', 'Implementation Consultant'],
};
const OTHER_JOB_TITLE_OPTION = 'Other';
const BASE_JOB_TITLES = Object.keys(JOB_TITLE_OPTIONS);
const JOB_TITLES = [...BASE_JOB_TITLES, OTHER_JOB_TITLE_OPTION];
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
const WORK_PREFERENCE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'asynchronous-remote', label: 'Asynchronous Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' },
];
const parseLocation = (rawLocation, provinceOptions, provinceCodeByLabel, getCitiesForProvince) => {
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

const formatLocation = (city, provinceCode, provinceLabelByCode) => {
  const provinceLabel = provinceLabelByCode[provinceCode] || '';
  if (!city || !provinceLabel) {
    return '';
  }
  return `${city}, ${provinceLabel}, Philippines`;
};

export default function DeveloperProfileOnboardingPage({ user, onSubmit, onLogout }) {
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const profileImageInputId = useId();
  const [locationData, setLocationData] = useState({
    provinceOptions: [],
    provinceLabelByCode: {},
    provinceCodeByLabel: {},
    getCitiesForProvince: () => [],
  });
  const savedEducation = String(user?.educationAttainment || user?.education || '');
  const isSavedVocational = savedEducation.toLowerCase().startsWith(VOCATIONAL_EDUCATION_OPTION.toLowerCase());
  const savedVocationalCourse = isSavedVocational ? savedEducation.slice(VOCATIONAL_EDUCATION_OPTION.length).replace(/^\s*[-:]\s*/, '').trim() : '';
  const isSavedCustomEducation = Boolean(savedEducation) && !isSavedVocational && !EDUCATIONAL_ATTAINMENT_OPTIONS.includes(savedEducation);
  const savedSchool = String(user?.school || '');
  const isSavedCustomSchool = savedSchool && !SCHOOL_OPTIONS.includes(savedSchool);
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [rawProfileImage, setRawProfileImage] = useState('');
  const [cropOpen, setCropOpen] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    profileImage: user?.profileImage || '',
    fullName: user?.fullName || user?.name || '',
    provinceCode: '',
    city: '',
    location: String(user?.location || user?.address || ''),
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

  const resolvedJobTitle = String(form.jobTitle || '').trim();
  const preferredRoleOptions = useMemo(() => {
    const mappedOptions = JOB_TITLE_OPTIONS[resolvedJobTitle];
    if (Array.isArray(mappedOptions) && mappedOptions.length) {
      return mappedOptions;
    }
    if (resolvedJobTitle) {
      return [resolvedJobTitle];
    }
    return [];
  }, [resolvedJobTitle]);
  const cityOptions = useMemo(() => locationData.getCitiesForProvince(form.provinceCode), [form.provinceCode, locationData]);
  const requiresVocationalCourse = form.educationAttainment === VOCATIONAL_EDUCATION_OPTION;
  const requiresCustomEducation = form.educationAttainment === OTHER_EDUCATION_OPTION;
  const requiresCustomSchool = form.school === OTHER_SCHOOL_OPTION;

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
        user?.location || user?.address || '',
        locationData.provinceOptions,
        locationData.provinceCodeByLabel,
        locationData.getCitiesForProvince
      );

      return {
        ...prev,
        provinceCode: nextLocation.provinceCode,
        city: nextLocation.city,
        location: formatLocation(nextLocation.city, nextLocation.provinceCode, locationData.provinceLabelByCode),
      };
    });
  }, [locationData, user]);

  useEffect(() => {
    if (!resolvedJobTitle) {
      if (form.preferredRole) {
        setForm((prev) => ({ ...prev, preferredRole: '' }));
      }
      return;
    }

    if (preferredRoleOptions.length && !preferredRoleOptions.includes(form.preferredRole)) {
      setForm((prev) => ({ ...prev, preferredRole: preferredRoleOptions[0] }));
    }
  }, [form.preferredRole, preferredRoleOptions, resolvedJobTitle]);

  useEffect(() => {
    setForm((prev) => {
      const nextCities = locationData.getCitiesForProvince(prev.provinceCode);
      const hasCity = nextCities.some((option) => option.name === prev.city);
      const nextCity = hasCity ? prev.city : '';
      return {
        ...prev,
        city: nextCity,
        location: formatLocation(nextCity, prev.provinceCode, locationData.provinceLabelByCode),
      };
    });
  }, [form.provinceCode, locationData]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      location: formatLocation(prev.city, prev.provinceCode, locationData.provinceLabelByCode),
    }));
  }, [form.city, locationData]);

  const isComplete = useMemo(() => {
    return Boolean(
      String(form.fullName).trim() &&
        String(form.location).trim() &&
        String(form.phoneNumber).trim() &&
        String(form.email).trim() &&
        String(resolvedJobTitle).trim() &&
        String(form.yearsOfExperience).trim() &&
        Array.isArray(form.skills) &&
        form.skills.length > 0 &&
        String(form.preferredRole).trim() &&
        String(form.educationAttainment).trim() &&
        (!requiresVocationalCourse || String(form.vocationalCourse).trim()) &&
        (!requiresCustomEducation || String(form.customEducationAttainment).trim()) &&
        String(form.school).trim() &&
        (!requiresCustomSchool || String(form.customSchool).trim())
    );
  }, [form, requiresCustomEducation, requiresCustomSchool, requiresVocationalCourse, resolvedJobTitle]);

  const missing = useMemo(
    () => ({
      fullName: !String(form.fullName).trim(),
      provinceCode: !String(form.provinceCode).trim(),
      city: !String(form.city).trim(),
      phoneNumber: !String(form.phoneNumber).trim(),
      jobTitle: !String(resolvedJobTitle).trim(),
      yearsOfExperience: !String(form.yearsOfExperience).trim(),
      skills: !Array.isArray(form.skills) || form.skills.length === 0,
      preferredRole: !String(form.preferredRole).trim(),
      educationAttainment: !String(form.educationAttainment).trim(),
      vocationalCourse: requiresVocationalCourse && !String(form.vocationalCourse).trim(),
      customEducationAttainment: requiresCustomEducation && !String(form.customEducationAttainment).trim(),
      school: !String(form.school).trim(),
      customSchool: requiresCustomSchool && !String(form.customSchool).trim(),
      aboutMe: !String(form.aboutMe).trim(),
    }),
    [form, requiresCustomEducation, requiresCustomSchool, requiresVocationalCourse, resolvedJobTitle]
  );

  const sectionInvalid = useMemo(
    () => ({
      basic: missing.fullName || missing.provinceCode || missing.city || missing.phoneNumber,
      professional: missing.jobTitle || missing.yearsOfExperience || missing.skills || missing.preferredRole,
      education:
        missing.educationAttainment ||
        missing.vocationalCourse ||
        missing.customEducationAttainment ||
        missing.school ||
        missing.customSchool,
      about: missing.aboutMe,
    }),
    [missing]
  );

  const stepComplete = useMemo(() => {
    if (step === 0) {
      return !missing.fullName && !missing.provinceCode && !missing.city && !missing.phoneNumber;
    }
    if (step === 1) {
      return (
        !missing.jobTitle &&
        !missing.yearsOfExperience &&
        !missing.skills &&
        !missing.preferredRole &&
        !missing.educationAttainment &&
        !missing.vocationalCourse &&
        !missing.customEducationAttainment &&
        !missing.school &&
        !missing.customSchool
      );
    }
    return true;
  }, [step, missing]);

  const onPickPhoto = async (file) => {
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.ok) {
      toast.warning(validation.message);
      return;
    }
    try {
      setPhotoLoading(true);
      const dataUrl = await readFileAsDataUrl(file);
      setRawProfileImage(dataUrl);
      setCropOpen(true);
    } catch (error) {
      toast.error(error?.message || 'Failed to read image. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleConfirmCrop = async (croppedDataUrl) => {
    setCropOpen(false);
    setRawProfileImage('');

    if (!croppedDataUrl) return;

    // Try uploading the cropped image to Cloudflare R2.
    try {
      setPhotoLoading(true);

      // Convert Base64 data URL → File blob for upload.
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'profile.jpg', { type: blob.type || 'image/jpeg' });

      const result = await developerAPI.uploadProfileImage(file);
      const imageUrl = result?.profileImageUrl || croppedDataUrl;

      setForm((prev) => ({ ...prev, profileImage: imageUrl }));
      toast.success('Profile photo uploaded successfully.');
    } catch {
      // If R2 upload fails (e.g. R2 not configured on localhost), fall back to Base64.
      setForm((prev) => ({ ...prev, profileImage: croppedDataUrl }));
      toast.success('Profile photo cropped successfully.');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!isComplete) {
      setSubmitAttempted(true);
      toast.warning('Please fill in the highlighted required fields.');
      return;
    }
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
        username: String(form.fullName || '').trim(),
        location: form.location,
        phoneNumber: form.phoneNumber,
        email: form.email,
        jobTitle: resolvedJobTitle,
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
    } catch (error) {
      const status = Number(error?.status || 0);
      const message = String(error?.message || '').trim();
      if (status === 400) {
        setSubmitAttempted(true);
        toast.warning(message || 'Please fill in the required fields.');
        return;
      }
      if (status === 401) {
        toast.error('Your session expired. Please log in again.');
        return;
      }
      toast.error(message || 'Unable to save your profile right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-onboarding min-h-screen bg-[#f5f5f2] text-[#2f3e2f] dark:bg-[#121416] dark:text-zinc-100 selection:bg-[#a3b18a]/30 dark:selection:bg-[#a3b18a]/30">
      <header className="sticky top-0 z-30 border-b border-[#a3b18a]/40 bg-white/80 backdrop-blur-xl dark:border-[#353c44] dark:bg-[#121416]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-[#588157] hover:text-[#3a5a40] dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="inline-flex items-center gap-3">
              <KapITLogo className="h-9 w-9 rounded-lg object-contain bg-white" />
              <span className="text-xl font-bold tracking-tight text-[#2f3e2f] dark:text-white">KapIT</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full p-2.5 transition-colors hover:bg-[#eef6ee] dark:hover:bg-[#353c44]"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5 text-[#3a5a40]" /> : <Sun className="h-5 w-5 text-white" />}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:border-red-800 dark:bg-[#1a1d20] dark:text-red-400 dark:hover:bg-red-950/50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-3xl border border-[#a3b18a]/40 bg-white p-6 shadow-sm dark:border-[#353c44] dark:bg-[#22272b] sm:p-10">
          <StepIndicator step={step} />

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-8">
            <div className="transition-all duration-300">
              {step === 0 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                  <Section title="Profile Picture (Optional)" icon={UserCircle2}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#a3b18a]/40 bg-[#f5f5f2] shadow-sm dark:border-[#444d57] dark:bg-[#1a1d20]">
                        {form.profileImage ? (
                          <img src={form.profileImage} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-[#588157]/70 dark:text-slate-500">No photo</span>
                        )}
                      </div>
                      <div>
                        <input
                          id={profileImageInputId}
                          type="file"
                          accept="image/*"
                          onChange={(e) => onPickPhoto(e.target.files?.[0] || null)}
                          className="sr-only"
                        />
                        <label
                          htmlFor={profileImageInputId}
                          className="inline-flex cursor-pointer items-center rounded-full border border-[#a3b18a]/60 bg-[#eef6ee] px-4 py-2 text-sm font-medium text-[#3a5a40] shadow-sm transition-all hover:bg-[#e3eee3] focus:outline-none focus:ring-2 focus:ring-[#588157] focus:ring-offset-2 dark:border-[#444d57] dark:bg-[#353c44] dark:text-[#d0d7dd] dark:hover:bg-[#4a535d] dark:focus:ring-offset-[#22272b]"
                        >
                          Upload
                        </label>
                        {photoLoading ? (
                          <p className="mt-2 text-xs font-medium text-[#588157]/70 dark:text-slate-400">Preparing image...</p>
                        ) : null}
                        <p className="mt-2 text-xs text-[#588157]/70 dark:text-slate-400">JPG/PNG recommended.</p>
                      </div>
                    </div>
                  </Section>

                  <Section title="Basic Information" invalid={submitAttempted && sectionInvalid.basic}>
                    <Grid>
                      <Field label="Full Name (First name, M.I., Last name)" required invalid={submitAttempted && missing.fullName}>
                        <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} className={`field ${submitAttempted && missing.fullName ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`} placeholder="e.g. Juan D. Dela Cruz" title="Enter your full name in this format: First name, middle initial, last name." />
                      </Field>
                      <Field label="Province" required invalid={submitAttempted && missing.provinceCode}>
                        <SearchableSelect
                          value={form.provinceCode}
                          onChange={(provinceCode) => setForm((p) => ({ ...p, provinceCode }))}
                          options={locationData.provinceOptions.map((province) => ({ value: province.code, label: province.label }))}
                          placeholder="Select a province"
                          searchPlaceholder="Search provinces"
                          className={`field ${submitAttempted && missing.provinceCode ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                        />
                      </Field>
                      <Field label="City / Municipality" required invalid={submitAttempted && missing.city}>
                        <SearchableSelect
                          value={form.city}
                          onChange={(city) => setForm((p) => ({ ...p, city }))}
                          options={cityOptions.map((city) => ({ value: city.name, label: city.name }))}
                          placeholder={form.provinceCode ? 'Select a city or municipality' : 'Select a province first'}
                          searchPlaceholder="Search cities"
                          disabled={!form.provinceCode}
                          className={`field ${submitAttempted && missing.city ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                        />
                      </Field>
                      <Field label="Country">
                        <input value="Philippines" readOnly className="field bg-[#f5f5f2]/50 text-[#588157] dark:bg-[#1a1d20]/60 dark:text-slate-400 cursor-not-allowed" />
                      </Field>
                      <Field label="Phone Number" required invalid={submitAttempted && missing.phoneNumber}>
                        <input value={form.phoneNumber} onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))} className={`field ${submitAttempted && missing.phoneNumber ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`} placeholder="e.g. +63 9xx xxx xxxx" />
                      </Field>
                      <Field label="Email" required>
                        <input value={form.email} readOnly className="field bg-[#f5f5f2]/50 text-[#588157] dark:bg-[#1a1d20]/60 dark:text-slate-400 cursor-not-allowed" />
                      </Field>
                    </Grid>
                  </Section>
                </div>
              )}

              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                  <Section title="Professional Details" invalid={submitAttempted && sectionInvalid.professional}>
                    <Grid>
                      <Field label="Job Title" required invalid={submitAttempted && missing.jobTitle}>
                        <SearchableSelect
                          value={form.jobTitle}
                          onChange={(jobTitle) => setForm((p) => ({ ...p, jobTitle }))}
                          options={JOB_TITLES}
                          placeholder="Select a job title"
                          searchPlaceholder="Search job titles"
                          allowCustomValue
                          className={`field ${submitAttempted && missing.jobTitle ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                        />
                      </Field>
                      <Field label="Years of Experience" required invalid={submitAttempted && missing.yearsOfExperience}>
                        <input type="number" min="0" max="60" value={form.yearsOfExperience} onChange={(e) => setForm((p) => ({ ...p, yearsOfExperience: e.target.value }))} className={`field ${submitAttempted && missing.yearsOfExperience ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`} placeholder="e.g. 3" />
                      </Field>
                      <Field label="Preferred IT Role" full required invalid={submitAttempted && missing.preferredRole}>
                        <SearchableSelect
                          value={form.preferredRole}
                          onChange={(preferredRole) => setForm((p) => ({ ...p, preferredRole }))}
                          options={preferredRoleOptions}
                          placeholder={resolvedJobTitle ? 'Select a preferred IT role' : 'Select a job title first'}
                          searchPlaceholder="Search roles"
                          disabled={!resolvedJobTitle}
                          className={`field ${submitAttempted && missing.preferredRole ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                        />
                      </Field>
                      <Field label="Skills" full required invalid={submitAttempted && missing.skills}>
                        <SkillTags
                          value={form.skills}
                          onChange={(skills) => setForm((p) => ({ ...p, skills }))}
                          placeholder="Type a skill and press Enter"
                          className={`field ${submitAttempted && missing.skills ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                        />
                      </Field>
                    </Grid>
                  </Section>

                  <Section title="Education" invalid={submitAttempted && sectionInvalid.education}>
                    <Grid>
                      <Field label="Educational Attainment" required invalid={submitAttempted && missing.educationAttainment}>
                        <SearchableSelect
                          value={form.educationAttainment}
                          onChange={(educationAttainment) =>
                            setForm((p) => ({
                              ...p,
                              educationAttainment,
                              vocationalCourse: educationAttainment === VOCATIONAL_EDUCATION_OPTION ? p.vocationalCourse : '',
                              customEducationAttainment: educationAttainment === OTHER_EDUCATION_OPTION ? p.customEducationAttainment : '',
                            }))
                          }
                          options={EDUCATIONAL_ATTAINMENT_OPTIONS}
                          placeholder="Select educational attainment"
                          searchPlaceholder="Search education"
                          className={`field ${submitAttempted && missing.educationAttainment ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                        />
                      </Field>
                      <Field label="School / University" required invalid={submitAttempted && missing.school}>
                        <SearchableSelect
                          value={form.school}
                          onChange={(school) =>
                            setForm((p) => ({
                              ...p,
                              school,
                              customSchool: school === OTHER_SCHOOL_OPTION ? p.customSchool : '',
                            }))
                          }
                          options={SCHOOL_OPTIONS}
                          placeholder="Select a school or university"
                          searchPlaceholder="Search schools"
                          className={`field ${submitAttempted && missing.school ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`}
                        />
                      </Field>
                      {requiresVocationalCourse ? (
                        <Field label="Specify Vocational Course" required invalid={submitAttempted && missing.vocationalCourse}>
                          <input value={form.vocationalCourse} onChange={(e) => setForm((p) => ({ ...p, vocationalCourse: e.target.value }))} className={`field ${submitAttempted && missing.vocationalCourse ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`} placeholder="e.g. Computer Programming NC IV" />
                        </Field>
                      ) : null}
                      {requiresCustomEducation ? (
                        <Field label="Specify Educational Attainment" required invalid={submitAttempted && missing.customEducationAttainment}>
                          <input value={form.customEducationAttainment} onChange={(e) => setForm((p) => ({ ...p, customEducationAttainment: e.target.value }))} className={`field ${submitAttempted && missing.customEducationAttainment ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`} placeholder="Type your educational attainment" />
                        </Field>
                      ) : null}
                      {requiresCustomSchool ? (
                        <Field label="Specify School / University" required invalid={submitAttempted && missing.customSchool}>
                          <input value={form.customSchool} onChange={(e) => setForm((p) => ({ ...p, customSchool: e.target.value }))} className={`field ${submitAttempted && missing.customSchool ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`} placeholder="Type your school or university" />
                        </Field>
                      ) : null}
                    </Grid>
                  </Section>

                  <CollapsibleSection title="Add certifications (Optional)">
                    <Field full>
                      <input value={form.certifications} onChange={(e) => setForm((p) => ({ ...p, certifications: e.target.value }))} className="field" placeholder="e.g. AWS CCP, Google UX" />
                    </Field>
                  </CollapsibleSection>
                </div>
              )}

              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
                  <Section title="Work Preferences">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {WORK_PREFERENCE_OPTIONS.map((option) => {
                        const selected = form.workPreference === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, workPreference: option.value }))}
                            aria-pressed={selected}
                            className={`rounded-xl border px-5 py-4 text-sm font-medium transition-all active:scale-[0.98] ${
                              selected
                                ? 'border-[#588157] bg-[#588157] text-white shadow-md dark:border-[#6f9b74] dark:bg-[#6f9b74] dark:text-white'
                                : 'border-[#a3b18a]/50 bg-white text-[#344e41] hover:border-[#a3b18a] hover:bg-[#eef6ee]/50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </Section>

                  <Section title="About Me" invalid={submitAttempted && sectionInvalid.about}>
                    <textarea value={form.aboutMe} onChange={(e) => setForm((p) => ({ ...p, aboutMe: e.target.value }))} className={`field min-h-28 ${submitAttempted && missing.aboutMe ? '!border-red-500 !focus:ring-red-500 !focus:border-red-500' : ''}`} placeholder="Short description about you, your work style, and what you're looking for." />
                  </Section>

                  <CollapsibleSection title="Add socials (Optional)">
                    <div className="grid gap-4 md:grid-cols-2">
                      <PortfolioCard title="GitHub" value={form.github} onChange={(github) => setForm((p) => ({ ...p, github }))} />
                      <PortfolioCard title="Portfolio Website" value={form.portfolioWebsite} onChange={(portfolioWebsite) => setForm((p) => ({ ...p, portfolioWebsite }))} />
                      <PortfolioCard title="LinkedIn" value={form.linkedin} onChange={(linkedin) => setForm((p) => ({ ...p, linkedin }))} />
                      <PortfolioCard title="Other Links" value={form.otherLinks} onChange={(otherLinks) => setForm((p) => ({ ...p, otherLinks }))} />
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection title="Upload resume (Optional)">
                    <ResumeUploader
                      value={form.resume}
                      onChange={(resume) => setForm((p) => ({ ...p, resume }))}
                      onUpload={(file) => developerAPI.uploadResume(file)}
                    />
                  </CollapsibleSection>
                </div>
              )}
            </div>

            <StepNav
              step={step}
              setStep={setStep}
              canContinue={stepComplete}
              saving={saving}
              setSubmitAttempted={setSubmitAttempted}
            />
          </form>
        </div>
      </main>

      <ImageCropperModal
        isOpen={cropOpen}
        imageSrc={rawProfileImage}
        title="Crop profile photo"
        confirmLabel="Use cropped photo"
        onClose={() => {
          setCropOpen(false);
          setRawProfileImage('');
        }}
        onConfirm={handleConfirmCrop}
      />
    </div>
  );
}

function Section({ title, icon: Icon, children, invalid: _invalid = false }) {
  return (
    <section>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 text-[#588157]/80 dark:text-[#6f9b74]" /> : null}
        <h2 className="text-lg font-semibold tracking-tight text-[#2f3e2f] dark:text-white">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, full = false, required = false, invalid = false, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className={`mb-1.5 block text-sm font-medium ${invalid ? 'text-red-600 dark:text-red-400' : 'text-[#344e41] dark:text-slate-200'}`}>
        {label}
        {required ? <span className="ml-1 text-red-600 dark:text-red-400">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function StepIndicator({ step }) {
  const steps = ['Personal info', 'Experience', 'Almost done'];

  return (
    <div className="mb-10 w-full px-2 sm:px-10">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-full bg-[#a3b18a]/30 dark:bg-slate-700/50 z-0 rounded-full"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#588157] dark:bg-[#6f9b74] z-0 transition-all duration-500 ease-in-out rounded-full" style={{ width: `${(step / (steps.length - 1)) * 100}%` }}></div>
        
        {steps.map((label, idx) => {
          const isActive = step === idx;
          const isPast = step > idx;
          
          return (
            <div key={label} className="relative z-10 flex flex-col items-center">
              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border-[2.5px] transition-all duration-500 ${
                isActive ? 'border-[#588157] bg-white text-[#588157] dark:border-[#6f9b74] dark:bg-[#22272b] dark:text-[#6f9b74] shadow-sm ring-4 ring-[#eef6ee] dark:ring-[#2a3036]' 
                : isPast ? 'border-[#588157] bg-[#588157] text-white dark:border-[#6f9b74] dark:bg-[#6f9b74]' 
                : 'border-[#a3b18a]/50 bg-white text-transparent dark:border-slate-600 dark:bg-[#22272b]'
              }`}>
                {isPast ? <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} /> : <div className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all duration-500 ${isActive ? 'bg-[#588157] dark:bg-[#6f9b74] scale-100' : 'bg-transparent scale-0'}`} />}
              </div>
              <span className={`absolute top-12 w-32 text-center text-xs font-semibold tracking-wide transition-colors duration-500 hidden sm:block ${
                isActive ? 'text-[#344e41] dark:text-slate-200'
                : isPast ? 'text-[#588157] dark:text-[#6f9b74]' 
                : 'text-[#a3b18a] dark:text-slate-500'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepNav({ step, setStep, canContinue, saving, setSubmitAttempted }) {
  const onNext = () => {
    if (!canContinue) {
      setSubmitAttempted(true);
      return;
    }
    setSubmitAttempted(false);
    setStep((s) => s + 1);
  };

  const onBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="mt-10 flex items-center justify-between border-t border-[#a3b18a]/20 dark:border-slate-700/50 pt-8 pb-2">
      {step > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-full px-6 py-2.5 text-sm font-semibold text-[#588157] transition-all hover:bg-[#eef6ee] active:scale-[0.98] dark:text-[#a0c1a4] dark:hover:bg-[#2a3036]"
        >
          ← Back
        </button>
      ) : (
        <div /> 
      )}

      {step < 2 ? (
        <button
          type="button"
          onClick={onNext}
          className={`rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#588157] focus:ring-offset-2 active:scale-[0.98] dark:focus:ring-offset-[#22272b] ${
            canContinue
              ? 'bg-[#588157] hover:bg-[#4a6d49] hover:shadow-md dark:bg-[#588157] dark:hover:bg-[#4a6d49]'
              : 'bg-[#a3b18a] opacity-60 dark:bg-slate-600'
          }`}
        >
          Continue →
        </button>
      ) : (
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#3a5a40] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#2f4833] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#588157] focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#6f9b74] dark:text-white dark:hover:bg-[#5f8a68] dark:focus:ring-offset-[#22272b]"
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      )}
    </div>
  );
}

function CollapsibleSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`rounded-2xl border bg-white p-1 dark:bg-[#1a1d20]/80 transition-all duration-300 ${isOpen ? 'border-[#a3b18a]/40 shadow-sm dark:border-slate-600/50' : 'border-[#a3b18a]/20 hover:border-[#a3b18a]/40 dark:border-slate-700/50 dark:hover:border-slate-600/50'}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl px-5 py-4 text-left text-[15px] font-semibold text-[#344e41] hover:bg-[#eef6ee]/50 dark:text-slate-200 dark:hover:bg-[#2a3036]/40 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown className={`h-5 w-5 text-[#588157] dark:text-[#6f9b74] transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
