import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bell, Eye, MessageCircle, MoreHorizontal, Trash2, X } from 'lucide-react';
import { getNotifications, markNotificationsRead } from '@sharedServices/notificationsService';
import NotificationsSkeleton from '../../../../components/shared/skeletons/NotificationsSkeleton';

const formatNotificationTime = (value) => {
  if (!value) {
    return '';
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return '';
  }

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return 'Just now';
  }
  if (diffMs < hour) {
    return `${Math.max(1, Math.floor(diffMs / minute))}m`;
  }
  if (diffMs < day) {
    return `${Math.max(1, Math.floor(diffMs / hour))}h`;
  }
  if (diffMs < 7 * day) {
    return `${Math.max(1, Math.floor(diffMs / day))}d`;
  }

  const weeks = Math.floor(diffMs / (7 * day));
  if (weeks < 5) {
    return `${Math.max(1, weeks)}w`;
  }

  return new Date(value).toLocaleDateString();
};

const formatExactTime = (value) => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    return '';
  }

  return parsed.toLocaleString();
};

const getNotificationPresentation = (type) => {
  switch (type) {
    case 'message':
      return {
        icon: MessageCircle,
        badgeClass: 'bg-[#588157] text-white dark:bg-[#6f9b74]',
      };
    case 'profile_view':
      return {
        icon: Eye,
        badgeClass: 'bg-[#d4a373] text-white dark:bg-yellow-500',
      };
    default:
      return {
        icon: Bell,
        badgeClass: 'bg-[#3a5a40] text-white dark:bg-[#6f9b74]',
      };
  }
};

const getActorInitials = (metadata, title) => {
  const source = String(metadata?.actorLabel || title || 'K').trim();
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

const buildSummaryMessage = (message, metadata) => {
  const actorLabel = metadata?.actorLabel || 'Someone';
  const messageCount = Number(metadata?.messageCount || 0);

  if (messageCount > 1) {
    return `${actorLabel} messaged you (${messageCount} messages).`;
  }

  return message;
};

export default function UserNotificationsPage({ onReadAll }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionMenuItem, setActionMenuItem] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError('');
        const items = await getNotifications();
        if (!mounted) {
          return;
        }

        setNotifications(items);

        if (items.some((item) => !item.isRead)) {
          try {
            await markNotificationsRead();
            if (mounted) {
              setNotifications((current) =>
                current.map((item) => ({
                  ...item,
                  isRead: true,
                }))
              );
              onReadAll?.();
            }
          } catch {
            // Keep notifications visible even if mark-as-read fails.
          }
        } else {
          onReadAll?.();
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || 'Failed to load notifications');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [onReadAll]);

  const items = useMemo(
    () =>
      notifications.map((item) => ({
        ...item,
        ...getNotificationPresentation(item.type),
        timeLabel: formatNotificationTime(item.createdAt),
        exactTimeLabel: formatExactTime(item.createdAt),
        initials: getActorInitials(item.metadata, item.title),
        summaryMessage: buildSummaryMessage(item.message, item.metadata),
      })),
    [notifications]
  );

  const recentItems = items.filter((item) => !item.isRead);
  const earlierItems = items.filter((item) => item.isRead);

  const handleDeleteNotification = () => {
    if (!actionMenuItem) {
      return;
    }

    setNotifications((current) => current.filter((item) => item.id !== actionMenuItem.id));
    setExpandedId((current) => (current === actionMenuItem.id ? null : current));
    setActionMenuItem(null);
  };

  const handleReportNotification = () => {
    if (typeof window !== 'undefined' && actionMenuItem) {
      const subject = encodeURIComponent('Notification issue report');
      const body = encodeURIComponent(
        `Please review this notification:\n\nTitle: ${actionMenuItem.title}\nMessage: ${actionMenuItem.summaryMessage}\nTime: ${actionMenuItem.exactTimeLabel || actionMenuItem.timeLabel}`
      );
      window.location.href = `mailto:support@kapit.dev?subject=${subject}&body=${body}`;
    }
    setActionMenuItem(null);
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,1200px)]">
      <header className="mb-5">
        <p className="text-sm font-medium text-[var(--user-primary)]">Activity</p>
        <h1 className="user-workspace-page-title mt-1">Notifications</h1>
        <p className="mt-1 text-sm text-[var(--user-text-muted)]">Review messages, profile activity, and important account updates.</p>
      </header>

      {loading ? (
        <NotificationsSkeleton />
      ) : error ? (
        <StateBlock tone="error">{error}</StateBlock>
      ) : items.length > 0 ? (
        <div className="user-desktop-flat-surface overflow-hidden">
          {recentItems.length > 0 ? (
            <NotificationSection
              title="New"
              items={recentItems}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId((current) => (current === id ? null : id))}
              onOpenMenu={(item) => setActionMenuItem(item)}
            />
          ) : null}
          {earlierItems.length > 0 ? (
            <NotificationSection
              title={recentItems.length > 0 ? 'Earlier' : 'All notifications'}
              items={earlierItems}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId((current) => (current === id ? null : id))}
              onOpenMenu={(item) => setActionMenuItem(item)}
              withTopDivider={recentItems.length > 0}
            />
          ) : null}
        </div>
      ) : (
        <StateBlock>No notifications yet.</StateBlock>
      )}

      <NotificationActionSheet
        item={actionMenuItem}
        onClose={() => setActionMenuItem(null)}
        onDelete={handleDeleteNotification}
        onReport={handleReportNotification}
      />
    </div>
  );
}

