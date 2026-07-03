import { apiRequest } from './apiClient';

export const resumeService = {
  getResume: (resumeId: string) => apiRequest(`/api/resumes/${encodeURIComponent(resumeId)}`),
  getResumeJob: (jobId: string) => apiRequest(`/api/resume-jobs/${encodeURIComponent(jobId)}`),
};

