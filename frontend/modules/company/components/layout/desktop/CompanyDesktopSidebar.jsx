import React from 'react';
import {
  BriefcaseBusiness,
  ChevronsUpDown,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

const MAIN_LINKS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: COMPANY_PATHS.dashboard },
  { label: 'Jobs', icon: BriefcaseBusiness, path: COMPANY_PATHS.jobs },
  { label: 'Applicants', icon: Users, path: COMPANY_PATHS.applicants },
  { label: 'Talent Search', icon: Search, path: COMPANY_PATHS.search },
  { label: 'Messages', icon: MessageCircle, path: COMPANY_PATHS.messages },
];

export default function CompanyDesktopSidebar({
  activePath,
  collapsed = false,
  user,
  onHelp,
  onLogout,
  onToggleSidebarCollapsed,
}) {
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const profileMenuRef = React.useRef(null);
  const companyName = user?.companyName || user?.username || 'Company';
  const profileImage = user?.profileImage || '';
  const initial = companyName.trim().charAt(0).toUpperCase() || 'C';

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
    <aside
      className={`hidden shrink-0 border-r border-[var(--workspace-border)] bg-[var(--workspace-appbar)] transition-[width] duration-200 ease-out xl:sticky xl:top-0 xl:flex xl:h-[100dvh] xl:flex-col ${
        collapsed ? 'w-[4.5rem]' : 'w-72'
      }`}
    >
      <div className={`flex h-[68px] shrink-0 items-center border-b border-[var(--workspace-border)] px-4 ${collapsed ? 'justify-center px-2' : 'justify-between'}`}>
        {!collapsed ? (
          <button type="button" onClick={() => navigate(COMPANY_PATHS.dashboard)} className="flex items-center gap-2" aria-label="Open company dashboard">
            <KapITLogo className="h-6 w-auto" />
            <span className="text-[1.35rem] font-bold text-[var(--workspace-text-strong)]">KapIT</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={onToggleSidebarCollapsed}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors duration-150 hover:bg-[var(--workspace-surface-selected)] hover:text-[var(--workspace-text-strong)]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-6" aria-label="Company navigation">
        <NavGroupLabel collapsed={collapsed}>Menu</NavGroupLabel>
        <div className="space-y-1">
          {MAIN_LINKS.map((item) => (
            <SidebarLink
              key={item.path}
              item={item}
              active={activePath === item.path}
              collapsed={collapsed}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>

        <div className="mt-10 space-y-1">
          <NavGroupLabel collapsed={collapsed}>More</NavGroupLabel>
          <SidebarLink
            item={{ label: 'Settings', icon: Settings }}
            active={activePath === COMPANY_PATHS.settings || String(activePath || '').startsWith(`${COMPANY_PATHS.settings}/`)}
            collapsed={collapsed}
            onClick={() => navigate(COMPANY_PATHS.settings)}
          />
          <SidebarLink
            item={{ label: 'Help Center', icon: CircleHelp }}
            collapsed={collapsed}
            onClick={() => onHelp?.()}
          />
        </div>
      </nav>

      <div ref={profileMenuRef} className="relative shrink-0 p-4">
        {profileMenuOpen ? (
          <div className={`absolute bottom-[calc(100%-0.5rem)] z-30 w-52 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-surface)] p-1.5 shadow-[var(--workspace-elevated-shadow)] ${collapsed ? 'left-3' : 'right-4'}`}>
            <ProfileMenuButton
              icon={LogOut}
              label="Log out"
              danger
              onClick={() => {
                setProfileMenuOpen(false);
                onLogout?.();
              }}
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setProfileMenuOpen((open) => !open)}
          className={`flex w-full items-center rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-surface)] text-left transition-[background-color,border-color,transform] duration-150 hover:border-[var(--workspace-border-strong)] hover:bg-[var(--workspace-surface-subtle)] active:scale-[0.98] ${
            collapsed ? 'h-10 justify-center px-0' : 'gap-3 px-3 py-2.5'
          }`}
          aria-label="Open company account menu"
          aria-expanded={profileMenuOpen}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--workspace-primary)] text-sm font-semibold text-white">
            {profileImage ? <img src={profileImage} alt={`${companyName} logo`} className="h-full w-full object-cover" /> : initial}
          </span>
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[var(--workspace-text-strong)]">{companyName}</span>
                <span className="block truncate text-[11px] text-[var(--workspace-text-muted)]">Employer</span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-text-muted)]" />
            </>
          ) : null}
        </button>
      </div>
    </aside>
  );
}

function NavGroupLabel({ collapsed, children }) {
  if (collapsed) return null;
  return <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--workspace-text-muted)]">{children}</p>;
}

function SidebarLink({ item, active = false, collapsed, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-10 w-full items-center rounded-lg px-3 text-sm font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.98] ${
        active
          ? 'bg-[var(--workspace-surface-selected)] text-[var(--workspace-primary)]'
          : 'text-[var(--workspace-text)] hover:bg-[var(--workspace-surface-subtle)] hover:text-[var(--workspace-text-strong)]'
      } ${collapsed ? 'justify-center px-0' : ''}`}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={`h-[18px] w-[18px] shrink-0 ${collapsed ? '' : 'mr-3'} ${active ? 'text-[var(--workspace-primary)]' : 'text-[var(--workspace-text-muted)] group-hover:text-[var(--workspace-text-strong)]'}`} />
      {!collapsed ? <span>{item.label}</span> : null}
    </button>
  );
}

function ProfileMenuButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150 ${
        danger
          ? 'text-[var(--workspace-danger)] hover:bg-red-500/10'
          : 'text-[var(--workspace-text)] hover:bg-[var(--workspace-surface-selected)] hover:text-[var(--workspace-text-strong)]'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
