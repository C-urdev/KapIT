import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronDown, Eye, MessageCircle } from 'lucide-react';
import { getNotifications, markNotificationsRead } from '@sharedServices/notificationsService';

const formatNotificationTime = (value) => {
  if (!value) return '';

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '';

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.max(1, Math.floor(diffMs / hour))}h ago`;
  if (diffMs < 7 * day) return `${Math.max(1, Math.floor(diffMs / day))}d ago`;

  return new Date(value).toLocaleDateString();
};

const formatExactTime = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return '';
  return parsed.toLocaleString();
};

const getNotificationPresentation = (type) => {
  switch (type) {
    case 'message':
      return {
        icon: MessageCircle,
        iconClass: 'bg-[#eef6ee] dark:bg-[#1e3a5f] text-[#588157] dark:text-[#3ba9d6]',
      };
    case 'profile_view':
      return {
        icon: Eye,
        iconClass: 'bg-[#f7f0dd] dark:bg-yellow-950/40 text-[#c58b00] dark:text-yellow-400',
      };
    default:
      return {
        icon: Bell,
        iconClass: 'bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#588157] dark:text-[#3ba9d6]',
      };
  }
};

export default function CompanyNotificationsPage({ onReadAll }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        setError('');
        const items = await getNotifications();
        if (!mounted) return;

        setNotifications(items);

        if (items.some((item) => !item.isRead)) {
          try {
            await markNotificationsRead();
            if (mounted) {
              setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
              onReadAll?.();
            }
          } catch {
            // Keep data visible even if marking read fails.
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
      })),
    [notifications]
  );

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">Notifications</h1>
        <p className="text-[#344e41] dark:text-[#b8d4e8]">Keep up with developer messages, profile views, and company activity.</p>
      </div>

      {loading ? (
        <StateCard>Loading notifications...</StateCard>
      ) : error ? (
        <StateCard tone="error">{error}</StateCard>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <NotificationItem
              key={item.id}
              icon={item.icon}
              iconClass={item.iconClass}
              title={item.title}
              message={item.message}
              time={item.timeLabel}
              exactTime={item.exactTimeLabel}
              unread={!item.isRead}
              metadata={item.metadata}
              expanded={expandedId === item.id}
              onToggle={() => setExpandedId((current) => (current === item.id ? null : item.id))}
            />
          ))}
        </div>
      ) : (
        <StateCard>No notifications yet.</StateCard>
      )}
    </div>
  );
}

function StateCard({ children, tone = 'default' }) {
  return (
    <div
      className={`rounded-xl border p-10 text-center ${
        tone === 'error'
          ? 'bg-white dark:bg-[#162842] border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
          : 'bg-white dark:bg-[#162842] border-[#a3b18a] dark:border-[#1e3a5f] text-[#344e41] dark:text-[#b8d4e8]'
      }`}
    >
      <p>{children}</p>
    </div>
  );
}

function NotificationItem({ icon: Icon, iconClass, title, message, time, exactTime, unread, metadata, expanded, onToggle }) {
  const actorLabel = metadata?.actorLabel || 'Someone';
  const messageCount = Number(metadata?.messageCount || 0);
  const viewCount = Number(metadata?.viewCount || 0);
  const summaryMessage = messageCount > 1 ? `${actorLabel} messaged you (${messageCount} messages).` : message;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        unread
          ? 'bg-[#f5f5f2] dark:bg-[#1e3a5f] border-[#588157] dark:border-[#3ba9d6]'
          : 'bg-white dark:bg-[#162842] border-[#a3b18a] dark:border-[#1e3a5f]'
      }`}
    >
      <div className="flex gap-4">
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h4 className="font-semibold text-[#3a5a40] dark:text-white">{title}</h4>
            <div className="flex items-center gap-2">
              {unread ? <div className="h-2 w-2 flex-shrink-0 rounded-full bg-[#588157] dark:bg-[#3ba9d6]" /> : null}
              <ChevronDown className={`h-4 w-4 text-[#3a5a40] dark:text-[#7d9ab8] transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <p className="mb-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">{summaryMessage}</p>
          <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">{time}</span>
          {expanded ? (
            <div className="mt-3 space-y-1 rounded-lg border border-[#d6d3c9] bg-white/70 p-3 dark:border-[#2a4a6f] dark:bg-[#0f2139]">
              <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">
                <span className="font-semibold text-[#3a5a40] dark:text-white">Who:</span> {actorLabel}
              </p>
              <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">
                <span className="font-semibold text-[#3a5a40] dark:text-white">When:</span> {exactTime || 'Unknown time'}
              </p>
              {messageCount > 0 ? (
                <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">
                  <span className="font-semibold text-[#3a5a40] dark:text-white">Messages:</span> {messageCount}
                </p>
              ) : null}
              {viewCount > 0 ? (
                <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">
                  <span className="font-semibold text-[#3a5a40] dark:text-white">Profile views:</span> {viewCount}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}
