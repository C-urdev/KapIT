const STORAGE_KEY = 'kapit_user_activity_by_user';

type ActivityEntry = Record<string, any>;
type ActivityState = {
  savedJobs: ActivityEntry[];
  savedPosts: ActivityEntry[];
  applications: ActivityEntry[];
};
type ActivityStore = Record<string, ActivityState>;

const readStore = (): ActivityStore => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as ActivityStore;
  } catch {
    return {};
  }
};

const writeStore = (store: ActivityStore): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const getUserKey = (user: any): string => {
  const email = user?.email?.trim().toLowerCase();
  if (email) {
    return email;
  }
  const fallback = user?.fullName || user?.name || user?.username;
  return fallback ? String(fallback).trim().toLowerCase() : 'anonymous';
};

const getUserActivity = (user: any): ActivityState => {
  const store = readStore();
  const key = getUserKey(user);
  const current = (store[key] || {
    savedJobs: [],
    savedPosts: [],
    applications: [],
  }) as ActivityState;
  return {
    savedJobs: Array.isArray(current.savedJobs) ? current.savedJobs : [],
    savedPosts: Array.isArray(current.savedPosts) ? current.savedPosts : [],
    applications: Array.isArray(current.applications) ? current.applications : [],
  };
};

const setUserActivity = (user: any, nextActivity: Partial<ActivityState>): ActivityState => {
  const store = readStore();
  const key = getUserKey(user);
  store[key] = {
    savedJobs: Array.isArray(nextActivity?.savedJobs) ? nextActivity.savedJobs : [],
    savedPosts: Array.isArray(nextActivity?.savedPosts) ? nextActivity.savedPosts : [],
    applications: Array.isArray(nextActivity?.applications) ? nextActivity.applications : [],
  };
  writeStore(store);
  return store[key];
};

export const getSavedJobsForUser = (user: any): ActivityEntry[] => getUserActivity(user).savedJobs;

export const toggleSavedJobForUser = (user: any, job: any): ActivityEntry[] => {
  const activity = getUserActivity(user);
  const jobId = Number(job?.id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return activity.savedJobs;
  }

  const exists = activity.savedJobs.some((entry: ActivityEntry) => Number(entry?.id) === jobId);
  const nextSavedJobs = exists
    ? activity.savedJobs.filter((entry) => Number(entry?.id) !== jobId)
    : [
        {
          id: jobId,
          title: String(job?.title || '').trim() || 'Untitled job',
          description: String(job?.description || '').trim(),
          location: String(job?.location || '').trim(),
          type: String(job?.type || '').trim(),
          salary: String(job?.salary || '').trim(),
          status: String(job?.status || 'open').trim(),
          company: (job?.company || {}) as Record<string, any>,
          createdAt: job?.createdAt || new Date().toISOString(),
          savedAt: new Date().toISOString(),
        },
        ...activity.savedJobs,
      ];

  setUserActivity(user, { ...activity, savedJobs: nextSavedJobs });
  return nextSavedJobs;
};

export const isJobSavedForUser = (user: any, jobId: any): boolean =>
  getSavedJobsForUser(user).some((entry) => Number(entry?.id) === Number(jobId));

export const getApplicationsForUser = (user: any): ActivityEntry[] => getUserActivity(user).applications;

export const saveApplicationForUser = (user: any, application: any): ActivityEntry[] => {
  const activity = getUserActivity(user);
  const jobId = Number(application?.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return activity.applications;
  }

  const nextApplications = [
    {
      ...application,
      jobId,
      appliedAt: application?.appliedAt || new Date().toISOString(),
    },
    ...activity.applications.filter((entry: ActivityEntry) => Number(entry?.jobId) !== jobId),
  ];

  setUserActivity(user, { ...activity, applications: nextApplications });
  return nextApplications;
};

export const syncApplicationsForUser = (user: any, jobs: any): ActivityEntry[] => {
  const activity = getUserActivity(user);
  const appliedFromFeed = Array.isArray(jobs)
    ? jobs
        .filter((job: any) => job?.hasApplied)
        .map((job: any) => ({
          jobId: Number(job.id),
          title: String(job?.title || '').trim() || 'Untitled job',
          location: String(job?.location || '').trim(),
          type: String(job?.type || '').trim(),
          salary: String(job?.salary || '').trim(),
          status: 'pending',
          company: (job?.company || {}) as Record<string, any>,
          appliedAt: job?.createdAt || new Date().toISOString(),
        }))
    : [];

  if (!appliedFromFeed.length) {
    return activity.applications;
  }

  const merged = [
    ...appliedFromFeed,
    ...activity.applications.filter(
      (entry: ActivityEntry) => !appliedFromFeed.some((job) => Number(job?.jobId) === Number(entry?.jobId))
    ),
  ];

  setUserActivity(user, { ...activity, applications: merged });
  return merged;
};

export const getSavedPostsForUser = (user: any): ActivityEntry[] => getUserActivity(user).savedPosts;

export const toggleSavedPostForUser = (user: any, post: any): ActivityEntry[] => {
  const activity = getUserActivity(user);
  const postId = Number(post?.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return activity.savedPosts;
  }

  const exists = activity.savedPosts.some((entry: ActivityEntry) => Number(entry?.id) === postId);
  const nextSavedPosts = exists
    ? activity.savedPosts.filter((entry) => Number(entry?.id) !== postId)
    : [
        {
          id: postId,
          content: String(post?.content || '').trim(),
          imageUrl: String(post?.imageUrl || '').trim(),
          createdAt: post?.createdAt || new Date().toISOString(),
          visibility: String(post?.visibility || '').trim(),
          savedAt: new Date().toISOString(),
        },
        ...activity.savedPosts,
      ];

  setUserActivity(user, { ...activity, savedPosts: nextSavedPosts });
  return nextSavedPosts;
};

export const isPostSavedForUser = (user: any, postId: any): boolean =>
  getSavedPostsForUser(user).some((entry) => Number(entry?.id) === Number(postId));
