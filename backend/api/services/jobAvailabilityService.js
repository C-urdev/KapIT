const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isPast = (value, now = new Date()) => {
  const parsed = normalizeDate(value);
  return Boolean(parsed && parsed.getTime() < now.getTime());
};

const getJobAvailability = (job, now = new Date()) => {
  const status = String(job?.status || 'open').trim().toLowerCase();
  const activeUntil = normalizeDate(job?.active_until || job?.activeUntil);
  const applicationDeadline = normalizeDate(job?.application_deadline || job?.applicationDeadline);
  const paymentReady = String(job?.posting_payment_status || 'paid').toLowerCase() === 'paid';

  let acceptsApplications = status === 'open' && paymentReady;
  let label = acceptsApplications ? 'Applications open' : 'Applications closed';
  let staleReason = '';

  if (!paymentReady) {
    acceptsApplications = false;
    staleReason = 'payment_pending';
    label = 'Pending publication payment';
  } else if (status !== 'open') {
    acceptsApplications = false;
    staleReason = status === 'filled' ? 'filled' : status === 'closed' ? 'closed' : status;
    label = status === 'filled' ? 'Position filled' : 'Applications closed';
  } else if (applicationDeadline && applicationDeadline.getTime() < now.getTime()) {
    acceptsApplications = false;
    staleReason = 'deadline_passed';
    label = 'Application deadline passed';
  } else if (activeUntil && activeUntil.getTime() < now.getTime()) {
    acceptsApplications = false;
    staleReason = 'expired';
    label = 'Job post expired';
  }

  return {
    acceptsApplications,
    availabilityLabel: label,
    staleReason,
    applicationDeadline,
    activeUntil,
  };
};

const withJobAvailability = (job, now = new Date()) => {
  const availability = getJobAvailability(job, now);
  return {
    ...job,
    applicationDeadline: availability.applicationDeadline ? availability.applicationDeadline.toISOString() : null,
    activeUntil: availability.activeUntil ? availability.activeUntil.toISOString() : null,
    acceptsApplications: availability.acceptsApplications,
    availabilityLabel: availability.availabilityLabel,
    staleReason: availability.staleReason,
    isExpired: availability.staleReason === 'expired',
  };
};

const closeExpiredJobs = async (client) => {
  await client.query(
    `UPDATE jobs
     SET status = 'closed',
         closed_reason = 'expired',
         closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP)
     WHERE status = 'open'
       AND active_until IS NOT NULL
       AND active_until < CURRENT_TIMESTAMP`
  );
};

const normalizeDeadlineInput = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Application deadline must be a valid date.');
  }

  if (parsed.getTime() < Date.now() - DAY_IN_MS) {
    throw new Error('Application deadline must be in the future.');
  }

  return parsed.toISOString();
};

module.exports = {
  normalizeDate,
  getJobAvailability,
  withJobAvailability,
  closeExpiredJobs,
  normalizeDeadlineInput,
  isPast,
};
