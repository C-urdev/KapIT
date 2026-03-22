import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronDown, Eye, MessageCircle } from 'lucide-react';
import { getNotifications, markNotificationsRead } from '@sharedServices/notificationsService';

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
    return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  }
  if (diffMs < day) {
    return `${Math.max(1, Math.floor(diffMs / hour))}h ago`;
  }
  if (diffMs < 7 * day) {
    return `${Math.max(1, Math.floor(diffMs / day))}d ago`;
  }

  return new Date(value).toLocaleDateString();
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

export default function UserNotificationsPage({ onReadAll }) {
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
      })),
    [notifications]
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">Notifications</h1>
        <p className="text-[#344e41] dark:text-[#b8d4e8]">See who viewed your profile and who messaged you.</p>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-10 text-center">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">Loading notifications...</p>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-[#162842] border border-red-200 dark:border-red-900/50 rounded-xl p-10 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
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
        <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-10 text-center">
          <p className="text-[#344e41] dark:text-[#b8d4e8]">No notifications yet.</p>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ icon: Icon, iconClass, title, message, time, exactTime, unread, metadata, expanded, onToggle }) {
  const actorLabel = metadata?.actorLabel || 'Someone';
  const messageCount = Number(metadata?.messageCount || 0);
  const viewCount = Number(metadata?.viewCount || 0);
  const summaryMessage =
    messageCount > 1
      ? `${actorLabel} messaged you (${messageCount} messages).`
      : message;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`border rounded-xl p-4 transition-colors ${
        unread
          ? 'bg-[#f5f5f2] dark:bg-[#1e3a5f] border-[#588157] dark:border-[#3ba9d6]'
          : 'bg-white dark:bg-[#162842] border-[#a3b18a] dark:border-[#1e3a5f]'
      } w-full text-left`}
    >
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-[#3a5a40] dark:text-white">{title}</h4>
            <div className="flex items-center gap-2">
              {unread ? <div className="w-2 h-2 bg-[#588157] dark:bg-[#3ba9d6] rounded-full flex-shrink-0" /> : null}
              <ChevronDown className={`w-4 h-4 text-[#3a5a40] dark:text-[#7d9ab8] transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
          <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mb-1">{summaryMessage}</p>
          <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">{time}</span>
          {expanded ? (
            <div className="mt-3 space-y-1 rounded-lg bg-white/70 dark:bg-[#0f2139] border border-[#d6d3c9] dark:border-[#2a4a6f] p-3">
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
