import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Briefcase,
  ChevronDown,
  Crown,
  FolderKanban,
  HelpCircle,
  LogOut,
  Settings,
  Sparkles,
  TrendingUp,
  UserCircle2,
} from 'lucide-react';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';

function SectionRow({ icon: Icon, label, onClick, danger = false, expanded = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between border-t border-[#d9dfcf] px-1 py-5 text-left transition-colors dark:border-white/8 ${
        danger ? 'text-[#d14343] hover:text-[#b91c1c] dark:text-[#ff6b7a] dark:hover:text-[#ff8894]' : 'text-[#344e41] hover:text-[#3a5a40] dark:text-white dark:hover:text-white/80'
      }`}
    >
      <span className="flex items-center gap-4">
        <span className={`flex h-11 w-11 items-center justify-center rounded-full ${danger ? 'bg-red-50 dark:bg-[#3a2328]' : 'bg-[#eef6ee] dark:bg-white/8'}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-[1.05rem] font-medium">{label}</span>
      </span>
      {!danger ? <ChevronDown className={`h-5 w-5 text-[#5f6f52] transition-transform dark:text-white/70 ${expanded ? 'rotate-180' : ''}`} /> : null}
    </button>
  );
}

function ShortcutCard({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[7.25rem] flex-col items-start gap-4 rounded-[1.35rem] bg-[#f8fbf6] px-4 py-4 text-left text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:bg-[#34343a] dark:text-white dark:hover:bg-[#3b3b42]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#3a5a40] shadow-sm dark:bg-[#202126] dark:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-lg font-medium leading-tight">{label}</span>
    </button>
  );
}

function PromoCard({ title, description, accentClass, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="overflow-hidden rounded-[1.35rem] bg-[#f8fbf6] text-left transition-transform hover:-translate-y-0.5 dark:bg-[#34343a]"
    >
      <div className={`h-28 ${accentClass}`} />
      <div className="px-4 py-4">
        <p className="text-lg font-semibold text-[#3a5a40] dark:text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#5f6f52] dark:text-white/65">{description}</p>
      </div>
    </button>
  );
}

export default function UserMobileMenuDrawer({
  open,
  active,
  user,
  setMobileMenuOpen,
  onOpenMyProfile,
  onOpenProjects,
  onOpenSavedJobs,
  onOpenApplications,
  onOpenSettings,
  onOpenTips,
  onOpenVerifiedDirectory,
  onOpenPremium,
  onHelp,
  onLogout,
}) {
  const displayName = user?.fullName || user?.username || user?.email || 'User';
  const profileImage = user?.profileImage || '';
  const initial = displayName.charAt(0).toUpperCase();
  const userType = user?.type === 'company' || user?.accountType === 'company' ? 'company' : 'employee';
  const isPremium = !!user?.isPremium;
  const [helpSupportOpen, setHelpSupportOpen] = useState(false);
  const [settingsPrivacyOpen, setSettingsPrivacyOpen] = useState(false);
  const [professionalAccessOpen, setProfessionalAccessOpen] = useState(true);
  const [alsoFromKapItOpen, setAlsoFromKapItOpen] = useState(false);

  useEffect(() => {
    if (!open || !active) {
      return;
    }

    setHelpSupportOpen(false);
    setSettingsPrivacyOpen(false);
    setProfessionalAccessOpen(true);
    setAlsoFromKapItOpen(false);
  }, [open, active]);

  if (!open) return null;

  return (
    <div className={`xl:hidden fixed inset-0 z-[70] transition-all duration-300 ease-out ${active ? 'bg-black/35 backdrop-blur-sm opacity-100 dark:bg-black/55' : 'bg-black/0 opacity-0'}`}>
      <button type="button" className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" />
      <aside
        className={`absolute left-0 top-0 bottom-0 flex w-[min(88vw,25rem)] flex-col overflow-hidden bg-[#dad7cd] shadow-2xl dark:bg-[#1f2125] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          active ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
          <div className="rounded-[1.7rem] bg-white p-4 dark:bg-[#34343a]">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#588157] text-xl font-bold text-white dark:bg-[#4a4d55]">
                {profileImage ? <img src={profileImage} alt={`${displayName} avatar`} className="h-full w-full object-cover" /> : initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[1.15rem] font-semibold text-[#3a5a40] dark:text-white">{displayName}</p>
                  {isPremium ? <PremiumBadge compact /> : null}
                </div>
                <p className="mt-1 truncate text-sm text-[#5f6f52] dark:text-white/60">{userType === 'company' ? 'Company account' : 'Developer account'}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f2] text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:bg-[#2a2d33] dark:text-white/85 dark:hover:bg-[#31343b]"
                aria-label="Close menu"
              >
                <ChevronDown className="h-5 w-5 -rotate-90" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenMyProfile?.();
              }}
              className="mt-4 flex w-full items-center gap-3 rounded-[1.15rem] border-t border-[#d9dfcf] pt-4 text-left text-[#344e41] transition-colors hover:text-[#3a5a40] dark:border-white/8 dark:text-white/88 dark:hover:text-white"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6ee] dark:bg-white/8">
                <UserCircle2 className="h-5 w-5" />
              </span>
              <span className="text-lg font-medium">Open profile</span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <ShortcutCard
              icon={FolderKanban}
              label="Projects"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenProjects?.();
              }}
            />
            <ShortcutCard
              icon={Bookmark}
              label="Saved Jobs"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSavedJobs?.();
              }}
            />
            <ShortcutCard
              icon={Briefcase}
              label="Applications"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenApplications?.();
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenPremium?.();
            }}
            className="mt-5 flex w-full items-center justify-center rounded-[1.15rem] bg-[#3a5a40] px-4 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#3b3f46] dark:hover:bg-[#454a52]"
          >
            <span className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#f4c542]" />
              Upgrade Plan
            </span>
          </button>

          <div className="mt-6">
            <SectionRow
              icon={HelpCircle}
              label="Help and support"
              expanded={helpSupportOpen}
              onClick={() => setHelpSupportOpen((prev) => !prev)}
            />

            {helpSupportOpen ? (
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onHelp?.();
                  }}
                  className="flex w-full items-center gap-4 rounded-[1.2rem] bg-[#f8fbf6] px-4 py-4 text-left text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:bg-[#34343a] dark:text-white dark:hover:bg-[#3c4048]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#202126]">
                    <HelpCircle className="h-5 w-5" />
                  </span>
                  <span className="text-lg font-medium">Help Center</span>
                </button>
              </div>
            ) : null}

            <SectionRow
              icon={Settings}
              label="Settings and privacy"
              expanded={settingsPrivacyOpen}
              onClick={() => setSettingsPrivacyOpen((prev) => !prev)}
            />

            {settingsPrivacyOpen ? (
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSettings?.();
                  }}
                  className="flex w-full items-center gap-4 rounded-[1.2rem] bg-[#f8fbf6] px-4 py-4 text-left text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:bg-[#34343a] dark:text-white dark:hover:bg-[#3c4048]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#202126]">
                    <Settings className="h-5 w-5" />
                  </span>
                  <span className="text-lg font-medium">Settings</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <SectionRow
              icon={Sparkles}
              label="Professional access"
              expanded={professionalAccessOpen}
              onClick={() => setProfessionalAccessOpen((prev) => !prev)}
            />

            {professionalAccessOpen ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <PromoCard
                  title="Public presence"
                  description="Get tools to help you grow your visibility and stand out."
                  accentClass="bg-[radial-gradient(circle_at_30%_20%,#ff67c8,transparent_34%),linear-gradient(135deg,#2d3cff,#7f38ff)]"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMyProfile?.();
                  }}
                />
                <PromoCard
                  title={isPremium ? 'Premium active' : 'Premium tools'}
                  description={isPremium ? 'Your premium applicant tools are already active on this account.' : 'Unlock live premium tools like job match percentages and ATS-style resume analysis.'}
                  accentClass="bg-[radial-gradient(circle_at_50%_25%,#fff2a8,transparent_34%),linear-gradient(135deg,#62a3ff,#ffa3d6)]"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenPremium?.();
                  }}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <SectionRow
              icon={TrendingUp}
              label="Also from KapIT"
              expanded={alsoFromKapItOpen}
              onClick={() => setAlsoFromKapItOpen((prev) => !prev)}
            />

            {alsoFromKapItOpen ? (
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Tips', icon: Sparkles, onClick: onOpenTips },
                  { label: 'Verified Users & Companies', icon: Sparkles, onClick: onOpenVerifiedDirectory },
                ].map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onClick?.();
                    }}
                    className="flex w-full items-center gap-4 rounded-[1.2rem] bg-[#f8fbf6] px-4 py-4 text-left text-[#344e41] transition-colors hover:bg-[#eef6ee] dark:bg-[#34343a] dark:text-white dark:hover:bg-[#3c4048]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#202126]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-lg font-medium">{label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onLogout?.();
            }}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-[1.15rem] bg-white px-4 py-4 text-lg font-semibold text-[#d14343] transition-colors hover:bg-red-50 dark:bg-[#34343a] dark:text-white dark:hover:bg-[#3c4048]"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>
    </div>
  );
}
