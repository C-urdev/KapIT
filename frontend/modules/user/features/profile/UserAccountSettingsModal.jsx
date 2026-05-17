import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Briefcase, Save, UserCircle, X } from 'lucide-react';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import SkillTags from '@userComponents/developer/UserSkillTags';
import ResumeUploader from '@userComponents/developer/UserResumeUploader';
import { cleanPlaceName, loadProvinceCityData } from '@sharedUtils/philippinesLocations';
import { developerAPI } from '@userFeatures/developer/userDeveloperAPI';

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
const WORK_PREFERENCE_OPTIONS = ['remote', 'asynchronous-remote', 'hybrid', 'on-site'];
const WORK_PREFERENCE_LABELS = {
  remote: 'Remote',
  'asynchronous-remote': 'Asynchronous Remote',
  hybrid: 'Hybrid',
  'on-site': 'On-site',
};
const EMPTY_FORM = {
  profileImage: '',
  fullName: '',
  provinceCode: '',
  city: '',
  location: '',
  phoneNumber: '',
  email: '',
  jobTitle: '',
  yearsOfExperience: '',
  skills: [],
  preferredRole: '',
  educationAttainment: '',
  vocationalCourse: '',
  customEducationAttainment: '',
  school: '',
  customSchool: '',
  certifications: '',
  github: '',
  portfolioWebsite: '',
  linkedin: '',
  otherLinks: '',
  workPreference: 'remote',
  aboutMe: '',
  resume: '',
};
const PROFILE_CACHE_KEY = 'kapit_user_developer_profile';
const DEBUG_PROFILE_SYNC = process.env.NEXT_PUBLIC_DEBUG_PROFILE_SYNC === 'true';

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

