import React from 'react';
import { Home, Briefcase, FolderKanban, MessageCircle, Bell } from 'lucide-react';

function MobileBottomNavButton({ icon: Icon, active, onClick, badgeCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 transition-colors ${
        active ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#344e41] dark:text-white'
      }`}
    >
      <span className="relative">
        <Icon className="w-6 h-6" />
        {badgeCount > 0 ? (
          <span className="absolute -top-2 -right-3 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#d14343] text-white text-[10px] leading-none font-semibold flex items-center justify-center">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export default function UserMobileBottomNav({ activeNav, setActiveNav, unreadNotificationCount = 0 }) {
  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#162842] border-t border-[#a3b18a] dark:border-[#1e3a5f] z-50">
      <div className="max-w-md mx-auto h-16 px-2 flex justify-center">
        <div className="w-full flex justify-between items-center">
          <MobileBottomNavButton icon={Home} active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
          <MobileBottomNavButton icon={Briefcase} active={activeNav === 'jobs'} onClick={() => setActiveNav('jobs')} />
          <MobileBottomNavButton icon={FolderKanban} active={activeNav === 'projects'} onClick={() => setActiveNav('projects')} />
          <MobileBottomNavButton icon={MessageCircle} active={activeNav === 'messages'} onClick={() => setActiveNav('messages')} />
          <MobileBottomNavButton
            icon={Bell}
            active={activeNav === 'notifications'}
            onClick={() => setActiveNav('notifications')}
            badgeCount={unreadNotificationCount}
          />
        </div>
      </div>
    </div>
  );
}



