const STORAGE_KEY = 'kapit_user_activity_by_user';

const readStore = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const writeStore = (store) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const getUserKey = (user) => {
  const email = user?.email?.trim().toLowerCase();
  if (email) {
    return email;
  }
  const fallback = user?.username || user?.name;
  return fallback ? String(fallback).trim().toLowerCase() : 'anonymous';
};

const getUserActivity = (user) => {
  const store = readStore();
  const key = getUserKey(user);
  const current = store[key] || {};
  return {
    savedJobs: Array.isArray(current.savedJobs) ? current.savedJobs : [],
    savedPosts: Array.isArray(current.savedPosts) ? current.savedPosts : [],
    applications: Array.isArray(current.applications) ? current.applications : [],
  };
};

const setUserActivity = (user, nextActivity) => {
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

export const getSavedJobsForUser = (user) => getUserActivity(user).savedJobs;

export const toggleSavedJobForUser = (user, job) => {
  const activity = getUserActivity(user);
  const jobId = Number(job?.id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return activity.savedJobs;
  }

  const exists = activity.savedJobs.some((entry) => Number(entry?.id) === jobId);
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
          company: job?.company || {},
          createdAt: job?.createdAt || new Date().toISOString(),
          savedAt: new Date().toISOString(),
        },
        ...activity.savedJobs,
      ];

  setUserActivity(user, { ...activity, savedJobs: nextSavedJobs });
  return nextSavedJobs;
};

export const isJobSavedForUser = (user, jobId) =>
  getSavedJobsForUser(user).some((entry) => Number(entry?.id) === Number(jobId));

export const getApplicationsForUser = (user) => getUserActivity(user).applications;

export const saveApplicationForUser = (user, application) => {
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
    ...activity.applications.filter((entry) => Number(entry?.jobId) !== jobId),
  ];

  setUserActivity(user, { ...activity, applications: nextApplications });
  return nextApplications;
};

export const syncApplicationsForUser = (user, jobs) => {
  const activity = getUserActivity(user);
  const appliedFromFeed = Array.isArray(jobs)
    ? jobs
        .filter((job) => job?.hasApplied)
        .map((job) => ({
          jobId: Number(job.id),
          title: String(job?.title || '').trim() || 'Untitled job',
          location: String(job?.location || '').trim(),
          type: String(job?.type || '').trim(),
          salary: String(job?.salary || '').trim(),
          status: 'pending',
          company: job?.company || {},
          appliedAt: job?.createdAt || new Date().toISOString(),
        }))
    : [];

  if (!appliedFromFeed.length) {
    return activity.applications;
  }

  const merged = [
    ...appliedFromFeed,
    ...activity.applications.filter(
      (entry) => !appliedFromFeed.some((job) => Number(job?.jobId) === Number(entry?.jobId))
    ),
  ];

  setUserActivity(user, { ...activity, applications: merged });
  return merged;
};

export const getSavedPostsForUser = (user) => getUserActivity(user).savedPosts;

export const toggleSavedPostForUser = (user, post) => {
  const activity = getUserActivity(user);
  const postId = Number(post?.id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return activity.savedPosts;
  }

  const exists = activity.savedPosts.some((entry) => Number(entry?.id) === postId);
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

export const isPostSavedForUser = (user, postId) =>
  getSavedPostsForUser(user).some((entry) => Number(entry?.id) === Number(postId));