const readProfileCache = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeProfileCache = (profile) => {
  if (typeof window === 'undefined') return;
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

const logProfileSync = (label, payload) => {
  if (!DEBUG_PROFILE_SYNC || typeof window === 'undefined') {
    return;
  }
  void label;
  void payload;
};

const deriveFormFromProfile = ({ user, profile }) => {
  const source = profile || {};
  const resolvedFullName = source.full_name || user?.fullName || user?.name || '';
  const resolvedLocation = source.location || user?.location || user?.address || '';
  const resolvedPhoneNumber = source.phone_number || user?.phoneNumber || user?.phone || '';
  const resolvedEmail = source.email || user?.email || '';
  const savedEducation = String(source.education || user?.education || '');
  const isSavedVocational = savedEducation.toLowerCase().startsWith(VOCATIONAL_EDUCATION_OPTION.toLowerCase());
  const savedVocationalCourse = isSavedVocational ? savedEducation.slice(VOCATIONAL_EDUCATION_OPTION.length).replace(/^\s*[-:]\s*/, '').trim() : '';
  const isSavedCustomEducation = Boolean(savedEducation) && !isSavedVocational && !EDUCATIONAL_ATTAINMENT_OPTIONS.includes(savedEducation);
  const savedSchool = String(source.school_university || user?.school || '');
  const isSavedCustomSchool = savedSchool && !SCHOOL_OPTIONS.includes(savedSchool);
  const savedJobTitle = String(source.job_title || user?.jobTitle || '');

  return {
    ...EMPTY_FORM,
    profileImage: source.profile_photo_url || user?.profileImage || '',
    fullName: String(resolvedFullName),
    location: String(resolvedLocation),
    phoneNumber: String(resolvedPhoneNumber),
    email: String(resolvedEmail),
    jobTitle: savedJobTitle,
    yearsOfExperience: source.experience_years == null ? '' : String(source.experience_years),
    skills: Array.isArray(source.skills) ? source.skills : Array.isArray(user?.skills) ? user.skills : [],
    preferredRole: source.preferred_it_role || user?.preferredRole || user?.desiredJob || '',
    educationAttainment: isSavedVocational ? VOCATIONAL_EDUCATION_OPTION : isSavedCustomEducation ? OTHER_EDUCATION_OPTION : savedEducation,
    vocationalCourse: savedVocationalCourse,
    customEducationAttainment: isSavedCustomEducation ? savedEducation : '',
    school: isSavedCustomSchool ? OTHER_SCHOOL_OPTION : savedSchool,
    customSchool: isSavedCustomSchool ? savedSchool : '',
    certifications: source.certifications || user?.certifications || '',
    github: source.github_link || user?.github || '',
    portfolioWebsite: source.portfolio_link || user?.portfolioWebsite || '',
    linkedin: source.linkedin_link || user?.linkedin || '',
    otherLinks: source.other_links || user?.otherLinks || '',
    workPreference: source.work_preference || user?.workPreference || 'remote',
    aboutMe: source.bio || user?.aboutMe || user?.bio || '',
    resume: source.resume_url || user?.resume || '',
  };
};

export default function UserAccountSettingsModal({ isOpen, user, onClose, onSave, mode = 'account', asPage = false }) {
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locationData, setLocationData] = useState({
    provinceOptions: [],
    provinceLabelByCode: {},
    provinceCodeByLabel: {},
    getCitiesForProvince: () => [],
  });
  const [cachedDeveloperProfile] = useState(() => readProfileCache());
  const [developerProfile, setDeveloperProfile] = useState(cachedDeveloperProfile);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const resolvedJobTitle = String(formData.jobTitle || '').trim();
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
  const cityOptions = useMemo(() => locationData.getCitiesForProvince(formData.provinceCode), [formData.provinceCode, locationData]);
  const requiresVocationalCourse = formData.educationAttainment === VOCATIONAL_EDUCATION_OPTION;
  const requiresCustomEducation = formData.educationAttainment === OTHER_EDUCATION_OPTION;
  const requiresCustomSchool = formData.school === OTHER_SCHOOL_OPTION;
  const showAccountSections = mode === 'account' || mode === 'all';
  const showCareerSections = mode === 'career' || mode === 'all';
  const headingTitle = mode === 'career' ? 'Career Preferences' : 'Account';
  const headingSubtitle =
    mode === 'career'
      ? 'Update your role, skills, education, socials, and work preference.'
      : 'Review your account location and contact details.';

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const nextForm = deriveFormFromProfile({ user, profile: developerProfile });
    setFormData(nextForm);
    logProfileSync('settings-form-init', {
      mode,
      profileLoaded: Boolean(developerProfile),
      form: nextForm,
    });
  }, [isOpen, user, mode, developerProfile]);

  useEffect(() => {
    let cancelled = false;

    const loadDeveloperProfile = async () => {
      if (!isOpen || user?.type === 'company') return;

      if (!developerProfile) {
        setProfileLoading(true);
      }

      try {
        const data = await developerAPI.getMyProfile();
        const responseProfile = data?.profile;
        const hasServerProfile = Boolean(responseProfile && typeof responseProfile === 'object');
        const nextProfile = hasServerProfile
          ? responseProfile
          : (developerProfile || cachedDeveloperProfile || null);
        logProfileSync('settings-fetch-profile-response', {
          profile: hasServerProfile ? responseProfile : null,
          warning: data?.warning || '',
          usingFallback: !hasServerProfile,
        });
        if (hasServerProfile) {
          writeProfileCache(nextProfile);
        }
        if (cancelled) return;
        setDeveloperProfile(nextProfile);
        const nextForm = deriveFormFromProfile({ user, profile: nextProfile });
        setFormData(nextForm);
        logProfileSync('settings-form-after-fetch', nextForm);
      } catch {
        if (cancelled) return;
        const fallback = cachedDeveloperProfile || null;
        logProfileSync('settings-fetch-profile-fallback', fallback);
        setDeveloperProfile(fallback);
        const nextForm = deriveFormFromProfile({ user, profile: fallback });
        setFormData(nextForm);
        logProfileSync('settings-form-after-fallback', nextForm);
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    void loadDeveloperProfile();

    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.type, user?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadLocations = async () => {
      if (!isOpen) return;
      const nextData = await loadProvinceCityData();
      if (!cancelled) {
        setLocationData(nextData);
      }
    };
    void loadLocations();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!locationData.provinceOptions.length) {
      return;
    }

    setFormData((prev) => {
      if (prev.provinceCode || prev.city) {
        return prev;
      }

      const nextLocation = parseLocation(prev.location, locationData.provinceOptions, locationData.provinceCodeByLabel, locationData.getCitiesForProvince);
      return {
        ...prev,
        provinceCode: nextLocation.provinceCode,
        city: nextLocation.city,
        location: formatLocation(nextLocation.city, nextLocation.provinceCode, locationData.provinceLabelByCode),
      };
    });
  }, [locationData]);

  useEffect(() => {
    if (!resolvedJobTitle) {
      if (formData.preferredRole) {
        setFormData((prev) => ({ ...prev, preferredRole: '' }));
      }
      return;
    }

    if (preferredRoleOptions.length && !preferredRoleOptions.includes(formData.preferredRole)) {
      setFormData((prev) => ({ ...prev, preferredRole: preferredRoleOptions[0] }));
    }
  }, [formData.preferredRole, preferredRoleOptions, resolvedJobTitle]);

  useEffect(() => {
    if (!locationData.provinceOptions.length) {
      return;
    }

    setFormData((prev) => {
      if (!prev.provinceCode) {
        return prev;
      }

      const nextCities = locationData.getCitiesForProvince(prev.provinceCode);
      const normalizedPrevCity = cleanPlaceName(prev.city || '').toLowerCase();
      const hasCity = nextCities.some((option) => cleanPlaceName(option.name || '').toLowerCase() === normalizedPrevCity);
      const nextCity = hasCity ? prev.city : '';
      return {
        ...prev,
        city: nextCity,
        location: formatLocation(nextCity, prev.provinceCode, locationData.provinceLabelByCode),
      };
    });
  }, [formData.provinceCode, locationData]);

  useEffect(() => {
    if (!locationData.provinceOptions.length) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      ...(prev.provinceCode
        ? { location: formatLocation(prev.city, prev.provinceCode, locationData.provinceLabelByCode) }
        : {}),
    }));
  }, [formData.city, locationData]);

  const isIdentityLocked = true;
  const lockedFullName = String(user?.fullName || user?.name || formData.fullName || '').trim();
  const lockedPhoneNumber = String(user?.phoneNumber || user?.phone || formData.phoneNumber || '').trim();
  const lockedEmail = String(user?.email || formData.email || '').trim();

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    setSaving(true);

    const educationAttainment = requiresVocationalCourse
      ? `${VOCATIONAL_EDUCATION_OPTION} - ${String(formData.vocationalCourse || '').trim()}`
      : requiresCustomEducation
        ? String(formData.customEducationAttainment || '').trim()
        : formData.educationAttainment;
    const school = requiresCustomSchool ? String(formData.customSchool || '').trim() : formData.school;

    const payload = {
      profileImage: formData.profileImage,
      fullName: lockedFullName || String(formData.fullName || '').trim(),
      username: String((lockedFullName || formData.fullName || '').trim()),
      location: formData.location,
      phoneNumber: lockedPhoneNumber || String(formData.phoneNumber || '').trim(),
      email: lockedEmail || String(formData.email || '').trim(),
      jobTitle: resolvedJobTitle,
      yearsOfExperience: formData.yearsOfExperience,
      skills: formData.skills,
      preferredRole: formData.preferredRole,
      educationAttainment,
      school,
      certifications: formData.certifications,
      github: formData.github,
      portfolioWebsite: formData.portfolioWebsite,
      linkedin: formData.linkedin,
      otherLinks: formData.otherLinks,
      workPreference: formData.workPreference,
      aboutMe: formData.aboutMe,
      resume: formData.resume,
    };

    try {
      logProfileSync('settings-save-payload', payload);
      const response = await developerAPI.saveProfile(payload);
      logProfileSync('settings-save-response', response);
      let persistedProfile = response?.profile && typeof response.profile === 'object' ? response.profile : null;
      if (!persistedProfile) {
        try {
          const refreshed = await developerAPI.getMyProfile();
          persistedProfile = refreshed?.profile && typeof refreshed.profile === 'object' ? refreshed.profile : null;
          logProfileSync('settings-save-profile-refetch', {
            profile: persistedProfile,
            warning: refreshed?.warning || '',
          });
        } catch {
          logProfileSync('settings-save-profile-refetch-failed', null);
        }
      }
      const nextUser = {
        ...(response?.user || {}),
        profileImage: response?.user?.profileImage || payload.profileImage,
        fullName: payload.fullName,
        name: payload.fullName,
        username: payload.username,
        location: payload.location,
        address: payload.location,
        phoneNumber: payload.phoneNumber,
        phone: payload.phoneNumber,
        jobTitle: payload.jobTitle,
        yearsOfExperience: payload.yearsOfExperience,
        skills: payload.skills,
        preferredRole: payload.preferredRole,
        desiredJob: payload.preferredRole || payload.jobTitle,
        educationAttainment,
        education: educationAttainment,
        school,
        certifications: payload.certifications,
        github: payload.github,
        portfolioWebsite: payload.portfolioWebsite,
        linkedin: payload.linkedin,
        otherLinks: payload.otherLinks,
        workPreference: payload.workPreference,
        aboutMe: payload.aboutMe,
        bio: payload.aboutMe,
        resume: payload.resume,
        profileCompleted: true,
      };
      const nextDeveloperProfile = {
        ...(developerProfile || {}),
        ...(persistedProfile || {}),
        full_name: payload.fullName,
        username: payload.username,
        location: payload.location,
        phone_number: payload.phoneNumber,
        email: payload.email,
        job_title: payload.jobTitle,
        experience_years: payload.yearsOfExperience === '' ? null : Number(payload.yearsOfExperience),
        skills: Array.isArray(payload.skills) ? payload.skills : [],
        preferred_it_role: payload.preferredRole,
        education: educationAttainment,
        bio: payload.aboutMe,
        github_link: payload.github || null,
        portfolio_link: payload.portfolioWebsite || null,
        linkedin_link: payload.linkedin || null,
        other_links: payload.otherLinks || null,
        work_preference: payload.workPreference || null,
        certifications: payload.certifications || null,
        school_university: school || null,
        resume_url: payload.resume || null,
        profile_photo_url: persistedProfile?.profile_photo_url || payload.profileImage || null,
      };
      setDeveloperProfile(nextDeveloperProfile);
      writeProfileCache(nextDeveloperProfile);
      setFormData(deriveFormFromProfile({ user: nextUser, profile: nextDeveloperProfile }));
      logProfileSync('settings-form-after-save', nextDeveloperProfile);
      onSave?.(nextUser);
      onClose?.();
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={asPage ? 'mx-auto w-full max-w-[min(100%,900px)] px-4 pb-16 pt-4 sm:px-5 sm:pb-8 sm:pt-6' : 'fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm min-[420px]:p-6'}>
      <div className={asPage ? 'flex w-full flex-col' : 'flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#f8fbf6] shadow-2xl dark:bg-[#121416]'}>
        {asPage ? (
          <div className="mb-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-[#9caf97] bg-[#d9ddcf] text-[#344e41] transition-colors hover:bg-[#dde2d4] hover:border-[#8ea488] dark:border-[#5e8b67] dark:bg-transparent dark:text-white dark:hover:bg-[#353c44]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="mt-3 text-[28px] font-bold text-[#1c2b1f] dark:text-white">{headingTitle}</h1>
          </div>
        ) : (
          <div className="flex shrink-0 items-center justify-between border-b border-[#d8e0cf] p-4 sm:p-5 dark:border-[#353c44]">
            <div>
              <h3 className="text-[19px] font-bold text-[#1c2b1f] dark:text-white">{headingTitle}</h3>
              <p className="mt-0.5 text-sm text-[#5f6f52] dark:text-[#d0d7dd]">{headingSubtitle}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10">
              <X className="h-5 w-5 text-[#344e41] dark:text-white/80" />
            </button>
          </div>
        )}

        <main className={`custom-scrollbar space-y-6 scroll-smooth ${asPage ? '' : 'flex-1 overflow-y-auto'} ${asPage ? '' : 'p-4 sm:p-5'}`}>
          {profileLoading ? <p className="text-sm text-[#5f6f52] dark:text-[#d0d7dd]">Loading profile...</p> : null}
          {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}

          {showAccountSections ? (
          <SettingsCard title="Account" icon={UserCircle} plain={asPage}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full Name">
                <input
                  value={formData.fullName}
                  onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                  readOnly={isIdentityLocked}
                  className={`field ${isIdentityLocked ? 'bg-[#edf3e8] dark:bg-[#2f343b]' : ''}`}
                />
              </Field>
              <Field label="Province">
                <SearchableSelect
                  value={formData.provinceCode}
                  onChange={(provinceCode) => setFormData((p) => ({ ...p, provinceCode }))}
                  options={locationData.provinceOptions.map((province) => ({ value: province.code, label: province.label }))}
                  placeholder="Select a province"
                  searchPlaceholder="Search provinces"
                  className="field"
                />
              </Field>
              <Field label="City / Municipality">
                <SearchableSelect
                  value={formData.city}
                  onChange={(city) => setFormData((p) => ({ ...p, city }))}
                  options={cityOptions.map((city) => ({ value: city.name, label: city.name }))}
                  placeholder={formData.provinceCode ? 'Select a city or municipality' : 'Select a province first'}
                  searchPlaceholder="Search cities"
                  disabled={!formData.provinceCode}
                  className="field"
                />
              </Field>
              <Field label="Phone Number">
                <input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData((p) => ({ ...p, phoneNumber: e.target.value }))}
                  readOnly={isIdentityLocked}
                  className={`field ${isIdentityLocked ? 'bg-[#edf3e8] dark:bg-[#2f343b]' : ''}`}
                />
              </Field>
              <Field label="Email">
                <input value={formData.email} readOnly className="field bg-[#edf3e8] dark:bg-[#2f343b]" />
              </Field>
            </div>
          </SettingsCard>
          ) : null}

          {showCareerSections ? (
          <SettingsCard title="Professional Details" icon={Briefcase} plain={asPage}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Job Title">
                <SearchableSelect
                  value={formData.jobTitle}
                  onChange={(jobTitle) => setFormData((p) => ({ ...p, jobTitle }))}
                  options={JOB_TITLES}
                  placeholder="Select a job title"
                  searchPlaceholder="Search job titles"
                  allowCustomValue
                  className="field"
                />
              </Field>
              <Field label="Years of Experience">
                <input type="number" min="0" max="60" value={formData.yearsOfExperience} onChange={(e) => setFormData((p) => ({ ...p, yearsOfExperience: e.target.value }))} className="field" />
              </Field>
              <Field label="Preferred IT Role" full>
                <SearchableSelect
                  value={formData.preferredRole}
                  onChange={(preferredRole) => setFormData((p) => ({ ...p, preferredRole }))}
                  options={preferredRoleOptions}
                  placeholder={resolvedJobTitle ? 'Select a preferred IT role' : 'Select a job title first'}
                  searchPlaceholder="Search roles"
                  disabled={!resolvedJobTitle}
                  className="field"
                />
              </Field>
              <Field label="Skills" full>
                <SkillTags value={formData.skills} onChange={(skills) => setFormData((p) => ({ ...p, skills }))} />
              </Field>
            </div>
          </SettingsCard>
          ) : null}

          {showCareerSections ? (
          <SettingsCard title="Education" icon={UserCircle} plain={asPage}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Educational Attainment">
                <SearchableSelect
                  value={formData.educationAttainment}
                  onChange={(educationAttainment) =>
                    setFormData((p) => ({
                      ...p,
                      educationAttainment,
                      vocationalCourse: educationAttainment === VOCATIONAL_EDUCATION_OPTION ? p.vocationalCourse : '',
                      customEducationAttainment: educationAttainment === OTHER_EDUCATION_OPTION ? p.customEducationAttainment : '',
                    }))
                  }
                  options={EDUCATIONAL_ATTAINMENT_OPTIONS}
                  placeholder="Select educational attainment"
                  searchPlaceholder="Search education"
                  className="field"
                />
              </Field>
              <Field label="School / University">
                <SearchableSelect
                  value={formData.school}
                  onChange={(school) => setFormData((p) => ({ ...p, school, customSchool: school === OTHER_SCHOOL_OPTION ? p.customSchool : '' }))}
                  options={SCHOOL_OPTIONS}
                  placeholder="Select a school or university"
                  searchPlaceholder="Search schools"
                  className="field"
                />
              </Field>
              {requiresVocationalCourse ? (
                <Field label="Specify Vocational Course">
                  <input value={formData.vocationalCourse} onChange={(e) => setFormData((p) => ({ ...p, vocationalCourse: e.target.value }))} className="field" />
                </Field>
              ) : null}
              {requiresCustomEducation ? (
                <Field label="Specify Educational Attainment">
                  <input value={formData.customEducationAttainment} onChange={(e) => setFormData((p) => ({ ...p, customEducationAttainment: e.target.value }))} className="field" />
                </Field>
              ) : null}
              {requiresCustomSchool ? (
                <Field label="Specify School / University">
                  <input value={formData.customSchool} onChange={(e) => setFormData((p) => ({ ...p, customSchool: e.target.value }))} className="field" />
                </Field>
              ) : null}
              <Field label="Certifications" full>
                <input value={formData.certifications} onChange={(e) => setFormData((p) => ({ ...p, certifications: e.target.value }))} className="field" />
              </Field>
            </div>
          </SettingsCard>
          ) : null}

          {showCareerSections ? (
          <SettingsCard title="Socials" icon={UserCircle} plain={asPage}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="GitHub">
                <input value={formData.github} onChange={(e) => setFormData((p) => ({ ...p, github: e.target.value }))} className="field" placeholder="https://" />
              </Field>
              <Field label="Portfolio Website">
                <input value={formData.portfolioWebsite} onChange={(e) => setFormData((p) => ({ ...p, portfolioWebsite: e.target.value }))} className="field" placeholder="https://" />
              </Field>
              <Field label="LinkedIn">
                <input value={formData.linkedin} onChange={(e) => setFormData((p) => ({ ...p, linkedin: e.target.value }))} className="field" placeholder="https://" />
              </Field>
              <Field label="Other Links">
                <input value={formData.otherLinks} onChange={(e) => setFormData((p) => ({ ...p, otherLinks: e.target.value }))} className="field" placeholder="https://" />
              </Field>
            </div>
          </SettingsCard>
          ) : null}

          {showCareerSections ? (
          <SettingsCard title="Work Preference" icon={UserCircle} plain={asPage}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {WORK_PREFERENCE_OPTIONS.map((value) => {
                const selected = formData.workPreference === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, workPreference: value }))}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold ${
                      selected
                        ? 'border-[#588157] bg-[#eef6ee] text-[#3a5a40] dark:border-[#6f9b74] dark:bg-[#353c44] dark:text-white'
                        : 'border-[#dce5d4] bg-[#f8fbf6] text-[#344e41] dark:border-[#3d454e] dark:bg-[#121416] dark:text-[#eceff2]'
                    }`}
                  >
                    {WORK_PREFERENCE_LABELS[value] || value}
                  </button>
                );
              })}
            </div>
          </SettingsCard>
          ) : null}

          {showCareerSections ? (
          <SettingsCard title="About and Resume" icon={UserCircle} plain={asPage}>
            <div className="grid grid-cols-1 gap-4">
              <Field label="About Me">
                <textarea
                  value={formData.aboutMe}
                  onChange={(e) => setFormData((p) => ({ ...p, aboutMe: e.target.value }))}
                  className="field min-h-24"
                  placeholder="Tell employers about your experience and strengths."
                />
              </Field>
              <Field label="Resume">
                <ResumeUploader
                  value={formData.resume}
                  onChange={(resume) => setFormData((p) => ({ ...p, resume }))}
                  onUpload={(file) => developerAPI.uploadResume(file)}
                />
              </Field>
            </div>
          </SettingsCard>
          ) : null}

        </main>

        <div className={`${asPage ? 'mt-3 flex justify-end' : 'flex shrink-0 items-center justify-end gap-3 border-t border-[#d8e0cf] bg-[#f2f7ef] p-4 dark:border-[#353c44] dark:bg-[#22272b]'}`}>
          {!asPage ? (
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2 font-semibold text-[#5f6f52] transition-colors hover:bg-black/5 dark:text-[#d0d7dd] dark:hover:bg-white/10">
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3a5a40] px-5 py-2 font-semibold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-60 dark:bg-[#6f9b74]"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, icon: Icon, children, plain = false }) {
  if (plain) {
    return (
      <section>
        <div className="mb-3 px-1 text-sm font-bold uppercase tracking-[0.08em] text-[#5f6f52] dark:text-[#b3bcc5]">
          {title}
        </div>
        {children}
      </section>
    );
  }

  return (
    <section className="pb-5">
      <div className="mb-4 flex items-center gap-2 border-b border-[#d8e0cf] pb-3 dark:border-[#274769]">
        <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#6f9b74]" />
        <h5 className="text-[15px] font-bold text-[#1c2b1f] dark:text-white">{title}</h5>
      </div>
      {children}
    </section>
  );
}

function Field({ label, full = false, children }) {
  return (
    <div className={`${full ? 'md:col-span-2' : ''} space-y-1`}>
      <label className="px-1 text-xs font-semibold text-[#5f6f52] dark:text-[#b3bcc5]">{label}</label>
      {children}
    </div>
  );
}
