import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Moon, Sun, UserRound, BriefcaseBusiness, FileText, LifeBuoy, UsersRound, ShieldCheck, CircleHelp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Link from '../../../../components/shared/Link';
import { useTheme } from '@sharedContext/ThemeContext';
import KapITLogo from '@sharedComponents/branding/KapITLogo';

const TOP_NAV_LINKS = [
  { label: 'Solutions', hasDropdown: true, footerItem: 'Find talent' },
  { label: 'Resources', hasDropdown: true, footerItem: 'Help Center' },
  { label: 'Pricing', hasDropdown: false, href: '/pricing', footerItem: 'Pricing' },
  // Keep docs access in-platform until a dedicated /docs route exists.
  { label: 'Documentation', hasDropdown: false, footerItem: 'Help Center' },
];

const TOP_NAV_DROPDOWNS = {
  Solutions: [
    {
      heading: 'DEVELOPERS',
      items: [
        {
          title: 'Create profile',
          description: 'Build your profile to get matched with opportunities.',
          footerItem: 'Create profile',
          icon: UserRound,
        },
        {
          title: 'Portfolios',
          description: 'Showcase your projects, skills, and achievements.',
          footerItem: 'Portfolios',
          icon: FileText,
        },
        {
          title: 'Projects',
          description: 'Join projects and collaborate with hiring companies.',
          footerItem: 'Projects',
          icon: BriefcaseBusiness,
        },
      ],
    },
  ],
  Resources: [
    {
      heading: 'QUICK LINKS',
      items: [
        { title: 'Help Center', description: 'Find answers and platform guides', footerItem: 'Help Center', icon: LifeBuoy },
        { title: 'Community', description: 'Product updates and collaboration', footerItem: 'Community', icon: UsersRound },
        { title: 'Safety', description: 'Security, trust, and best practices', footerItem: 'Safety', icon: ShieldCheck },
        { title: 'FAQ', description: 'Latest answers to common questions', footerItem: 'FAQ', icon: CircleHelp },
      ],
    },
  ],
};

