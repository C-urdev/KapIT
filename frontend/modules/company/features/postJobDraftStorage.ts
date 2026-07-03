export const COMPANY_POST_JOB_FORM_STORAGE_KEY = 'kapit_company_post_job_form_draft_v1';

export const createPreAssessmentQuestionDraft = (): { id: string; question: string; imageUrl: string; criteria: string[] } => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  question: '',
  imageUrl: '',
  criteria: [],
});

export const DEFAULT_COMPANY_POST_JOB_FORM = Object.freeze({
  selectedTitle: '',
  customTitle: '',
  description: '',
  salaryCurrency: 'PHP',
  salary: '',
  customSalary: '',
  country: 'Philippines',
  provinceCode: '',
  city: '',
  location: '',
  type: 'Full-time',
  experienceLevel: '',
  workPreference: '',
  hiresNeeded: 1,
  applicationDeadline: '',
  skills: [],
  preAssessmentEnabled: false,
  preAssessmentInstructions: '',
  preAssessmentQuestions: [],
});

export const normalizeCompanyPostJobFormDraft = (input: unknown) => {
  const source = input && typeof input === 'object' ? (input as Record<string, any>) : {};
  return {
    ...DEFAULT_COMPANY_POST_JOB_FORM,
    ...source,
    selectedTitle: String(source.selectedTitle || ''),
    customTitle: String(source.customTitle || ''),
    description: String(source.description || ''),
    salaryCurrency: String(source.salaryCurrency || DEFAULT_COMPANY_POST_JOB_FORM.salaryCurrency || 'PHP'),
    salary: String(source.salary || ''),
    customSalary: String(source.customSalary || ''),
    country: String(source.country || DEFAULT_COMPANY_POST_JOB_FORM.country),
    provinceCode: String(source.provinceCode || ''),
    city: String(source.city || ''),
    location: String(source.location || ''),
    type: String(source.type || DEFAULT_COMPANY_POST_JOB_FORM.type || 'Full-time'),
    experienceLevel: String(source.experienceLevel || ''),
    workPreference: String(source.workPreference || ''),
    applicationDeadline: String(source.applicationDeadline || ''),
    hiresNeeded: Math.max(1, Math.min(50, Number(source.hiresNeeded || 1) || 1)),
    skills: Array.isArray(source.skills) ? source.skills.map((item: unknown) => String(item || '').trim()).filter(Boolean) : [],
    preAssessmentEnabled: Boolean(source.preAssessmentEnabled),
    preAssessmentInstructions: String(source.preAssessmentInstructions || ''),
    preAssessmentQuestions: Array.isArray(source.preAssessmentQuestions)
      ? source.preAssessmentQuestions.map((question: any, index: number) => ({
        id: String(question?.id || `q${index + 1}`).trim() || `q${index + 1}`,
        question: String(question?.question || ''),
        imageUrl: String(question?.imageUrl || ''),
        criteria: Array.isArray(question?.criteria)
          ? question.criteria.map((item: unknown) => String(item || '').trim()).filter(Boolean)
          : [],
      }))
      : [],
  };
};

export const loadCompanyPostJobFormDraft = () => {
  if (typeof window === 'undefined') {
    return normalizeCompanyPostJobFormDraft(DEFAULT_COMPANY_POST_JOB_FORM);
  }

  try {
    const raw = window.localStorage.getItem(COMPANY_POST_JOB_FORM_STORAGE_KEY);
    if (!raw) {
      return normalizeCompanyPostJobFormDraft(DEFAULT_COMPANY_POST_JOB_FORM);
    }
    return normalizeCompanyPostJobFormDraft(JSON.parse(raw));
  } catch {
    return normalizeCompanyPostJobFormDraft(DEFAULT_COMPANY_POST_JOB_FORM);
  }
};

export const saveCompanyPostJobFormDraft = (draft: unknown): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeCompanyPostJobFormDraft(draft);
  window.localStorage.setItem(COMPANY_POST_JOB_FORM_STORAGE_KEY, JSON.stringify(normalized));
};

export const clearCompanyPostJobFormDraft = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(COMPANY_POST_JOB_FORM_STORAGE_KEY);
};