function StateBlock({ children, tone = 'default' }) {
  const isError = tone === 'error';
  const Icon = isError ? AlertCircle : Bell;

  return (
    <div
      className={`user-desktop-flat-surface flex min-h-[360px] items-center justify-center px-6 py-12 text-center sm:px-8 ${
        isError
          ? 'border-red-200 bg-[#fff8f7] text-red-600 dark:border-red-900/50 dark:bg-[#22272b] dark:text-red-400'
          : 'border-[#c9d2bc] bg-[#f8fbf6] text-[#344e41] dark:border-[#353c44] dark:bg-[#22272b] dark:text-[#d0d7dd]'
      }`}
    >
      <div className="max-w-md">
        <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-md ${isError ? 'bg-red-50 text-[var(--user-danger)] dark:bg-red-950/30' : 'bg-[var(--user-primary-soft)] text-[var(--user-primary)]'}`}>
          <Icon className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-[var(--user-text-strong)]">{isError ? 'Notifications could not be loaded' : 'You are all caught up'}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--user-text-muted)]">{children}</p>
      </div>
    </div>
  );
}

function NotificationSection({ title, items, expandedId, onToggle, onOpenMenu, withTopDivider = false }) {
  return (
    <section className={withTopDivider ? 'border-t border-[var(--user-border)]' : ''}>
      <div className="px-5 pb-3 pt-5 sm:px-7">
        <h2 className="text-base font-semibold text-[var(--user-text-strong)]">{title}</h2>
      </div>
      <div>
        {items.map((item, index) => (
          <NotificationRow
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => onToggle(item.id)}
            onOpenMenu={() => onOpenMenu(item)}
            showDivider={index !== items.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function NotificationRow({ item, expanded, onToggle, onOpenMenu, showDivider }) {
  const {
    icon: Icon,
    badgeClass,
    title,
    summaryMessage,
    timeLabel,
    exactTimeLabel,
    isRead,
    metadata,
    initials,
  } = item;

  const actorLabel = metadata?.actorLabel || 'Someone';
  const messageCount = Number(metadata?.messageCount || 0);
  const viewCount = Number(metadata?.viewCount || 0);

  return (
    <div
      className={`px-4 sm:px-5 ${
        !isRead ? 'bg-[#eef3ea] dark:bg-[#1b314c]' : 'bg-transparent'
      }`}
    >
      <div className={`py-4 ${showDivider ? 'border-b border-[#dde4d4] dark:border-[#444d57]' : ''}`}>
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#dfe8d8] text-lg font-semibold text-[#2f4f39] dark:bg-[#24425d] dark:text-white">
              {initials}
            </div>
            <div className={`absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f6f5ef] dark:border-[#22272b] ${badgeClass}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <button type="button" onClick={onToggle} className="block w-full text-left">
              <p className="pr-3 text-[1.04rem] leading-7 text-[#203a28] dark:text-white">
                <span className="font-semibold">{title}</span>{' '}
                <span className="font-normal text-[#344e41] dark:text-[#e2e6e9]">{summaryMessage}</span>
              </p>
              <p className="mt-1 text-sm font-medium text-[#6b7c63] dark:text-[#b3bcc5]">{timeLabel}</p>
            </button>

            {expanded ? (
              <div className="mt-3 rounded-2xl border border-[#d8decf] bg-[#f8fbf2]/90 p-3 dark:border-[#444d57] dark:bg-[#202428]">
                <p className="text-sm text-[#344e41] dark:text-[#e2e6e9]">
                  <span className="font-semibold text-[#203a28] dark:text-white">Who:</span> {actorLabel}
                </p>
                <p className="mt-1 text-sm text-[#344e41] dark:text-[#e2e6e9]">
                  <span className="font-semibold text-[#203a28] dark:text-white">When:</span> {exactTimeLabel || 'Unknown time'}
                </p>
                {messageCount > 0 ? (
                  <p className="mt-1 text-sm text-[#344e41] dark:text-[#e2e6e9]">
                    <span className="font-semibold text-[#203a28] dark:text-white">Messages:</span> {messageCount}
                  </p>
                ) : null}
                {viewCount > 0 ? (
                  <p className="mt-1 text-sm text-[#344e41] dark:text-[#e2e6e9]">
                    <span className="font-semibold text-[#203a28] dark:text-white">Profile views:</span> {viewCount}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenMenu();
              }}
              className="rounded-full p-1.5 text-[#50644f] transition-colors hover:bg-[#e7ede1] dark:text-[#b3bcc5] dark:hover:bg-[#444d57]"
              aria-label="Open notification actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {!isRead ? <div className="h-3 w-3 rounded-full bg-[#588157] dark:bg-[#6f9b74]" /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationActionSheet({ item, onClose, onDelete, onReport }) {
  useEffect(() => {
    if (!item) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close notification actions"
        className="absolute inset-0 bg-black/42 xl:bg-black/45"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center px-0 pb-0 xl:inset-0 xl:px-6 xl:pb-6">
        <div className="w-screen max-w-none rounded-t-[32px] border-t border-[#bfd0af] bg-[#dad7cd] px-4 pb-6 pt-3 text-[#344e41] shadow-[0_-18px_42px_rgba(58,90,64,0.18)] xl:w-full xl:max-w-md xl:rounded-lg xl:border xl:border-[var(--user-border)] xl:bg-[var(--user-surface)] xl:text-[var(--user-text)] xl:shadow-[var(--user-elevated-shadow)] dark:border-[#444d57] dark:bg-[#1c2431] dark:text-white dark:xl:bg-[var(--user-surface)]">
          <div className="flex justify-center">
            <div className="h-1.5 w-12 rounded-full bg-[#b9c3b2] dark:bg-white/34 xl:hidden" />
          </div>

          <div className="px-6 pb-6 pt-5 text-center xl:px-8 xl:pb-5 xl:pt-4">
            <div className="mx-auto relative flex h-20 w-20 items-center justify-center overflow-visible rounded-full bg-[#dfe8d8] text-[1.75rem] font-semibold text-[#2f4f39] dark:bg-[#24425d] dark:text-white">
              {item.initials}
              <div className={`absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f6f5ef] dark:border-[#22272b] ${item.badgeClass}`}>
                <item.icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="mt-5 text-[1.02rem] leading-8 text-[#203a28] xl:text-[1.6rem] xl:leading-10 dark:text-white">
              <span className="font-medium xl:font-semibold">{item.title}</span>{' '}
              <span className="font-normal text-[#344e41] dark:text-[#e2e6e9]">{item.summaryMessage}</span>
            </p>
          </div>

          <div className="border-t border-[#ccd7bf] px-5 pb-[calc(1.25rem+max(env(safe-area-inset-bottom),5rem))] pt-5 dark:border-[#4b5560]">
            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-transparent dark:hover:bg-transparent"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#bfd0af] bg-[#eef6ee] text-[#3a5a40] dark:border-[#4b5560] dark:bg-[#31363d] dark:text-[#f0c766]">
                <Trash2 className="h-5 w-5" />
              </div>
              <span className="text-[1.05rem] font-semibold text-[#3a5a40] dark:text-white">Delete this notification</span>
            </button>
            <button
              type="button"
              onClick={onReport}
              className="flex w-full items-center gap-4 border-t border-[#d9dfcf] py-4 text-left transition-colors hover:bg-transparent dark:border-[#4b5560] dark:hover:bg-transparent"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#bfd0af] bg-[#eef6ee] text-[#3a5a40] dark:border-[#4b5560] dark:bg-[#31363d] dark:text-[#f0c766]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <span className="text-[1.05rem] font-semibold text-[#3a5a40] dark:text-white">Report issue to Notifications Team</span>
            </button>
          </div>

          <div className="hidden px-4 pb-4 pt-1 xl:block xl:px-6">
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#bfd0af] bg-[#f8fbf6]/92 px-4 py-3 text-sm font-semibold text-[#344e41] transition-colors hover:bg-[#f1f5eb] dark:border-[#4b5560] dark:bg-[#2f343b]/92 dark:text-[#e2e6e9] dark:hover:bg-[#2b3c52]"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
