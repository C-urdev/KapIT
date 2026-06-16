import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Moon, Sun, Building2, UserRound, BriefcaseBusiness, FileText, LifeBuoy, UsersRound, ShieldCheck, CircleHelp } from 'lucide-react';
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
    {
      heading: 'COMPANIES',
      items: [
        {
          title: 'Find talent',
          description: 'Search and connect with the right IT candidates.',
          footerItem: 'Find talent',
          icon: Building2,
        },
        {
          title: 'Post projects',
          description: 'Publish job posts and receive qualified applicants.',
          footerItem: 'Post projects',
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
  onGetStarted,
  signInHref = '/auth/login',
  getStartedHref = '/auth/register',
}) {
  const { theme, toggleTheme } = useTheme();
  const [openHeaderDropdown, setOpenHeaderDropdown] = useState(null);
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
      setOpenHeaderDropdown((current) => (current === link.label ? null : link.label));
      return;
    }
    if (link.href) {
      window.location.href = link.href;
      return;
    }
    handleTopNavClick(link.footerItem);
  };

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
    return () => {
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

  const logoNode = onLogoClick ? (
    <button type="button" onClick={onLogoClick} className="flex items-center gap-3" aria-label="Back to top">
      <KapITLogo className="w-10 h-10 rounded-lg object-contain bg-white" />
      <h1 className="text-xl sm:text-2xl font-bold text-[#3a5a40] dark:text-white">KapIT</h1>
    </button>
  ) : (
    <Link href={logoHref} className="flex items-center gap-3" aria-label="Go to home">
      <KapITLogo className="w-10 h-10 rounded-lg object-contain bg-white" />
      <h1 className="text-xl sm:text-2xl font-bold text-[#3a5a40] dark:text-white">KapIT</h1>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 overflow-visible border-b border-black/5 bg-white/85 dark:border-[#2f353c] dark:bg-[#121416]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {logoNode}

        <nav
          ref={navMenuRef}
          className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 xl:gap-10 overflow-visible"
          onMouseLeave={handleHeaderDropdownClose}
          onMouseEnter={() => {
            if (headerDropdownCloseTimerRef.current) {
              window.clearTimeout(headerDropdownCloseTimerRef.current);
              headerDropdownCloseTimerRef.current = null;
            }
          }}
        >
          {TOP_NAV_LINKS.map((link) => (
            <div key={link.label} className="relative" onMouseEnter={() => link.hasDropdown && handleHeaderDropdownOpen(link.label)}>
              <button
                type="button"
                onClick={() => handleHeaderTopLinkClick(link)}
                className="inline-flex items-center gap-1 text-[1rem] font-semibold text-[#3a5a40] dark:text-white transition-colors"
                style={{ fontFamily: 'var(--font-desktop)' }}
                aria-expanded={link.hasDropdown ? openHeaderDropdown === link.label : undefined}
              >
                <span>{link.label}</span>
                {link.hasDropdown ? (
                  <ChevronDown
                    className={`h-4 w-4 opacity-75 transition-transform ${openHeaderDropdown === link.label ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            </div>
          ))}

          {openHeaderDropdown && TOP_NAV_DROPDOWNS[openHeaderDropdown] ? (
            <div
              className="pointer-events-auto absolute left-1/2 top-full z-50 mt-6 -translate-x-1/2 overflow-hidden rounded-2xl border border-[#d7d7d7] bg-white shadow-[0_14px_32px_rgba(0,0,0,0.12)] dark:border-[#444d57] dark:bg-[#1a1d20]"
              style={{ width: '860px', maxWidth: '92vw' }}
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
                  <p className="text-xs font-medium tracking-[0.22em] text-[#6b7280] dark:text-[#94a3b8]">
                    {TOP_NAV_DROPDOWNS[openHeaderDropdown][0].heading}
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {TOP_NAV_DROPDOWNS[openHeaderDropdown][0].items.map((item) => {
                      const ItemIcon = item.icon;

                      return (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => {
                            handleTopNavClick(item.footerItem);
                            handleHeaderDropdownClose();
                          }}
                          className="group flex w-full items-start gap-3 rounded-xl px-1.5 py-2.5 text-left hover:bg-white/80 dark:hover:bg-[#22272b]"
                        >
                          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d0d4d9] bg-[#f3f4f6] text-[#6b7280] dark:border-[#4b5563] dark:bg-[#232931] dark:text-[#cbd5e1]">
                            <ItemIcon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[1.02rem] font-medium text-[#1f2937] dark:text-white">{item.title}</span>
                            <span className="mt-0.5 block text-[0.98rem] text-[#4b5563] dark:text-[#cbd5e1]">
                              {item.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="relative p-5">
                  {openHeaderDropdown === 'Solutions' ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-4 bottom-4 w-px bg-[#d9d9d9] dark:bg-[#3b4450]"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-0 bottom-0 w-px bg-[#dfdfdf] dark:bg-[#3b4450]"
                    />
                  )}
                  {openHeaderDropdown === 'Solutions' ? (
                    <>
                      <p className="text-xs font-medium tracking-[0.22em] text-[#6b7280] dark:text-[#94a3b8]">
                        {TOP_NAV_DROPDOWNS.Solutions[1].heading}
                      </p>
                      <div className="mt-4 space-y-1.5">
                        {TOP_NAV_DROPDOWNS.Solutions[1].items.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.title}
                              type="button"
                              onClick={() => {
                                handleTopNavClick(item.footerItem);
                                handleHeaderDropdownClose();
                              }}
                              className="group flex w-full items-start gap-3 rounded-xl px-1.5 py-2.5 text-left hover:bg-white/80 dark:hover:bg-[#22272b]"
                            >
                              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d0d4d9] bg-[#f3f4f6] text-[#6b7280] dark:border-[#4b5563] dark:bg-[#232931] dark:text-[#cbd5e1]">
                                <ItemIcon className="h-5 w-5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[1.02rem] font-medium text-[#1f2937] dark:text-white">{item.title}</span>
                                <span className="mt-0.5 block text-[0.98rem] text-[#4b5563] dark:text-[#cbd5e1]">
                                  {item.description}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium tracking-[0.22em] text-[#6b7280] dark:text-[#94a3b8]">
                        RECENT UPDATE
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          handleTopNavClick('Help Center');
                          handleHeaderDropdownClose();
                        }}
                        className="mt-4 block w-full rounded-xl border border-[#d0d4d9] bg-white p-2 text-left hover:bg-[#fafafa] dark:border-[#4b5563] dark:bg-[#232931] dark:hover:bg-[#28303a]"
                      >
                        <div className="h-36 rounded-lg bg-gradient-to-r from-[#f59e0b] via-[#f97316] to-[#ec4899] p-2">
                          <div className="h-full rounded-md bg-white/90" />
                        </div>
                        <p className="mt-3 text-lg font-medium text-[#111827] dark:text-white">Introducing Help Desk</p>
                        <p className="mt-1 line-clamp-2 text-sm text-[#4b5563] dark:text-[#cbd5e1]">
                          Manage customer support workflows in one place with clearer handoffs and faster responses.
                        </p>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </nav>

        <div className="ml-auto lg:ml-0 flex items-center gap-2">
          {renderActionButton(
            'Sign In',
            signInHref,
            onSignIn,
            'inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-full border border-[#a3b18a] dark:border-[#444d57] bg-white dark:bg-[#22272b] text-[#344e41] dark:text-white text-sm sm:text-base font-semibold hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors'
          )}
          {renderActionButton(
            'Get Started',
            getStartedHref,
            onGetStarted,
            'inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-full text-sm sm:text-base text-white font-semibold bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] transition-colors'
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#b8ad94] to-transparent opacity-95 shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:via-[#5b6672] dark:shadow-[0_1px_0_rgba(10,14,18,0.75)]"
        aria-hidden="true"
      />
    </header>
  );
}
