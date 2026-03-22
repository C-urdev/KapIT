import React from 'react';
import { LayoutDashboard, Briefcase, Users, Building2, Settings, PanelLeftClose, PanelLeftOpen, MessageCircle } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

const LINKS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: COMPANY_PATHS.dashboard },
  { key: 'jobs', label: 'Manage Jobs', icon: Briefcase, path: COMPANY_PATHS.jobs },
  { key: 'applicants', label: 'Applicants', icon: Users, path: COMPANY_PATHS.applicants },
  { key: 'messages', label: 'Messages', icon: MessageCircle, path: COMPANY_PATHS.messages },
  { key: 'profile', label: 'Company Profile', icon: Building2, path: COMPANY_PATHS.profile },
];

function SidebarButton({ collapsed, active = false, label, title, onClick, icon, text }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center rounded-xl border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        collapsed ? 'justify-center px-0 py-2' : 'justify-start gap-3 px-4 py-3'
      } ${
        active
          ? 'bg-[#eef6ee] dark:bg-[#1e3a5f] border-[#588157] dark:border-[#3ba9d6] text-[#3a5a40] dark:text-white'
          : 'bg-transparent border-transparent text-[#344e41] dark:text-[#b8d4e8] hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] hover:border-[#a3b18a] dark:hover:border-[#2a4a6f]'
      }`}
      aria-label={label}
      title={title || (collapsed ? label : undefined)}
    >
      <span className="shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">{icon}</span>
      <span
        className={`overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 ease-out ${
          collapsed ? 'max-w-0 opacity-0 -translate-x-1' : 'max-w-[160px] opacity-100 translate-x-0'
        }`}
      >
        {text}
      </span>
    </button>
  );
}

export default function CompanyDesktopSidebar({ activePath, collapsed = false, onToggleCollapsed }) {
  return (
    <aside className={`hidden xl:flex fixed top-20 bottom-0 left-0 flex-col bg-white dark:bg-[#162842] transition-[width,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-40 ${collapsed ? 'w-16' : 'w-72'}`}>
      <div className="h-1 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6]" />
      <nav className={`py-4 space-y-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed ? 'px-2' : 'px-5'}`}>
        {LINKS.map((link) => {
          const isActive = activePath === link.path;
          const Icon = link.icon;
          return (
            <SidebarButton
              key={link.key}
              collapsed={collapsed}
              active={isActive}
              label={link.label}
              onClick={() => navigate(link.path)}
              icon={<Icon className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} ${isActive ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#4b5563] dark:text-[#7d9ab8]'} transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`} />}
              text={link.label}
            />
          );
        })}
      </nav>

      <div className={`mt-auto pb-5 space-y-2 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${collapsed ? 'px-2' : 'px-5'}`}>
        <SidebarButton
          collapsed={collapsed}
          active={activePath === COMPANY_PATHS.profile}
          label="Settings"
          onClick={() => navigate(COMPANY_PATHS.profile)}
          icon={<Settings className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} ${activePath === COMPANY_PATHS.profile ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#4b5563] dark:text-[#7d9ab8]'} transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`} />}
          text="Settings"
        />

        <SidebarButton
          collapsed={collapsed}
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleCollapsed}
          icon={collapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-[#4b5563] dark:text-[#7d9ab8] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-[#4b5563] dark:text-[#7d9ab8] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
          )}
          text="Collapse sidebar"
        />
      </div>
    </aside>
  );
}



