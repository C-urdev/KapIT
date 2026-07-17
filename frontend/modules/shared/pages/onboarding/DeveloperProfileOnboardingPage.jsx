import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  Cloud,
  Code2,
  Cpu,
  Crown,
  Database,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  HouseWifi,
  Laptop,
  LogOut,
  Medal,
  Moon,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sprout,
  Sun,
  TrendingUp,
  UserRound,
  UsersRound,
  Wifi,
  Wrench,
} from 'lucide-react';
import { useToast } from '@sharedComponents/ui/ToastProvider';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import SkillTags from '@userComponents/developer/UserSkillTags';
import ResumeUploader from '@userComponents/developer/UserResumeUploader';
import { developerAPI } from '@userFeatures/developer/userDeveloperAPI';
import { navigate } from '@companyFeatures/companyUtils';

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

const ROLE_CATEGORY_OPTIONS = [
  {
    value: 'software-engineering',
    label: 'Software Engineering',
    icon: Code2,
    roles: ['Backend Engineer', 'Frontend Engineer', 'Fullstack Engineer', 'Software Engineer', 'Mobile Engineer'],
  },
  {
    value: 'cloud-devops',
    label: 'Cloud & DevOps',
    icon: Cloud,
    roles: ['DevOps Engineer', 'Cloud Engineer', 'Site Reliability Engineer', 'Platform Engineer'],
  },
  {
    value: 'ai-data',
    label: 'AI & Data',
    icon: Database,
    roles: ['Data Engineer', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'AI Engineer'],
  },
  {
    value: 'cybersecurity',
    label: 'Cybersecurity',
    icon: ShieldCheck,
    roles: ['Cybersecurity Analyst', 'Cybersecurity Engineer', 'Security Engineer', 'SOC Analyst'],
  },
  {
    value: 'design-product',
    label: 'Design & Product',
    icon: Palette,
    roles: ['UI Designer', 'UX Designer', 'Product Designer', 'Product Manager'],
  },
  {
    value: 'quality-systems',
    label: 'QA, Support & Systems',
    icon: Wrench,
    roles: ['QA Engineer', 'Test Engineer', 'Systems Administrator', 'IT Support Specialist', 'Network Engineer'],
  },
];

const ACTIVE_LOOKING_OPTIONS = [
  { value: 'yes', label: 'Yes', icon: CircleCheck },
  { value: 'open', label: 'No', icon: CircleX },
];

const WORK_PREFERENCE_OPTIONS = [
  { value: 'remote', label: 'Remote', icon: Wifi },
  { value: 'asynchronous-remote', label: 'Async', icon: Clock3 },
  { value: 'hybrid', label: 'Hybrid', icon: Laptop },
  { value: 'on-site', label: 'On-site', icon: Building2 },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'internship', label: 'Internship', yearsLabel: '0 years', years: '0', icon: BriefcaseBusiness },
  { value: 'entry', label: 'Entry level', yearsLabel: '0 years', years: '0', icon: GraduationCap },
  { value: 'junior', label: 'Junior', yearsLabel: '1-2 years', years: '1', icon: UserRound },
  { value: 'mid', label: 'Mid level', yearsLabel: '3-5 years', years: '4', icon: UsersRound },
  { value: 'senior', label: 'Senior', yearsLabel: '6-9 years', years: '7', icon: Medal },
  { value: 'lead', label: 'Expert & leadership', yearsLabel: '10+ years', years: '10', icon: Crown },
];

const JOB_PRIORITY_OPTIONS = [
  { value: 'Meaningful work', label: 'Meaningful work', icon: HandHeart },
  { value: 'Flexible hours', label: 'Flexible hours', icon: Clock3 },
  { value: 'Higher salary', label: 'Higher salary', icon: BadgeDollarSign },
  { value: 'Strong mentorship', label: 'Strong mentorship', icon: HeartHandshake },
  { value: 'Modern tech stack', label: 'Modern tech stack', icon: Cpu },
  { value: 'Stable company', label: 'Stable company', icon: Building2 },
  { value: 'Remote-friendly team', label: 'Remote-friendly team', icon: HouseWifi },
  { value: 'Fast career growth', label: 'Fast career growth', icon: TrendingUp },
];

