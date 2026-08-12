import React, { useMemo } from 'react';
import { CalendarDays, MapPin, Sparkles } from 'lucide-react';

const APPLICATION_BOARD_COLUMNS = [
  {
    key: 'applied',
    title: 'Applied',
    emptyText: 'No applied roles yet.',
    pillClass: 'border-[var(--user-border)] bg-[var(--user-surface)] text-[var(--user-primary)]',
  },
  {
    key: 'interview',
    title: 'Interview',
    emptyText: 'No interviews yet.',
    pillClass: 'bg-[#efe1ff] text-[#7c3aed]',
  },
  {
    key: 'result',
    title: 'Result',
    emptyText: 'No results yet.',
    pillClass: 'bg-[#e0e8ff] text-[#3158e8]',
  },
];

const INTERVIEW_STATUSES = new Set(['interview', 'interviewing', 'interview scheduled', 'scheduled', 'reviewing']);
const RESULT_STATUSES = new Set(['accepted', 'hired', 'offer', 'offered', 'rejected', 'declined', 'result']);

export default function UserApplicationsPanel({ applications = [], embedded = false }) {
  const safeApplications = useMemo(() => (Array.isArray(applications) ? applications : []), [applications]);
  const columns = useMemo(
    () => APPLICATION_BOARD_COLUMNS.map((column) => ({
      ...column,
      items: safeApplications.filter((application) => getApplicationColumnKey(application) === column.key),
    })),
    [safeApplications]
  );

  return (
    <div
      className={`user-desktop-flat-surface w-full overflow-hidden rounded-[20px] border border-[var(--user-border)] bg-[var(--user-surface)] ${
        embedded ? '' : 'mx-auto max-w-[min(100%,1040px)]'
      }`}
    >
      {!embedded ? (
        <div className="px-5 pb-1 pt-5 xl:px-6 xl:pt-6">
          <h2 className="text-[22px] font-semibold tracking-tight text-[var(--user-text-strong)] xl:text-3xl">Applications</h2>
        </div>
      ) : null}

      <div className="grid gap-4 px-4 pb-5 pt-4 xl:grid-cols-3 xl:gap-0 xl:px-5" aria-label="Application board">
        {columns.map((column, index) => (
          <ApplicationColumn
            key={column.key}
            column={column}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

function ApplicationColumn({ column, isFirst }) {
  return (
    <section className={`min-w-0 px-0 pb-1 xl:px-4 xl:pb-0 ${isFirst ? '' : 'xl:border-l xl:border-[var(--user-border)]'}`}>
      <div className="px-1 text-center">
        <h3 className="text-xs font-medium text-[var(--user-text-strong)]">
          {column.title} ({column.items.length})
        </h3>
        <div className="mt-3 h-px w-full bg-[var(--user-border)]" />
      </div>

      <div className="mt-4 space-y-4">
        {column.items.length > 0 ? (
          column.items.map((application) => (
            <ApplicationCard
              key={application.jobId || `${application.title}-${application.appliedAt}`}
              application={application}
              column={column}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--user-border)] px-4 py-8 text-center text-xs text-[var(--user-text-muted)]">
            {column.emptyText}
          </div>
        )}
      </div>
    </section>
  );
}

function ApplicationCard({ application, column }) {
  const companyName = getCompanyName(application);
  const title = String(application?.title || '').trim() || 'Untitled role';
  const location = String(application?.location || '').trim() || 'Remote';
  const activityDate = application?.updatedAt || application?.lastActivityAt || application?.appliedAt;
  const appliedDate = application?.appliedAt || application?.createdAt;
  const avatar = getAvatarMeta(companyName || title);

  return (
    <article className="rounded-2xl border border-[var(--user-border)] bg-[var(--user-surface)] p-4 shadow-[0_14px_34px_rgba(25,42,28,0.05)] transition-[border-color,background-color,box-shadow] duration-150 hover:border-[var(--user-border-strong)] hover:shadow-[0_18px_40px_rgba(25,42,28,0.08)]">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold ${avatar.className}`}>
          {avatar.initial}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold leading-5 text-[var(--user-text-strong)]">{title}</h3>
          <p className="truncate text-xs leading-5 text-[var(--user-text-muted)]">{companyName}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <ApplicationMeta icon={MapPin} text={location} />
        <ApplicationMeta icon={Sparkles} text={`Last activity ${formatRelativeDate(activityDate)}`} />
        <p className="pl-5 text-xs leading-5 text-[var(--user-text-muted)]">{getActivityLabel(application)}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <ApplicationMeta icon={CalendarDays} text={`Applied ${formatRelativeDate(appliedDate)}`} />
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${column.pillClass}`}>
          {getStatusLabel(application)}
        </span>
      </div>
    </article>
  );
}

function ApplicationMeta({ icon: Icon, text }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs leading-5 text-[var(--user-text)]">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--user-text-muted)]" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function getApplicationColumnKey(application) {
  const status = normalizeStatus(application?.status);
  if (RESULT_STATUSES.has(status)) {
    return 'result';
  }
  if (INTERVIEW_STATUSES.has(status)) {
    return 'interview';
  }
  return 'applied';
}

function getCompanyName(application) {
  const company = application?.company;
  if (typeof company === 'string') {
    return company.trim() || 'Company';
  }
  return String(company?.name || application?.companyName || 'Company').trim() || 'Company';
}

function normalizeStatus(status) {
  return String(status || 'pending').trim().toLowerCase().replace(/[_-]+/g, ' ');
}

function getActivityLabel(application) {
  const status = normalizeStatus(application?.status);
  if (status === 'interview' || status === 'interviewing' || status === 'interview scheduled' || status === 'scheduled') {
    return 'Interview Scheduled';
  }
  if (status === 'accepted' || status === 'hired' || status === 'offer' || status === 'offered') {
    return 'Email Received';
  }
  if (status === 'rejected' || status === 'declined') {
    return 'Result Received';
  }
  if (status === 'reviewing') {
    return 'Application Reviewed';
  }
  return 'Awaiting Response';
}

function getStatusLabel(application) {
  const status = normalizeStatus(application?.status);
  if (status === 'interview' || status === 'interviewing' || status === 'interview scheduled' || status === 'scheduled') {
    return 'Interview';
  }
  if (status === 'accepted' || status === 'hired' || status === 'offer' || status === 'offered') {
    return 'Offer';
  }
  if (status === 'rejected' || status === 'declined') {
    return 'Closed';
  }
  if (status === 'reviewing') {
    return 'Reviewing';
  }
  return status === 'pending' ? 'Awaiting Response' : toTitleCase(status);
}

function getAvatarMeta(label) {
  const initial = String(label || 'A').trim().charAt(0).toUpperCase() || 'A';
  const palette = [
    'bg-[#12100f] text-white',
    'bg-[#ff674d] text-white',
    'bg-[var(--user-surface-subtle)] text-[var(--user-text-strong)] border border-[var(--user-border)]',
  ];
  const index = initial.charCodeAt(0) % palette.length;
  return {
    initial,
    className: palette[index],
  };
}

function formatRelativeDate(value) {
  const timestamp = value ? new Date(value).getTime() : Date.now();
  if (!Number.isFinite(timestamp)) {
    return 'just now';
  }

  const diffMs = Math.max(0, Date.now() - timestamp);
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;
  const monthMs = 30 * dayMs;

  if (diffMs < minuteMs) {
    return 'just now';
  }
  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.round(diffMs / hourMs));
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffMs < weekMs) {
    const days = Math.max(1, Math.round(diffMs / dayMs));
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  if (diffMs < monthMs) {
    const weeks = Math.max(1, Math.round(diffMs / weekMs));
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  const months = Math.max(1, Math.round(diffMs / monthMs));
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
}

function toTitleCase(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
