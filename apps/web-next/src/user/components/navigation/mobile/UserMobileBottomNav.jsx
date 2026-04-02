import React from 'react';
import { Home, Briefcase, FolderKanban, MessageCircle, Bell } from 'lucide-react';

function MobileBottomNavButton({ icon: Icon, label, active, onClick, badgeCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        active
          ? 'bg-[#eef6ee] text-[#588157] shadow-sm shadow-[#588157]/10 dark:bg-[#1e3a5f] dark:text-[#3ba9d6] -translate-y-0.5'
          : 'text-[#344e41] dark:text-white'
      }`}
    >
      {badgeCount > 0 ? (
        <span className="absolute right-3 top-2 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[#d14343] text-white text-[10px] leading-none font-semibold flex items-center justify-center">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
      <Icon className={`w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? 'scale-105' : 'scale-100'}`} />
      <span className={`text-[11px] font-medium leading-none transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? 'translate-y-0' : 'translate-y-0.5'}`}>{label}</span>
    </button>
  );
}

export default function UserMobileBottomNav({ activeNav, setActiveNav, unreadNotificationCount = 0 }) {
  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#162842] border-t border-[#a3b18a] dark:border-[#1e3a5f] z-50">
      <div className="grid h-16 grid-cols-5 gap-1 px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <MobileBottomNavButton label="Home" icon={Home} active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
        <MobileBottomNavButton label="Jobs" icon={Briefcase} active={activeNav === 'jobs'} onClick={() => setActiveNav('jobs')} />
        <MobileBottomNavButton label="Projects" icon={FolderKanban} active={activeNav === 'projects'} onClick={() => setActiveNav('projects')} />
        <MobileBottomNavButton label="Messages" icon={MessageCircle} active={activeNav === 'messages'} onClick={() => setActiveNav('messages')} />
        <MobileBottomNavButton
          label="Alerts"
          icon={Bell}
          active={activeNav === 'notifications'}
          onClick={() => setActiveNav('notifications')}
          badgeCount={unreadNotificationCount}
        />
      </div>
    </div>
  );
}