const GOAL_OPTIONS = [
  { value: 'land-asap', label: 'Land a job ASAP', icon: Rocket },
  { value: 'better-fit', label: 'Find a better role fit', icon: Search },
  { value: 'career-growth', label: 'Grow into a stronger role', icon: Sprout },
];

const SALARY_MIN = 20000;
const SALARY_MAX = 250000;
const SALARY_STEP = 5000;
const QUESTION_COUNT = 7;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const inferExperienceLevel = (rawYears) => {
  const years = Number(rawYears);
  if (!Number.isFinite(years) || years <= 0) return 'entry';
  if (years <= 2) return 'junior';
  if (years <= 5) return 'mid';
  if (years <= 9) return 'senior';
  return 'lead';
};

const toArray = (value, fallback = []) => (Array.isArray(value) ? value.filter(Boolean) : fallback);

const getCardVariant = (stepIndex) => (stepIndex % 2 === 0 ? 'dark' : 'light');

const getStackClasses = (variant) => (
  variant === 'dark'
    ? 'border-[#2d3c32] bg-[#151916] text-[#f4f6f3] shadow-[0_18px_54px_rgba(17,24,19,0.16)] dark:border-[#35443a] dark:bg-[#111512]'
    : 'border-[#d8d1c6] bg-[#f8f5ee] text-[#223126] shadow-[0_18px_54px_rgba(69,56,34,0.08)] dark:border-[#465047] dark:bg-[#242a25] dark:text-[#f3f5ef]'
);

const getChoiceClasses = ({ selected, disabled, variant }) => {
  const base = 'min-h-14 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-[transform,background-color,border-color,box-shadow,color] duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[#6fba98]/45 focus:ring-offset-2 focus:ring-offset-transparent active:scale-[0.98]';
  if (disabled) {
    return `${base} cursor-not-allowed border-black/10 bg-black/[0.035] text-black/50 active:scale-100 dark:border-white/10 dark:bg-white/[0.035] dark:text-white/50`;
  }
  if (selected) {
    return variant === 'dark'
      ? `${base} border-[#74c29f] bg-[#1d2921] text-white shadow-[inset_0_0_0_1px_rgba(116,194,159,0.16)]`
      : `${base} border-[#68ad89] bg-[#edf4ee] text-[#203127] shadow-[inset_0_0_0_1px_rgba(104,173,137,0.12)] dark:bg-[#334036] dark:text-white`;
  }
  return variant === 'dark'
    ? `${base} border-white/10 bg-white/[0.035] text-white/85 hover:border-white/20 hover:bg-white/[0.065]`
    : `${base} border-[#d8d1c6] bg-white/75 text-[#2d3b31] hover:border-[#aaa596] hover:bg-white dark:border-white/10 dark:bg-black/10 dark:text-white/85 dark:hover:bg-black/20`;
};

