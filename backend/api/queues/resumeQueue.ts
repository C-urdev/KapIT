const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { logger } = require('../config/logger');
const { runAtsOptimizationJob } = require('../services/resumeService');

const queueName = 'resume-processing';
let queue;
let worker;

const getBullConnection = () => {
  const url = String(process.env.REDIS_URL || '').trim();
  if (!url) return null;
  return new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false });
};

const getQueue = () => {
  if (queue) return queue;
  const connection = getBullConnection();
  if (!connection) return null;
  queue = new Queue(queueName, { connection });
  return queue;
};

const enqueueAtsOptimization = async ({ jobId, userId, sourceResumeId }) => {
  const q = getQueue();
  if (!q) return false;
  await q.add(
    'ats_optimize',
    { jobId, userId, sourceResumeId },
    { jobId: String(jobId), attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 200 }
  );
  return true;
};

const startResumeWorker = () => {
  if (worker) return worker;
  const connection = getBullConnection();
  if (!connection) return null;
  worker = new Worker(
    queueName,
    async (job) => {
      if (job.name !== 'ats_optimize') return;
      const { jobId, userId, sourceResumeId } = job.data || {};
      await runAtsOptimizationJob({ jobId, userId, sourceResumeId });
    },
    { connection, concurrency: Math.max(1, Number(process.env.RESUME_QUEUE_CONCURRENCY || 2)) }
  );
  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error?.message || String(error) }, 'resume.queue.failed');
  });
  return worker;
};

const stopResumeWorker = async () => {
  await Promise.allSettled([worker?.close(), queue?.close()]);
  worker = null;
  queue = null;
};

module.exports = {
  enqueueAtsOptimization,
  startResumeWorker,
  stopResumeWorker,
};
