// NotificationsPage 

import React from 'react';
import { Users, Award } from 'lucide-react';

export default function NotificationsPage({ user }) {
  const isNaitAccount = user?.email?.toLowerCase() === 'nait@gmail.com';
  const notifications = isNaitAccount
    ? [
        {
          icon: Users,
          iconColor: 'blue',
          title: 'New follower',
          message: 'Brian Gomez started following you',
          time: '2 hours ago',
          unread: true,
        },
        {
          icon: Award,
          iconColor: 'yellow',
          title: 'Your profile viewed',
          message: 'Your profile was viewed by 12 recruiters this week',
          time: '1 day ago',
          unread: false,
        },
      ]
    : [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#3a5a40] dark:text-white mb-2">Notifications</h1>
        <p className="text-[#344e41] dark:text-[#b8d4e8]">Stay updated with your activity</p>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((item) => (
            <NotificationItem
              key={`${item.title}-${item.time}`}
              icon={item.icon}
              iconColor={item.iconColor}
              title={item.title}
              message={item.message}
              time={item.time}
              unread={item.unread}
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

function NotificationItem({ icon: Icon, iconColor, title, message, time, unread }) {
  const colorClasses = {
    blue: 'bg-[#f5f5f2] dark:bg-[#1e3a5f] text-[#588157] dark:text-[#3ba9d6]',
    yellow: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div className={`bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl p-4 hover:border-[#588157] dark:hover:border-[#3ba9d6] transition-colors cursor-pointer ${
      unread ? 'bg-[#f5f5f2] dark:bg-[#1e3a5f]' : ''
    }`}>
      <div className="flex gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClasses[iconColor]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-[#3a5a40] dark:text-white">{title}</h4>
            {unread && (
              <div className="w-2 h-2 bg-[#588157] dark:bg-[#3ba9d6] rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mb-1">{message}</p>
          <span className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">{time}</span>
        </div>
      </div>
    </div>
  );
}
