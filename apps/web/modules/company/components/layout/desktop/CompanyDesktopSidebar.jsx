import React from 'react';
import { CircleHelp, LayoutDashboard, Briefcase, MessageCircle, LogOut, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Settings, WalletCards } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

const LINKS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: COMPANY_PATHS.dashboard },
  { key: 'jobs', label: 'Manage Jobs', icon: Briefcase, path: COMPANY_PATHS.jobs },
  { key: 'messages', label: 'Messages', icon: MessageCircle, path: COMPANY_PATHS.messages },
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

export default function CompanyDesktopSidebar({ activePath, collapsed = false, user, onHelp, onLogout, onOpenPricing, onToggleSidebarCollapsed }) {
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [profileHovered, setProfileHovered] = React.useState(false);
  const profileMenuRef = React.useRef(null);
  const companyName = user?.companyName || user?.username || 'Company';
  const profileImage = user?.profileImage || '';
  const initial = companyName.charAt(0).toUpperCase();

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <aside className={`hidden xl:flex fixed top-20 bottom-0 left-0 flex-col bg-[#f8fbf6] dark:bg-[#162842] transition-[width,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-40 ${collapsed ? 'w-16' : 'w-72'}`}>
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
              icon={
                <span className="relative inline-flex">
                  <Icon className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} ${isActive ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#4b5563] dark:text-[#7d9ab8]'} transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]`} />
                </span>
              }
              text={link.label}
            />
          );
        })}
      </nav>

      <div className={`mt-auto border-t border-[#d9dfcf] dark:border-[#2a4a6f] pb-5 pt-4 ${collapsed ? 'px-2' : 'px-4'}`}>
        <div className="space-y-2">
          <SidebarButton
            collapsed={collapsed}
            active={activePath === COMPANY_PATHS.settings || String(activePath || '').startsWith(`${COMPANY_PATHS.settings}/`)}
            label="Settings"
            onClick={() => navigate(COMPANY_PATHS.settings)}
            icon={<Settings className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} text-[#4b5563] dark:text-[#7d9ab8]`} />}
            text="Settings"
          />
          <SidebarButton
            collapsed={collapsed}
            label="Help"
            onClick={() => onHelp?.()}
            icon={<CircleHelp className={`${collapsed ? 'w-4 h-4' : 'w-5 h-5'} text-[#4b5563] dark:text-[#7d9ab8]`} />}
            text="Help"
          />
        </div>

        <div
          ref={profileMenuRef}
          className={`relative mt-3 rounded-xl border border-[#d9dfcf] bg-[#f5f5f2] p-2 dark:border-[#2a4a6f] dark:bg-[#102235] ${collapsed ? 'px-1.5' : 'px-2.5'}`}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
            <div
              onMouseEnter={() => setProfileHovered(true)}
              onMouseLeave={() => setProfileHovered(false)}
              className={`relative min-w-0 ${collapsed ? 'h-9 w-9' : 'h-10 flex-1'}`}
            >
              <div className={`absolute inset-0 flex min-w-0 items-center gap-2 transition-all duration-200 ${profileHovered ? 'pointer-events-none translate-y-1 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] font-bold text-white dark:bg-[#3ba9d6]">
                  {profileImage ? <img src={profileImage} alt={`${companyName} logo`} className="h-full w-full object-cover" /> : initial}
                </div>
                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#3a5a40] dark:text-white">{companyName}</p>
                    <p className="text-xs text-[#5f6f52] dark:text-[#9fb4ca]">Employer</p>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => onToggleSidebarCollapsed?.()}
                className={`absolute inset-0 inline-flex items-center gap-2 rounded-lg px-2 text-left text-sm font-medium text-[#344e41] transition-all duration-200 hover:bg-[#eef6ee] dark:text-white dark:hover:bg-[#1e3a5f] ${collapsed ? 'justify-center px-0' : 'justify-start'} ${profileHovered ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-1'}`}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                {!collapsed ? <span>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span> : null}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#4b5563] transition-colors hover:bg-[#eef6ee] hover:text-[#344e41] dark:text-[#b8d4e8] dark:hover:bg-[#1e3a5f] dark:hover:text-white"
              aria-label="Open company profile menu"
              aria-expanded={profileMenuOpen}
            >
              <MoreHorizontal className="h-4.5 w-4.5" />
            </button>
          </div>

          {profileMenuOpen ? (
            <div className={`absolute bottom-full mb-2 w-48 rounded-xl border border-[#a3b18a] bg-[#f8fbf6] p-1.5 shadow-[0_16px_38px_rgba(58,90,64,0.2)] dark:border-[#2a4a6f] dark:bg-[#162842] ${collapsed ? 'left-0' : 'right-0'}`}>
              <MenuButton
                icon={<WalletCards className="h-4 w-4" />}
                label="Pricing"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onOpenPricing?.();
                }}
              />
              <MenuButton
                icon={<LogOut className="h-4 w-4" />}
                label="Log out"
                tone="danger"
                onClick={() => {
                  setProfileMenuOpen(false);
                  onLogout?.();
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function MenuButton({ icon, label, onClick, tone = 'default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
        tone === 'danger'
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
          : 'text-[#344e41] hover:bg-[#eef6ee] dark:text-white dark:hover:bg-[#1e3a5f]'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
