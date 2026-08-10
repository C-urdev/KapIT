import React from 'react';
import {
  Briefcase,
  CalendarDays,
  FileCheck2,
  FolderKanban,
  Home,
  LifeBuoy,
  MessageCircle,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import UserHomeProfileSidebar from '@userComponents/UserHomeProfileSidebar';
import KapITLogo from '@sharedComponents/branding/KapITLogo';

const USER_PROFILE_LINK_LABELS = [
  { label: 'My Profile' },
  { label: 'My Projects' },
  { label: 'Saved Jobs' },
  { label: 'Applications' },
];

export default function UserLeftSidebar({
  user,
  userType,
  collapsed,
  onToggleCollapsed,
  onOpenMyProfile,
  onOpenHelp,
  onOpenFeedback,
  activeNav,
  setActiveNav,
  onLogout,
}) {
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'applications', label: 'Applications', icon: FileCheck2 },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  ];

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className={`relative flex h-[68px] items-center border-b border-[var(--user-border)] px-4 ${collapsed ? 'group/sidebar-brand justify-center px-2' : 'justify-between'}`}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <KapITLogo className="h-6 w-auto" />
            <span className="text-[1.35rem] font-bold tracking-tight text-[var(--user-text-strong)]">KapIT</span>
          </div>
        ) : (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-[opacity,transform] duration-150 group-hover/sidebar-brand:scale-95 group-hover/sidebar-brand:opacity-0 group-focus-within/sidebar-brand:scale-95 group-focus-within/sidebar-brand:opacity-0"
            title="KapIT dashboard"
            aria-hidden="true"
          >
            <KapITLogo className="h-7 w-auto" />
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`flex h-8 w-8 items-center justify-center rounded-md text-[var(--user-text-muted)] transition-[background-color,color,opacity,transform] duration-150 hover:bg-[var(--user-surface)] hover:text-[var(--user-text-strong)] focus-visible:bg-[var(--user-surface)] focus-visible:text-[var(--user-text-strong)] ${
            collapsed
              ? 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/sidebar-brand:opacity-100 group-focus-within/sidebar-brand:opacity-100'
              : ''
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-6" aria-label="Main Navigation">
        <div className="space-y-1">
          {!collapsed ? (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--user-text-muted)]">Menu</p>
          ) : null}
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav?.(item.id)}
                className={`group relative flex h-10 w-full items-center rounded-lg px-3 text-sm font-medium transition-[background-color,color,transform] duration-150 ${
                  isActive
                    ? 'bg-[var(--user-surface-selected)] text-[var(--user-primary)]'
                    : 'text-[var(--user-text)] hover:bg-[var(--user-surface)] hover:text-[var(--user-text-strong)]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${collapsed ? '' : 'mr-3'} ${isActive ? 'text-[var(--user-primary)]' : 'text-[var(--user-text-muted)] group-hover:text-[var(--user-text-strong)]'}`} />
                {!collapsed && <span>{item.label}</span>}
                {item.badgeCount > 0 && (
                  <span className={`absolute flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#e63946] px-1 text-[10px] font-bold text-white ${
                    collapsed ? 'right-1 top-1' : 'right-2 top-1/2 -translate-y-1/2'
                  }`}>
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-10 space-y-1">
          {!collapsed ? (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--user-text-muted)]">More</p>
          ) : null}
          <SidebarUtilityButton
            label="Help Center"
            icon={LifeBuoy}
            collapsed={collapsed}
            active={activeNav === 'help'}
            onClick={onOpenHelp}
          />
          <SidebarUtilityButton
            label="Feedback"
            icon={MessageSquare}
            collapsed={collapsed}
            active={activeNav === 'feedback'}
            onClick={onOpenFeedback}
          />
        </div>

        <div className="hidden">
           {USER_PROFILE_LINK_LABELS.map(s => <span key={s.label}>{s.label}</span>)}
        </div>
      </nav>

      <div className="p-4 flex-shrink-0">
        {!collapsed ? (
          <UserHomeProfileSidebar user={user} userType={userType} onOpenMyProfile={onOpenMyProfile} onLogout={onLogout} />
        ) : (
          <button
            onClick={onOpenMyProfile}
            className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-[var(--user-surface)] border border-[var(--user-border)] transition-colors hover:border-[var(--user-primary)] overflow-hidden"
            title="My Profile"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[#588157] flex items-center justify-center text-white text-sm font-bold">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarUtilityButton({ icon: Icon, label, active = false, collapsed = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-10 w-full items-center rounded-lg px-3 text-sm font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.98] ${
        active
          ? 'bg-[var(--user-surface-selected)] text-[var(--user-primary)]'
          : 'text-[var(--user-text)] hover:bg-[var(--user-surface)] hover:text-[var(--user-text-strong)]'
      } ${collapsed ? 'justify-center px-0' : ''}`}
      title={collapsed ? label : undefined}
      aria-label={label}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${collapsed ? '' : 'mr-3'} ${active ? 'text-[var(--user-primary)]' : 'text-[var(--user-text-muted)] group-hover:text-[var(--user-text-strong)]'}`} />
      {!collapsed ? <span>{label}</span> : null}
    </button>
  );
}
