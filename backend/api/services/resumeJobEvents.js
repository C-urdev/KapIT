const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(200);

const keyFor = (jobId) => `resume-job:${String(jobId || '')}`;

const emitResumeJobEvent = (jobId, payload) => {
  bus.emit(keyFor(jobId), payload);
};

const onResumeJobEvent = (jobId, handler) => {
  const key = keyFor(jobId);
  bus.on(key, handler);
  return () => bus.off(key, handler);
};

module.exports = {
  emitResumeJobEvent,
  onResumeJobEvent,
};