export default function SiteTopNav({
  onLogoClick,
  logoHref = '/',
  onSignIn,
  onGetStarted: _onGetStarted,
  signInHref = '/auth/login',
  getStartedHref: _getStartedHref = '/auth/register',
}) {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [openHeaderDropdown, setOpenHeaderDropdown] = useState(null);
  const [selectedTopNavLabel, setSelectedTopNavLabel] = useState(() => (pathname === '/pricing' ? 'Pricing' : null));
  const [isScrolled, setIsScrolled] = useState(false);
  const headerDropdownCloseTimerRef = useRef(null);
  const navMenuRef = useRef(null);

  const handleTopNavClick = (footerItem) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('kapit:footer-info-open', { detail: { item: footerItem } }));
  };

  const handleHeaderDropdownOpen = (label) => {
    if (headerDropdownCloseTimerRef.current) {
      window.clearTimeout(headerDropdownCloseTimerRef.current);
      headerDropdownCloseTimerRef.current = null;
    }
    setSelectedTopNavLabel(null);
    setOpenHeaderDropdown(label);
  };

  const handleHeaderDropdownClose = () => {
    if (headerDropdownCloseTimerRef.current) {
      window.clearTimeout(headerDropdownCloseTimerRef.current);
    }
    headerDropdownCloseTimerRef.current = window.setTimeout(() => {
      setOpenHeaderDropdown(null);
      headerDropdownCloseTimerRef.current = null;
    }, 120);
  };

  const handleHeaderTopLinkClick = (link) => {
    if (link.hasDropdown) {
      setSelectedTopNavLabel(null);
      setOpenHeaderDropdown((current) => (current === link.label ? null : link.label));
      return;
    }
    setSelectedTopNavLabel(link.label);
    setOpenHeaderDropdown(null);
    if (link.href) {
      window.location.href = link.href;
      return;
    }
    handleTopNavClick(link.footerItem);
  };

  useEffect(() => {
    if (pathname === '/pricing') {
      setSelectedTopNavLabel('Pricing');
      return;
    }

    setSelectedTopNavLabel((current) => (current === 'Pricing' ? null : current));
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOutsidePointerDown = (event) => {
      if (!openHeaderDropdown) return;
      if (navMenuRef.current?.contains(event.target)) return;
      setOpenHeaderDropdown(null);
    };

    window.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => window.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [openHeaderDropdown]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (headerDropdownCloseTimerRef.current) {
        window.clearTimeout(headerDropdownCloseTimerRef.current);
      }
    };
  }, []);

  const renderActionButton = (label, href, onClick, className) => {
    if (onClick) {
      return (
        <button type="button" onClick={onClick} className={className}>
          {label}
        </button>
      );
    }

    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  };

  const isDarkTheme = theme === 'dark';
  const brandTitleClass = isDarkTheme ? 'text-white' : 'text-[#344e41]';
  const brandLinkClass = isDarkTheme
    ? 'group flex items-center gap-3.5 rounded-full py-1 pr-3 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fb995]'
    : 'group flex items-center gap-3.5 rounded-full py-1 pr-3 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3a5a40]';
  const logoClass = isDarkTheme
    ? 'h-11 w-11 rounded-xl border border-white/10 bg-white object-contain p-1 shadow-[0_12px_24px_rgba(0,0,0,0.24)]'
    : 'h-11 w-11 rounded-xl border border-[#d7e2ce] bg-white object-contain p-1 shadow-[0_12px_24px_rgba(58,90,64,0.16)]';
  const activeNavLinkClass = isDarkTheme
    ? 'border border-white/10 bg-[#202428]/90 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_22px_rgba(0,0,0,0.24)] backdrop-blur-xl'
    : 'border border-[#dce6d4] bg-white/86 text-[#344e41] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(58,90,64,0.13)] backdrop-blur-xl';
  const inactiveNavLinkClass = isDarkTheme
    ? 'text-[#d0d7dd] hover:text-white'
    : 'text-[#344e41] hover:text-[#102a1b]';
  const hoverNavLinkClass = isDarkTheme
    ? 'hover:border hover:border-white/10 hover:bg-[#202428]/90 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_22px_rgba(0,0,0,0.24)] hover:backdrop-blur-xl'
    : 'hover:border hover:border-[#dce6d4] hover:bg-white/86 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(58,90,64,0.13)] hover:backdrop-blur-xl';
  const dropdownPanelClass = isDarkTheme
    ? 'border-white/10 bg-[#202428]/95 shadow-[0_22px_60px_rgba(0,0,0,0.44)]'
    : 'border-[#dfe7d6] bg-[#fbfcf8]/94 shadow-[0_22px_58px_rgba(58,90,64,0.13)]';
  const dropdownSideClass = isDarkTheme
    ? 'bg-white/[0.02]'
    : 'bg-[#f6f8f2]/82';
  const dropdownDividerClass = isDarkTheme
    ? 'bg-white/8'
    : 'bg-[#d8e2ce]';
  const dropdownHeadingClass = isDarkTheme
    ? 'text-[#adb5be]'
    : 'text-[#5d7357]';
  const dropdownItemClass = isDarkTheme
    ? 'hover:bg-white/[0.05]'
    : 'hover:bg-[#eef4ea]';
  const dropdownIconClass = isDarkTheme
    ? 'border-white/10 bg-white/[0.04] text-[#e2e6e9] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
    : 'border-[#d8e2ce] bg-white/86 text-[#3a5a40] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]';
  const dropdownTitleClass = isDarkTheme ? 'text-white' : 'text-[#344e41]';
  const dropdownDescriptionClass = isDarkTheme ? 'text-[#d0d7dd]' : 'text-[#5d6f5d]';
  const updateCardClass = isDarkTheme
    ? 'border-white/8 bg-white/[0.03] hover:bg-white/[0.05]'
    : 'border-[#dce6d4] bg-white/80 hover:bg-white';
  const updatePreviewClass = isDarkTheme
    ? 'bg-[radial-gradient(circle_at_top_left,rgba(111,155,116,0.28),transparent_42%),linear-gradient(135deg,rgba(47,58,52,0.95),rgba(24,30,28,0.98))]'
    : 'bg-[radial-gradient(circle_at_top_left,rgba(88,129,87,0.14),transparent_46%),linear-gradient(135deg,rgba(248,251,246,0.98),rgba(228,236,222,0.98))]';
  const updatePreviewInnerClass = isDarkTheme
    ? 'border-white/10 bg-[#181d20]/84'
    : 'border-white/82 bg-white/76';
  const actionButtonClass = isDarkTheme
    ? 'relative z-10 inline-flex min-h-[3rem] items-center justify-center rounded-full border border-white/10 bg-[#7fab82] px-6 py-3 text-[1rem] font-bold tracking-[-0.01em] text-[#0f1710] shadow-[0_14px_30px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl transition-[background-color,box-shadow,color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#8fbd92] hover:shadow-[0_18px_34px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fbd92] active:translate-y-0 active:scale-[0.98]'
    : 'relative z-10 inline-flex min-h-[3rem] items-center justify-center rounded-full border border-[#314d37]/15 bg-[#3a5a40] px-6 py-3 text-[1rem] font-bold tracking-[-0.01em] text-white shadow-[0_14px_30px_rgba(58,90,64,0.26),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition-[background-color,box-shadow,color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#2f4a36] hover:shadow-[0_18px_34px_rgba(58,90,64,0.32),inset_0_1px_0_rgba(255,255,255,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3a5a40] active:translate-y-0 active:scale-[0.98]';
  const employerActionLinkClass = isDarkTheme
    ? 'relative z-10 inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-transparent px-4 py-2.5 text-[0.98rem] font-medium text-[#d0d7dd] transition-[background-color,border-color,box-shadow,color] duration-300 hover:border-white/10 hover:bg-[#202428]/90 hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_22px_rgba(0,0,0,0.24)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8fbd92] active:translate-y-0 active:scale-[0.98]'
    : 'relative z-10 inline-flex min-h-[2.75rem] items-center justify-center rounded-full border border-transparent px-4 py-2.5 text-[0.98rem] font-medium text-[#344e41] transition-[background-color,border-color,box-shadow,color] duration-300 hover:border-[#dce6d4] hover:bg-white/86 hover:text-[#102a1b] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_22px_rgba(58,90,64,0.13)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3a5a40] active:translate-y-0 active:scale-[0.98]';
  const themeToggleClass = isDarkTheme
    ? 'relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#202428]/88 text-[#e2e6e9] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl transition-colors hover:bg-[#2a2f35]'
    : 'relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e2ce] bg-white/86 text-[#344e41] shadow-[0_10px_22px_rgba(58,90,64,0.12)] backdrop-blur-xl transition-colors hover:bg-[#eef4ea]';

  const logoNode = onLogoClick ? (
    <button type="button" onClick={onLogoClick} className={brandLinkClass} aria-label="Back to top">
      <KapITLogo className={logoClass} />
      <h1 className={`text-[1.24rem] font-bold tracking-[-0.035em] ${brandTitleClass}`}>KapIT</h1>
    </button>
  ) : (
    <Link href={logoHref} className={brandLinkClass} aria-label="Go to home">
      <KapITLogo className={logoClass} />
      <h1 className={`text-[1.24rem] font-bold tracking-[-0.035em] ${brandTitleClass}`}>KapIT</h1>
    </Link>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes navItemSlideUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-nav-item {
          animation: navItemSlideUp 0.6s cubic-bezier(0.32,0.72,0,1) forwards;
          opacity: 0;
        }
      `}} />
      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] pt-5 lg:pt-6 pb-2">
        {/* Isolated background layer to prevent nested backdrop-filter bugs with dropdowns */}
        <div className={`absolute inset-0 -z-10 transition-all duration-500 ${isScrolled ? 'backdrop-blur-xl bg-[#FDFBF7]/60 dark:bg-[#181a1b]/60' : 'backdrop-blur-none bg-transparent'}`} />
        
        <div className="landing-desktop-shell relative flex items-center gap-5 lg:gap-8">
          <div className="shrink-0">
            {logoNode}
          </div>

          <nav
            ref={navMenuRef}
            className="relative hidden min-w-0 flex-1 items-center justify-center lg:flex"
            onMouseLeave={handleHeaderDropdownClose}
            onMouseEnter={() => {
              if (headerDropdownCloseTimerRef.current) {
                window.clearTimeout(headerDropdownCloseTimerRef.current);
                headerDropdownCloseTimerRef.current = null;
              }
            }}
          >
            <div className="relative z-10 flex items-center gap-4">
              {TOP_NAV_LINKS.map((link) => {
                const isActive = openHeaderDropdown === link.label || selectedTopNavLabel === link.label;

                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => {
                      if (link.hasDropdown) {
                        handleHeaderDropdownOpen(link.label);
                        return;
                      }

                      if (headerDropdownCloseTimerRef.current) {
                        window.clearTimeout(headerDropdownCloseTimerRef.current);
                        headerDropdownCloseTimerRef.current = null;
                      }

                      setOpenHeaderDropdown(null);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleHeaderTopLinkClick(link)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-[0.98rem] font-medium transition-all duration-300 ${
                        isActive
                          ? activeNavLinkClass
                          : `border-transparent ${inactiveNavLinkClass} ${hoverNavLinkClass}`
                      }`}
                      style={{ fontFamily: 'var(--font-desktop)' }}
                      aria-expanded={link.hasDropdown ? openHeaderDropdown === link.label : undefined}
                    >
                      <span>{link.label}</span>
                      {link.hasDropdown ? (
                        <ChevronDown
                          className={`h-4 w-4 opacity-70 transition-transform ${openHeaderDropdown === link.label ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>

            {openHeaderDropdown && TOP_NAV_DROPDOWNS[openHeaderDropdown] ? (
              <div
                className={`pointer-events-auto absolute left-1/2 top-full z-50 mt-3 w-[760px] max-w-[88vw] -translate-x-1/2 overflow-hidden rounded-[1.1rem] border backdrop-blur-2xl ${dropdownPanelClass}`}
                onMouseEnter={() => {
                  if (headerDropdownCloseTimerRef.current) {
                    window.clearTimeout(headerDropdownCloseTimerRef.current);
                    headerDropdownCloseTimerRef.current = null;
                  }
                }}
                onMouseLeave={handleHeaderDropdownClose}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: openHeaderDropdown === 'Solutions' ? '1fr 1fr' : '1.08fr 0.92fr',
                  }}
                >
                  <div className="p-5">
                    <p className={`text-[0.68rem] font-semibold tracking-[0.2em] ${dropdownHeadingClass}`}>
                      {TOP_NAV_DROPDOWNS[openHeaderDropdown][0].heading}
                    </p>
                    <div className="mt-3.5 space-y-1">
                      {TOP_NAV_DROPDOWNS[openHeaderDropdown][0].items.map((item, index) => {
                        const ItemIcon = item.icon;

                        return (
                          <button
                            key={item.title}
                            type="button"
                            onClick={() => {
                              handleTopNavClick(item.footerItem);
                              handleHeaderDropdownClose();
                            }}
                            className={`group flex w-full items-start gap-3 rounded-[0.95rem] px-3 py-2.5 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] animate-nav-item ${dropdownItemClass}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] border transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 ${dropdownIconClass}`}>
                              <ItemIcon className="h-4.5 w-4.5" />
                            </span>
                            <span className="min-w-0">
                              <span className={`block text-[0.98rem] font-semibold ${dropdownTitleClass}`}>{item.title}</span>
                              <span className={`mt-0.5 block text-[0.9rem] leading-6 ${dropdownDescriptionClass}`}>
                                {item.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`relative p-5 ${dropdownSideClass}`}>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute left-0 w-px ${dropdownDividerClass} ${
                        openHeaderDropdown === 'Solutions' ? 'top-5 bottom-5' : 'top-0 bottom-0'
                      }`}
                    />
                    {openHeaderDropdown === 'Solutions' ? (
                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <p className={`text-[0.68rem] font-semibold tracking-[0.2em] ${dropdownHeadingClass}`}>
                            HIRING FOR YOUR TEAM?
                          </p>
                          <p className={`mt-4 text-xl font-semibold tracking-[-0.035em] ${dropdownTitleClass}`}>
                            Meet KapIT for Employers
                          </p>
                          <p className={`mt-2 text-sm leading-6 ${dropdownDescriptionClass}`}>
                            Search Filipino IT talent, publish roles, and manage applicants in a dedicated employer workspace.
                          </p>
                        </div>
                        <Link
                          href="/for-employers"
                          onClick={handleHeaderDropdownClose}
                          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#3a5a40] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2f4a36] dark:bg-[#7fab82] dark:text-[#0f1710] dark:hover:bg-[#8fbd92]"
                        >
                          For Employers
                        </Link>
                      </div>
                    ) : (
                      <>
                        <p className={`text-[0.68rem] font-semibold tracking-[0.2em] ${dropdownHeadingClass}`}>
                          RECENT UPDATE
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            handleTopNavClick('Help Center');
                            handleHeaderDropdownClose();
                          }}
                          className={`mt-3.5 block w-full rounded-[1rem] border p-2.5 text-left transition-colors ${updateCardClass}`}
                        >
                          <div className={`rounded-[0.9rem] p-2.5 ${updatePreviewClass}`}>
                            <div className={`rounded-[0.8rem] border px-4 py-4.5 ${updatePreviewInnerClass}`}>
                              <p className={`text-xs font-semibold tracking-[0.22em] ${dropdownHeadingClass}`}>
                                SUPPORT WORKFLOWS
                              </p>
                              <p className={`mt-2.5 text-base font-semibold ${dropdownTitleClass}`}>Introducing Help Desk</p>
                              <p className={`mt-1.5 text-sm leading-6 ${dropdownDescriptionClass}`}>
                                Manage customer support workflows in one place with clearer handoffs and faster responses.
                              </p>
                            </div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2.5 lg:gap-3">
            <Link href="/for-employers" className={employerActionLinkClass} style={{ fontFamily: 'var(--font-desktop)' }}>
              For Employers
            </Link>
            {renderActionButton(
              'Sign In',
              signInHref,
              onSignIn,
              actionButtonClass
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className={themeToggleClass}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