export default function DeveloperProfileOnboardingPage({ user, onSubmit, onLogout }) {
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const savedEducation = String(user?.educationAttainment || user?.education || '');
  const isSavedVocational = savedEducation.toLowerCase().startsWith(VOCATIONAL_EDUCATION_OPTION.toLowerCase());
  const savedVocationalCourse = isSavedVocational ? savedEducation.slice(VOCATIONAL_EDUCATION_OPTION.length).replace(/^\s*[-:]\s*/, '').trim() : '';
  const isSavedCustomEducation = Boolean(savedEducation) && !isSavedVocational && !EDUCATIONAL_ATTAINMENT_OPTIONS.includes(savedEducation);
  const savedSchool = String(user?.school || '');
  const isSavedCustomSchool = savedSchool && !SCHOOL_OPTIONS.includes(savedSchool);

  const [form, setForm] = useState({
    activelyLooking: typeof user?.activelyLooking === 'boolean' ? (user.activelyLooking ? 'yes' : 'open') : 'yes',
    roleCategories: toArray(user?.roleCategories),
    preferredRoles: toArray(user?.preferredRoles, user?.preferredRole ? [user.preferredRole] : []),
    workPreference: user?.workPreference || 'remote',
    experienceLevel: user?.experienceLevel || inferExperienceLevel(user?.yearsOfExperience),
    jobPriorities: toArray(user?.jobPriorities),
    salaryExpectationMin: Number.isFinite(Number(user?.salaryExpectationMin)) ? Number(user.salaryExpectationMin) : 40000,
    salaryExpectationMax: Number.isFinite(Number(user?.salaryExpectationMax)) ? Number(user.salaryExpectationMax) : 90000,
    jobSearchGoal: user?.jobSearchGoal || 'land-asap',
    fullName: user?.fullName || user?.name || '',
    email: user?.email || '',
    skills: Array.isArray(user?.skills) ? user.skills : [],
    educationAttainment: isSavedVocational ? VOCATIONAL_EDUCATION_OPTION : isSavedCustomEducation ? OTHER_EDUCATION_OPTION : savedEducation,
    vocationalCourse: savedVocationalCourse,
    customEducationAttainment: isSavedCustomEducation ? savedEducation : '',
    school: isSavedCustomSchool ? OTHER_SCHOOL_OPTION : savedSchool,
    customSchool: isSavedCustomSchool ? savedSchool : '',
    aboutMe: user?.aboutMe || user?.bio || '',
    resume: user?.resume || '',
  });

  const currentVariant = getCardVariant(step);
  const roleOptions = useMemo(() => {
    const categories = ROLE_CATEGORY_OPTIONS.filter((option) => form.roleCategories.includes(option.value));
    const nextRoles = categories.length
      ? categories.flatMap((category) => category.roles)
      : ROLE_CATEGORY_OPTIONS.flatMap((category) => category.roles);
    return [...new Set(nextRoles)];
  }, [form.roleCategories]);

  const requiresVocationalCourse = form.educationAttainment === VOCATIONAL_EDUCATION_OPTION;
  const requiresCustomEducation = form.educationAttainment === OTHER_EDUCATION_OPTION;
  const requiresCustomSchool = form.school === OTHER_SCHOOL_OPTION;
  const isFinalStep = step === QUESTION_COUNT;

  const isQuestionStepValid = () => {
    switch (step) {
      case 0:
        return Boolean(form.activelyLooking);
      case 1:
        return form.roleCategories.length > 0 && form.preferredRoles.length > 0;
      case 2:
        return Boolean(form.workPreference);
      case 3:
        return Boolean(form.experienceLevel);
      case 4:
        return form.jobPriorities.length > 0;
      case 5:
        return Number(form.salaryExpectationMin) <= Number(form.salaryExpectationMax);
      case 6:
        return Boolean(form.jobSearchGoal);
      default:
        return true;
    }
  };

  const isFinalStepValid = () => (
    Boolean(String(form.fullName || '').trim())
    && Array.isArray(form.skills)
    && form.skills.length > 0
    && Boolean(String(form.educationAttainment || '').trim())
    && (!requiresVocationalCourse || Boolean(String(form.vocationalCourse || '').trim()))
    && (!requiresCustomEducation || Boolean(String(form.customEducationAttainment || '').trim()))
    && Boolean(String(form.school || '').trim())
    && (!requiresCustomSchool || Boolean(String(form.customSchool || '').trim()))
    && Boolean(String(form.aboutMe || '').trim())
  );

  const validateCurrentStep = () => {
    if (isFinalStep) {
      if (!isFinalStepValid()) {
        toast.warning('Please complete the remaining profile details before saving.');
        return false;
      }
      return true;
    }

    if (step === 1 && form.preferredRoles.length > 3) {
      toast.warning('Select up to 3 preferred roles.');
      return false;
    }

    if (step === 4 && form.jobPriorities.length > 3) {
      toast.warning('Choose up to 3 priorities.');
      return false;
    }

    if (!isQuestionStepValid()) {
      toast.warning('Please complete this step before continuing.');
      return false;
    }

    return true;
  };

  const resolvedEducation = requiresVocationalCourse
    ? `${VOCATIONAL_EDUCATION_OPTION} - ${String(form.vocationalCourse || '').trim()}`
    : requiresCustomEducation
      ? String(form.customEducationAttainment || '').trim()
      : String(form.educationAttainment || '').trim();

  const resolvedSchool = requiresCustomSchool ? String(form.customSchool || '').trim() : String(form.school || '').trim();

  const handleToggleMulti = (key, value, max = 3) => {
    setForm((current) => {
      const values = Array.isArray(current[key]) ? current[key] : [];
      const exists = values.includes(value);
      if (exists) {
        return { ...current, [key]: values.filter((entry) => entry !== value) };
      }
      if (values.length >= max) {
        return current;
      }
      return { ...current, [key]: [...values, value] };
    });
  };

  const handleCategoryToggle = (value) => {
    setForm((current) => {
      const exists = current.roleCategories.includes(value);
      const nextCategories = exists
        ? current.roleCategories.filter((entry) => entry !== value)
        : current.roleCategories.length >= 3
          ? current.roleCategories
          : [...current.roleCategories, value];
      const allowedRoles = ROLE_CATEGORY_OPTIONS
        .filter((option) => nextCategories.includes(option.value))
        .flatMap((option) => option.roles);
      const nextPreferredRoles = current.preferredRoles.filter((role) => allowedRoles.includes(role)).slice(0, 3);
      return {
        ...current,
        roleCategories: nextCategories,
        preferredRoles: nextPreferredRoles,
      };
    });
  };

  const handleContinue = () => {
    if (!validateCurrentStep()) {
      return;
    }
    setStep((current) => Math.min(current + 1, QUESTION_COUNT));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateCurrentStep() || saving) return;

    const primaryPreferredRole = String(form.preferredRoles[0] || '').trim();
    const yearsOfExperience = EXPERIENCE_LEVEL_OPTIONS.find((option) => option.value === form.experienceLevel)?.years || '0';

    setSaving(true);
    try {
      await onSubmit?.({
        fullName: String(form.fullName || '').trim(),
        username: String(form.fullName || '').trim(),
        email: String(form.email || '').trim(),
        jobTitle: primaryPreferredRole,
        preferredRole: primaryPreferredRole,
        preferredRoles: form.preferredRoles,
        yearsOfExperience,
        experienceLevel: form.experienceLevel,
        skills: form.skills,
        educationAttainment: resolvedEducation,
        school: resolvedSchool,
        aboutMe: String(form.aboutMe || '').trim(),
        workPreference: form.workPreference,
        resume: form.resume || '',
        activelyLooking: form.activelyLooking === 'yes',
        roleCategories: form.roleCategories,
        jobPriorities: form.jobPriorities,
        salaryExpectationMin: Number(form.salaryExpectationMin),
        salaryExpectationMax: Number(form.salaryExpectationMax),
        jobSearchGoal: form.jobSearchGoal,
      });
    } catch (error) {
      const status = Number(error?.status || 0);
      const message = String(error?.message || '').trim();
      if (status === 400) {
        toast.warning(message || 'Please review the required profile details.');
      } else if (status === 401) {
        toast.error('Your session expired. Please log in again.');
      } else {
        toast.error(message || 'Unable to save your profile right now. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#ede7db] text-[#1f2a22] dark:bg-[#0d1010] dark:text-[#f3f4f1] selection:bg-[#83c9a9]/30">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#ede7db]/80 backdrop-blur-xl dark:border-white/5 dark:bg-[#0d1010]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-3 text-[#233126] transition-colors hover:text-[#111612] dark:text-[#e7ece6] dark:hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <KapITLogo className="h-10 w-10 rounded-xl bg-white/80 object-contain p-0.5" />
            <span className="text-lg font-semibold tracking-tight">KapIT</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white/60 text-[#233126] transition-[transform,background-color,border-color] duration-150 hover:bg-white active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-white/80 px-4 py-2 text-sm font-medium text-red-600 transition-[transform,background-color,border-color] duration-150 hover:bg-red-50 active:scale-[0.98] dark:border-red-900/60 dark:bg-white/5 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-85px)] max-w-6xl items-center justify-center px-4 py-10 sm:px-6">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-4xl">
          {!isFinalStep ? (
            <QuestionShell
              variant={currentVariant}
              step={step}
              title={getQuestionTitle(step)}
            >
              {step === 0 ? (
                <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
                  {ACTIVE_LOOKING_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      variant={currentVariant}
                      selected={form.activelyLooking === option.value}
                      onClick={() => setForm((current) => ({ ...current, activelyLooking: option.value }))}
                      icon={option.icon}
                      label={option.label}
                    />
                  ))}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-8">
                  <div>
                    <GroupHeader label="Role categories" selected={form.roleCategories.length} max={3} />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {ROLE_CATEGORY_OPTIONS.map((option) => (
                        <ChoiceButton
                          key={option.value}
                          variant={currentVariant}
                          selected={form.roleCategories.includes(option.value)}
                          disabled={!form.roleCategories.includes(option.value) && form.roleCategories.length >= 3}
                          onClick={() => handleCategoryToggle(option.value)}
                          icon={option.icon}
                          label={option.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <GroupHeader label="Preferred roles" selected={form.preferredRoles.length} max={3} />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {roleOptions.map((role) => (
                        <ChoiceButton
                          key={role}
                          variant={currentVariant}
                          selected={form.preferredRoles.includes(role)}
                          disabled={!form.preferredRoles.includes(role) && form.preferredRoles.length >= 3}
                          onClick={() => handleToggleMulti('preferredRoles', role, 3)}
                          label={role}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
                  {WORK_PREFERENCE_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      variant={currentVariant}
                      selected={form.workPreference === option.value}
                      onClick={() => setForm((current) => ({ ...current, workPreference: option.value }))}
                      icon={option.icon}
                      label={option.label}
                    />
                  ))}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      variant={currentVariant}
                      selected={form.experienceLevel === option.value}
                      onClick={() => setForm((current) => ({ ...current, experienceLevel: option.value }))}
                      icon={option.icon}
                      label={option.label}
                      meta={option.yearsLabel}
                    />
                  ))}
                </div>
              ) : null}

              {step === 4 ? (
                <div>
                  <GroupHeader label="Priorities" selected={form.jobPriorities.length} max={3} />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {JOB_PRIORITY_OPTIONS.map((priority) => (
                      <ChoiceButton
                        key={priority.value}
                        variant={currentVariant}
                        selected={form.jobPriorities.includes(priority.value)}
                        disabled={!form.jobPriorities.includes(priority.value) && form.jobPriorities.length >= 3}
                        onClick={() => handleToggleMulti('jobPriorities', priority.value, 3)}
                        icon={priority.icon}
                        label={priority.label}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="mx-auto max-w-2xl space-y-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SalaryStat label="Minimum" amount={form.salaryExpectationMin} variant={currentVariant} />
                    <SalaryStat label="Maximum" amount={form.salaryExpectationMax} variant={currentVariant} />
                  </div>

                  <div className="space-y-5">
                    <RangeControl
                      label="Minimum salary"
                      value={form.salaryExpectationMin}
                      min={SALARY_MIN}
                      max={SALARY_MAX}
                      step={SALARY_STEP}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          salaryExpectationMin: Math.min(value, current.salaryExpectationMax),
                        }))
                      }
                    />
                    <RangeControl
                      label="Maximum salary"
                      value={form.salaryExpectationMax}
                      min={SALARY_MIN}
                      max={SALARY_MAX}
                      step={SALARY_STEP}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          salaryExpectationMax: Math.max(value, current.salaryExpectationMin),
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              {step === 6 ? (
                <div className="mx-auto grid max-w-xl gap-3">
                  {GOAL_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      variant={currentVariant}
                      selected={form.jobSearchGoal === option.value}
                      onClick={() => setForm((current) => ({ ...current, jobSearchGoal: option.value }))}
                      icon={option.icon}
                      label={option.label}
                    />
                  ))}
                </div>
              ) : null}
            </QuestionShell>
          ) : (
            <section className="rounded-2xl border border-black/8 bg-white/92 shadow-[0_18px_54px_rgba(31,42,34,0.08)] dark:border-white/8 dark:bg-[#171b1b]/96">
              <div className="p-6 sm:p-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-semibold tracking-tight text-[#1f2a22] [text-wrap:balance] dark:text-white">Complete your KapIT profile</h1>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Full name" required>
                    <input
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                      className="field"
                      placeholder="e.g. Juan D. Dela Cruz"
                    />
                  </Field>

                  <Field label="Education" required>
                    <SearchableSelect
                      value={form.educationAttainment}
                      onChange={(educationAttainment) =>
                        setForm((current) => ({
                          ...current,
                          educationAttainment,
                          vocationalCourse: educationAttainment === VOCATIONAL_EDUCATION_OPTION ? current.vocationalCourse : '',
                          customEducationAttainment: educationAttainment === OTHER_EDUCATION_OPTION ? current.customEducationAttainment : '',
                        }))
                      }
                      options={EDUCATIONAL_ATTAINMENT_OPTIONS}
                      placeholder="Select educational attainment"
                      searchPlaceholder="Search education"
                      className="field"
                    />
                  </Field>

                  <Field label="School / University" required>
                    <SearchableSelect
                      value={form.school}
                      onChange={(school) =>
                        setForm((current) => ({
                          ...current,
                          school,
                          customSchool: school === OTHER_SCHOOL_OPTION ? current.customSchool : '',
                        }))
                      }
                      options={SCHOOL_OPTIONS}
                      placeholder="Select a school or university"
                      searchPlaceholder="Search schools"
                      className="field"
                    />
                  </Field>

                  {requiresVocationalCourse ? (
                    <Field label="Vocational course" required>
                      <input
                        value={form.vocationalCourse}
                        onChange={(event) => setForm((current) => ({ ...current, vocationalCourse: event.target.value }))}
                        className="field"
                        placeholder="e.g. Computer Programming NC IV"
                      />
                    </Field>
                  ) : null}

                  {requiresCustomEducation ? (
                    <Field label="Specify education" required>
                      <input
                        value={form.customEducationAttainment}
                        onChange={(event) => setForm((current) => ({ ...current, customEducationAttainment: event.target.value }))}
                        className="field"
                        placeholder="Type your educational attainment"
                      />
                    </Field>
                  ) : null}

                  {requiresCustomSchool ? (
                    <Field label="Specify school / university" required>
                      <input
                        value={form.customSchool}
                        onChange={(event) => setForm((current) => ({ ...current, customSchool: event.target.value }))}
                        className="field"
                        placeholder="Type your school or university"
                      />
                    </Field>
                  ) : null}

                  <Field label="Skills" full required>
                    <SkillTags
                      value={form.skills}
                      onChange={(skills) => setForm((current) => ({ ...current, skills }))}
                      placeholder="Type a skill and press Enter"
                    />
                  </Field>

                  <Field label="Short bio" full required>
                    <textarea
                      value={form.aboutMe}
                      onChange={(event) => setForm((current) => ({ ...current, aboutMe: event.target.value }))}
                      className="field min-h-32"
                      placeholder="Tell employers how you work, what you build, and what kind of opportunities fit you best."
                    />
                  </Field>

                  <Field label="Resume" full>
                    <ResumeUploader
                      value={form.resume}
                      onChange={(resume) => setForm((current) => ({ ...current, resume }))}
                      onUpload={(file) => developerAPI.uploadResume(file)}
                    />
                  </Field>
                </div>
              </div>
            </section>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold text-[#2a352d] transition-[transform,background-color,border-color] duration-150 hover:bg-white active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
            ) : (
              <div />
            )}

            {!isFinalStep ? (
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#315f47] px-6 py-3 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-[#294f3c] active:scale-[0.98] dark:bg-[#78c7a7] dark:text-[#143022] dark:hover:bg-[#89d0b2]"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#315f47] px-6 py-3 text-sm font-semibold text-white transition-[transform,background-color] duration-150 hover:bg-[#294f3c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#78c7a7] dark:text-[#143022] dark:hover:bg-[#89d0b2]"
              >
                {saving ? 'Saving profile...' : 'Save profile'}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

function getQuestionTitle(step) {
  switch (step) {
    case 0:
      return 'Are you actively looking for a new job?';
    case 1:
      return 'What kind of IT roles are you looking for?';
    case 2:
      return 'Which work setup fits you best?';
    case 3:
      return 'How much experience do you have?';
    case 4:
      return 'What matters most in your next role?';
    case 5:
      return 'Expected salary range';
    case 6:
      return 'What is your job-search goal right now?';
    default:
      return '';
  }
}

function QuestionShell({ step, title, variant, children }) {
  const progress = ((step + 1) / (QUESTION_COUNT + 1)) * 100;

  return (
    <section className={`flex min-h-[430px] flex-col overflow-hidden rounded-2xl border p-6 sm:p-8 ${getStackClasses(variant)}`}>
      <div className="mb-8">
        <div
          className="h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={0}
          aria-valuemax={QUESTION_COUNT + 1}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full origin-left rounded-full bg-[#6fba98] transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
      </div>

      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight [text-wrap:balance] sm:text-[2.25rem]">{title}</h1>
      </div>

      <div className="flex flex-1 items-center">
        <div className="w-full">{children}</div>
      </div>
    </section>
  );
}

function ChoiceButton({ children, icon: Icon, label, meta, selected, disabled = false, onClick, variant }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={getChoiceClasses({ selected, disabled, variant })}
      aria-pressed={selected}
    >
      <span className="flex w-full items-center gap-3">
        {Icon ? <Icon className="h-5 w-5 shrink-0 opacity-80" strokeWidth={1.8} aria-hidden="true" /> : null}
        <span className="min-w-0 flex-1 text-[15px] font-semibold leading-5">{label || children}</span>
        {meta ? <span className="shrink-0 text-xs font-medium tabular-nums opacity-65">{meta}</span> : null}
        {selected ? <Check className="h-4 w-4 shrink-0 text-[#64b48f]" strokeWidth={2.25} aria-hidden="true" /> : null}
      </span>
    </button>
  );
}

function GroupHeader({ label, selected, max }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-sm font-semibold">{label}</h2>
      <SelectionCount selected={selected} max={max} />
    </div>
  );
}

function SelectionCount({ selected, max }) {
  return <span className="text-xs font-semibold tabular-nums opacity-60">{selected}/{max}</span>;
}

function SalaryStat({ label, amount, variant }) {
  return (
    <div className={`rounded-xl border px-5 py-4 ${variant === 'dark' ? 'border-white/10 bg-white/[0.035]' : 'border-[#d8d1c6] bg-white/75 dark:border-white/10 dark:bg-black/10'}`}>
      <div className="text-sm font-medium opacity-65">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{formatCurrency(amount)}</div>
    </div>
  );
}

function RangeControl({ label, value, min, max, step, onChange }) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#78c7a7]"
      />
    </label>
  );
}

function Field({ label, children, full = false, required = false }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-1.5 block text-sm font-medium text-[#314235] dark:text-[#d8dfd8]">
        {label}
        {required ? <span className="ml-1 text-[#5ca887]">*</span> : null}
      </label>
      {children}
    </div>
  );
}
