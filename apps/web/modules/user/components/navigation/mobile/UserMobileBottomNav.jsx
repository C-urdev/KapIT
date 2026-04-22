import React from 'react';
import { Home, Briefcase, FolderKanban, MessageCircle, Bell } from 'lucide-react';

function MobileBottomNavButton({ icon: Icon, label, active, onClick, badgeCount = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 transition-colors duration-150 ease-out ${
        active
          ? 'bg-[#eef6ee] text-[#588157] shadow-sm shadow-[#588157]/10 dark:bg-white/10 dark:text-white dark:shadow-[0_10px_24px_rgba(0,0,0,0.18)]'
          : 'text-[#344e41] dark:text-white/72'
      }`}
    >
      {badgeCount > 0 ? (
        <span className="absolute right-2 top-1.5 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-[#ff375f] text-white text-[10px] leading-none font-semibold flex items-center justify-center">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
      <Icon className={`w-5 h-5 transition-transform duration-150 ease-out ${active ? 'scale-[1.02]' : 'scale-100'}`} />
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </button>
  );
}

export default function UserMobileBottomNav({ activeNav, setActiveNav, unreadNotificationCount = 0, hiddenOnScroll = false }) {
  return (
    <div
      className={`xl:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#a3b18a] bg-[#f8fbf6]/95 backdrop-blur-xl transition-transform duration-150 ease-out dark:border-white/10 dark:bg-[#1c1f24]/95 ${
        hiddenOnScroll ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="grid grid-cols-5 gap-1 px-2 pt-0.5" style={{ paddingBottom: 'max(0.2rem, env(safe-area-inset-bottom))' }}>
        <MobileBottomNavButton label="Home" icon={Home} active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
        <MobileBottomNavButton label="Jobs" icon={Briefcase} active={activeNav === 'jobs'} onClick={() => setActiveNav('jobs')} />
        <MobileBottomNavButton label="Projects" icon={FolderKanban} active={activeNav === 'projects'} onClick={() => setActiveNav('projects')} />
        <MobileBottomNavButton label="Messages" icon={MessageCircle} active={activeNav === 'messages'} onClick={() => setActiveNav('messages')} />
        <MobileBottomNavButton
          label="Notifications"
          icon={Bell}
          active={activeNav === 'notifications'}
          onClick={() => setActiveNav('notifications')}
          badgeCount={unreadNotificationCount}
        />
      </div>
    </div>
  );
}



