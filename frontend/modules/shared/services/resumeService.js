import { apiRequest } from './apiClient';

export const resumeService = {
  getResume: (resumeId) => apiRequest(`/api/resumes/${encodeURIComponent(resumeId)}`),
  getResumeJob: (jobId) => apiRequest(`/api/resume-jobs/${encodeURIComponent(jobId)}`),
};

