export const COMPANY_POST_JOB_FORM_STORAGE_KEY = 'kapit_company_post_job_form_draft_v1';

export const createPreAssessmentQuestionDraft = () => ({
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
  location: '',
  type: 'Full-time',
  experienceLevel: '',
  workPreference: '',
  applicationDeadline: '',
  skills: [],
  preAssessmentEnabled: false,
  preAssessmentInstructions: '',
  preAssessmentQuestions: [],
});

export const normalizeCompanyPostJobFormDraft = (input) => {
  const source = input && typeof input === 'object' ? input : {};
  return {
    ...DEFAULT_COMPANY_POST_JOB_FORM,
    ...source,
    skills: Array.isArray(source.skills) ? source.skills.map((item) => String(item || '').trim()).filter(Boolean) : [],
    preAssessmentEnabled: Boolean(source.preAssessmentEnabled),
    preAssessmentInstructions: String(source.preAssessmentInstructions || ''),
    preAssessmentQuestions: Array.isArray(source.preAssessmentQuestions)
      ? source.preAssessmentQuestions.map((question, index) => ({
        id: String(question?.id || `q${index + 1}`).trim() || `q${index + 1}`,
        question: String(question?.question || ''),
        imageUrl: String(question?.imageUrl || ''),
        criteria: Array.isArray(question?.criteria)
          ? question.criteria.map((item) => String(item || '').trim()).filter(Boolean)
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

export const saveCompanyPostJobFormDraft = (draft) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeCompanyPostJobFormDraft(draft);
  window.localStorage.setItem(COMPANY_POST_JOB_FORM_STORAGE_KEY, JSON.stringify(normalized));
};
