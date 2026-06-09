import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Code2,
  Shield,
  Palette,
  Smartphone,
  Cpu,
  Cloud,
  ArrowRight,
  Users,
  Moon,
  Sun,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserRound,
  BriefcaseBusiness,
  FileText,
  LifeBuoy,
  UsersRound,
  ShieldCheck,
  CircleHelp,
  Share2,
  BookOpen,
  SquareStack,
} from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import Footer from '@sharedComponents/branding/Footer';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import { SOCIAL_LINKS } from '@sharedComponents/branding/SocialLinksGroup';

const TRUSTED_LOGOS = ['Google', 'Microsoft', 'PayPal', 'Meta'];
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

const CATEGORIES = [
  { title: 'Programming & Tech', icon: Code2 },
  { title: 'Cybersecurity', icon: Shield },
  { title: 'UI/UX Design', icon: Palette },
  { title: 'Mobile Development', icon: Smartphone },
  { title: 'AI & Data', icon: Cpu },
  { title: 'Cloud & DevOps', icon: Cloud },
];
const HERO_DEMO_DOMAIN = 'kapit.online';

const FacebookSocialIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M14.5 7.5H16V5h-2c-2.1 0-3.5 1.4-3.5 3.6V11H8v2.5h2.5V19h2.7v-5.5h2.4L16 11h-2.8V8.9c0-.9.4-1.4 1.3-1.4Z" fill="currentColor" />
  </svg>
);

const ProductHuntSocialIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10 8.6h3.1c1.8 0 3 1.2 3 2.9 0 1.9-1.3 3-3.1 3H12V17h-2V8.6Zm2 4.3h1c.8 0 1.2-.5 1.2-1.3 0-.7-.5-1.2-1.2-1.2h-1v2.5Z" fill="currentColor" />
  </svg>
);

const XSocialIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.8 5h2l-4.4 5L20 19h-4.4l-3.4-4.3L8.5 19h-2l4.8-5.5L6 5h4.3l3 3.9L16.8 5Zm-1.2 12.2h1.2L10.1 6.7H8.9l6.7 10.5Z" />
  </svg>
);

const EmailSocialIcon = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect x="4" y="6.5" width="16" height="11" rx="2.3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5.3 8.4 12 13l6.7-4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HERO_FEATURE_CALLOUTS = [
  {
    title: 'Smart Matching',
    description: 'AI maps each role to verified skills and profile depth.',
    icon: FacebookSocialIcon,
    socialName: 'Facebook',
    className: 'hero-feature-callout--top',
  },
  {
    title: 'Vetted Talent',
    description: 'Profiles are screened before they appear in hiring flow.',
    icon: ProductHuntSocialIcon,
    socialName: 'Product Hunt',
    className: 'hero-feature-callout--upper-mid',
  },
  {
    title: 'Real Opportunities',
    description: 'Listings stay aligned to active company demand.',
    icon: XSocialIcon,
    socialName: 'X',
    className: 'hero-feature-callout--lower-mid',
  },
  {
    title: 'Fast Discovery',
    description: 'Safari-first search previews key job details instantly.',
    icon: EmailSocialIcon,
    socialName: 'Email',
    className: 'hero-feature-callout--bottom',
  },
];

const LANDING_BG_STARS = (() => {
  const stars = [];
  let seed = 182736;
  const count = 7;
  const sizes = ['h-1 w-1', 'h-1.5 w-1.5'];

  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const isInsideNoStarZone = (top, left) => {
    // Keep the hero center clean: heading, subheading, search, and chips area.
    const inHorizontalCenter = left >= 18 && left <= 84;
    const inVerticalCenter = top >= 14 && top <= 74;
    return inHorizontalCenter && inVerticalCenter;
  };

  const isOnSideLanes = (left) => left <= 16 || left >= 84;

  while (stars.length < count) {
    const top = Math.round((8 + rand() * 76) * 10) / 10; // 8% - 84%
    const left = Math.round((6 + rand() * 88) * 10) / 10; // 6% - 94%
    if (isInsideNoStarZone(top, left)) continue;
    if (!isOnSideLanes(left)) continue;

    stars.push({
      top: `${top}%`,
      left: `${left}%`,
      size: sizes[stars.length % 2],
    });
  }

  return stars;
})();

export default function LandingPage({ onGetStarted, onJoinDeveloper, onSignIn }) {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [typedDomain, setTypedDomain] = useState('');
  const [showHeroCaret, setShowHeroCaret] = useState(false);
  const [isHeroPreviewLoaded, setIsHeroPreviewLoaded] = useState(false);
  const [highlightGetStarted, setHighlightGetStarted] = useState(false);
  const [isDesktopCarousel, setIsDesktopCarousel] = useState(false);
  const [openHeaderDropdown, setOpenHeaderDropdown] = useState(null);
  const headerDropdownCloseTimerRef = useRef(null);
  const navMenuRef = useRef(null);
  const topRef = useRef(null);
  const categoriesRef = useRef(null);

  const scrollTo = (ref) => {
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => {
    if (topRef.current) {
      scrollTo(topRef);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    scrollTo(categoriesRef);
  };

  const handleJoinDeveloperClick = () => {
    onJoinDeveloper?.();
  };

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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const timers = new Set();
    let cancelled = false;
    const typingCadenceMs = [120, 112, 126, 118, 114, 152, 122, 118, 132, 116, 136, 128];

    const queue = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) {
          callback();
        }
      }, delay);
      timers.add(timer);
      return timer;
    };

    const startDemoCycle = () => {
      setTypedDomain('');
      setShowHeroCaret(false);
      setIsHeroPreviewLoaded(false);

      queue(() => {
        setShowHeroCaret(true);
        let charIndex = 0;

        const typeNextCharacter = () => {
          if (cancelled) return;
          charIndex += 1;
          setTypedDomain(HERO_DEMO_DOMAIN.slice(0, charIndex));

          if (charIndex >= HERO_DEMO_DOMAIN.length) {
            queue(() => {
              setIsHeroPreviewLoaded(true);
              queue(() => setShowHeroCaret(false), 240);
              // Keep the loaded state visible, then replay the full sequence.
              queue(startDemoCycle, 2900);
            }, 640);
            return;
          }

          queue(typeNextCharacter, typingCadenceMs[charIndex - 1] ?? 86);
        };

        typeNextCharacter();
      }, 700);
    };

    startDemoCycle();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const handleOpenAccountChoice = () => {
    highlightTopGetStarted();
    window.setTimeout(() => {
      onGetStarted?.();
    }, 120);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Keep orbit layout for larger desktops only; smaller viewports use the safer mobile carousel.
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const updateCarouselMode = (event) => {
      setIsDesktopCarousel(event.matches);
    };

    setIsDesktopCarousel(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateCarouselMode);
      return () => mediaQuery.removeEventListener('change', updateCarouselMode);
    }

    mediaQuery.addListener(updateCarouselMode);
    return () => mediaQuery.removeListener(updateCarouselMode);
  }, []);

  const highlightTopGetStarted = () => {
    scrollToTop();
    setHighlightGetStarted(false);
    window.setTimeout(() => setHighlightGetStarted(true), 40);
    window.setTimeout(() => setHighlightGetStarted(false), 2200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#edf3ef] dark:bg-gradient-to-b dark:from-[#121416] dark:via-[#1a1d20] dark:to-[#22272b]">
      <div ref={topRef} />
      <header className="sticky top-0 z-40 overflow-visible border-b border-black/10 bg-white/96 shadow-[0_12px_28px_rgba(16,42,27,0.08)] supports-[backdrop-filter]:bg-white/78 dark:border-[#2f353c] dark:bg-[#121416]/88 backdrop-blur-xl backdrop-saturate-160 backdrop-brightness-110">
        <div className="relative mx-auto flex w-full max-w-[min(100%,1700px)] flex-wrap items-center gap-3 px-6 py-3.5 sm:px-8 lg:flex-nowrap lg:gap-4 lg:px-10 xl:px-12 2xl:px-14">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4 xl:gap-5">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex shrink-0 items-center gap-3"
              aria-label="Back to top"
            >
              <KapITLogo className="h-9 w-9 rounded-md object-contain bg-white" />
              <h1 className="text-[2rem] leading-none font-semibold tracking-[-0.01em] text-[#35573f] dark:text-white">KapIT</h1>
            </button>

            <div className="hidden min-w-0 lg:flex items-center gap-4 xl:gap-5">
              <form
                onSubmit={handleSearch}
                className="group flex h-11 min-w-[340px] max-w-[520px] items-center gap-2 rounded-full border border-[#a7bd9d] bg-white/82 px-3 shadow-[0_4px_10px_rgba(16,42,27,0.08)] backdrop-blur-sm transition-all focus-within:border-[#7fa285] dark:border-[#4b5968] dark:bg-[#1f252b]/92 dark:focus-within:border-[#7ba087]"
              >
                <Search className="h-4 w-4 shrink-0 text-[#5d7a63] dark:text-[#89a98f]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="What are you looking for?"
                  className="min-w-0 flex-1 bg-transparent py-1 text-[0.95rem] font-medium text-[#1f3a2a] outline-none placeholder:text-[#607669] dark:text-white dark:placeholder:text-[#9fb0be]"
                />
                <button
                  type="submit"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#32573f] bg-[#3a5a40] text-white transition-colors hover:bg-[#344e41] dark:border-[#6f9b74] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
                  aria-label="Submit search"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
              </form>

              <nav
                ref={navMenuRef}
                className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center overflow-visible"
                onMouseLeave={handleHeaderDropdownClose}
                onMouseEnter={() => {
                  if (headerDropdownCloseTimerRef.current) {
                    window.clearTimeout(headerDropdownCloseTimerRef.current);
                    headerDropdownCloseTimerRef.current = null;
                  }
                }}
              >
                <div className="flex items-center gap-7 xl:gap-8">
                  {TOP_NAV_LINKS.map((link) => (
                    <div
                      key={link.label}
                      className="relative"
                      onMouseEnter={() => link.hasDropdown && handleHeaderDropdownOpen(link.label)}
                    >
                      <button
                        type="button"
                        onClick={() => handleHeaderTopLinkClick(link)}
                        className="inline-flex min-h-[38px] items-center gap-1 px-1.5 text-[1.02rem] font-semibold text-[#35573f] dark:text-white transition-colors"
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
                </div>

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
                              <p className="mt-3 text-lg font-medium text-[#111827] dark:text-white">Introducing ATS Resume Format</p>
                              <p className="mt-1 line-clamp-2 text-sm text-[#4b5563] dark:text-[#cbd5e1]">
                                Build ATS-friendly resumes with cleaner structure, keyword alignment, and stronger screening compatibility.
                              </p>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </nav>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex h-9 items-center rounded-full border border-[#9bb28f] bg-white px-3.5 text-[0.875rem] font-semibold text-[#2f4e39] transition-colors hover:bg-[#f5f5f2] dark:border-[#444d57] dark:bg-[#22272b] dark:text-white dark:hover:bg-[#353c44]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex h-9 items-center rounded-full bg-[#3d6446] px-3.5 text-[0.875rem] font-semibold text-white transition-colors hover:bg-[#35573f] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-[#35573f] hover:opacity-80 dark:text-white transition-opacity"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <ThinSectionLine className="bottom-0" />
      </header>

      <section className="relative overflow-hidden min-h-[100dvh] flex flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              theme === 'dark' ? 'url(/hero%20dark.png)' : 'url(/hero%20light.png)',
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
          <div
            className="landing-bg-glow absolute inset-0"
            style={{
              background:
                theme === 'dark'
                  ? 'radial-gradient(58% 44% at 50% 14%, rgba(226, 232, 240, 0.22) 0%, rgba(148, 163, 184, 0.13) 44%, rgba(18, 20, 22, 0) 86%), radial-gradient(58% 38% at 50% 72%, rgba(163, 230, 53, 0.07) 0%, rgba(18,20,22,0) 78%)'
                  : 'radial-gradient(58% 44% at 50% 14%, rgba(16, 185, 129, 0.03) 0%, rgba(163, 230, 53, 0.018) 44%, rgba(247, 246, 241, 0) 86%), radial-gradient(58% 38% at 50% 72%, rgba(245, 222, 179, 0.12) 0%, rgba(247,246,241,0) 80%)',
            }}
          />
          <div
            className="landing-bg-horizon absolute inset-x-[-10%] bottom-[8%] h-36 sm:h-44"
            style={{
              background:
                theme === 'dark'
                  ? 'radial-gradient(58% 90% at 50% 100%, rgba(203, 213, 225, 0.2) 0%, rgba(148, 163, 184, 0.12) 36%, rgba(18,20,22,0) 76%)'
                  : 'radial-gradient(58% 90% at 50% 100%, rgba(132, 204, 22, 0.045) 0%, rgba(16, 185, 129, 0.03) 34%, rgba(247,246,241,0) 78%)',
            }}
          />
          <div
            className="landing-bg-wave absolute inset-x-[7%] bottom-[10%] h-20 rounded-[50%] border"
            style={{
              borderColor: theme === 'dark' ? 'rgba(203,213,225,0.24)' : 'rgba(132, 204, 22, 0.3)',
            }}
          />
          <div
            className="landing-bg-wave landing-bg-wave-delay absolute inset-x-[15%] bottom-[11.5%] h-16 rounded-[50%] border"
            style={{
              borderColor: theme === 'dark' ? 'rgba(226,232,240,0.18)' : 'rgba(101, 163, 13, 0.26)',
            }}
          />
          {LANDING_BG_STARS.map((star) => (
            <span
              key={`${star.top}-${star.left}`}
              className={`absolute ${star.size} rounded-full bg-[#facc15]/70 shadow-[0_0_7px_rgba(217,119,6,0.35)] dark:bg-white/65 dark:shadow-none`}
              style={{ top: star.top, left: star.left }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-[42vh] dark:block"
          style={{
            background:
              'linear-gradient(180deg, rgba(18,20,22,0.96) 0%, rgba(18,20,22,0.74) 36%, rgba(18,20,22,0.38) 64%, rgba(18,20,22,0) 100%), radial-gradient(58% 54% at 50% 0%, rgba(203,213,225,0.14) 0%, rgba(18,20,22,0) 72%)',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/12 via-white/16 to-[#f4f7f3] dark:from-[#121416]/58 dark:via-[#121416]/34 dark:to-[#1a1d20]" aria-hidden="true" />

        <div className="relative flex-1 flex items-center">
          <div className="w-full max-w-[min(100%,1700px)] mx-auto px-6 sm:px-8 lg:px-10 xl:px-12 2xl:px-14 py-10 sm:py-12 lg:py-14">
            <div className="max-w-5xl lg:max-w-3xl mx-auto lg:mx-0 text-center lg:text-left w-full xl:-translate-y-6 2xl:-translate-y-8">
              <h2 className="mt-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.2rem] font-extrabold tracking-tight leading-[0.95] text-[#102a1b] dark:text-white max-w-[72rem] mx-auto lg:mx-0">
                <span className="block md:whitespace-nowrap">Connect Filipino IT</span>
                <span className="block md:whitespace-nowrap">Talent with Opportunity</span>
              </h2>
              <p className="mt-5 sm:mt-6 text-[1rem] sm:text-[1.08rem] lg:text-[1.12rem] leading-relaxed font-medium text-[#2f4e39] dark:text-[#d0d7dd] max-w-3xl mx-auto lg:mx-0">
                KapIT is a focused hiring marketplace where companies find vetted developers and IT professionals discover real, skill-matched opportunities.
              </p>

              <div className="mt-10 sm:mt-12 flex flex-row flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleOpenAccountChoice}
                  className="w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-full bg-white/85 dark:bg-[#22272b]/70 border border-[#a3b18a] dark:border-[#444d57] text-[#102a1b] dark:text-white text-[0.95rem] sm:text-lg font-semibold hover:bg-white dark:hover:bg-[#353c44] transition-colors backdrop-blur"
                >
                  Find Developers <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleJoinDeveloperClick}
                  className="w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-full bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white text-[0.95rem] sm:text-lg font-semibold transition-colors"
                >
                  Join as Developer <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute right-[-2.2%] top-[47%] z-[6] hidden -translate-y-1/2 xl:block 2xl:right-[-1.2%]">
            <div className="hero-phone-stage relative">
              <div className="hero-phone-wrap pointer-events-auto relative">
                <div className="hero-phone-glow absolute -inset-14 rounded-[84px]" aria-hidden="true" />
                <div className="hero-phone-shell relative h-[622px] w-[314px] overflow-hidden rounded-[62px] border border-[#0b1216] bg-[#020406] p-[1.6px]">
                  <div className="hero-phone-bezel relative h-full w-full overflow-hidden rounded-[60px] border border-[#1a222b] bg-[#04080d] p-[1.4px]">
                    <span className="pointer-events-none absolute -right-[1px] top-[156px] z-30 h-16 w-[3px] rounded-l-full bg-[#2d363f]/90" aria-hidden="true" />
                    <span className="pointer-events-none absolute -right-[1px] top-[250px] z-30 h-11 w-[3px] rounded-l-full bg-[#2d363f]/90" aria-hidden="true" />
                    <span className="pointer-events-none absolute -left-[1px] top-[132px] z-30 h-8 w-[2px] rounded-r-full bg-[#2d363f]/78" aria-hidden="true" />

                    <div className="hero-phone-screen relative h-full w-full overflow-hidden rounded-[56px] border border-[#182028] bg-[#f8fcf7]">
                      <div className="hero-screen-status absolute inset-x-0 top-0 z-20 px-7 pt-[11px]">
                        <div className="flex items-center justify-between text-[12px] font-semibold tracking-[0.02em] text-[#111827]">
                          <span>9:41</span>
                          <div className="flex items-center gap-1.5">
                            <span className="h-[5px] w-[5px] rounded-full bg-[#111827]/85" />
                            <span className="h-[6px] w-[10px] rounded-[2px] border border-[#111827]/85" />
                          </div>
                        </div>
                      </div>
                      <div className="hero-dynamic-island absolute left-1/2 top-[12px] z-30 h-[30px] w-[126px] -translate-x-1/2 rounded-full bg-black" />

                      <div className={`hero-screen-demo relative h-full bg-[radial-gradient(130%_74%_at_50%_-12%,rgba(202,225,204,0.46)_0%,rgba(244,250,244,0.96)_40%,rgba(247,252,248,1)_100%)] px-4 pb-[118px] pt-[58px] ${isHeroPreviewLoaded ? 'is-loaded' : ''}`}>
                        <div className="hero-ios-loading-shell rounded-[22px] border border-[#dbe8dc] bg-white/88 px-4 py-4 backdrop-blur-[2px]">
                          <div className="h-[11px] w-24 rounded-full bg-[#dce9dc]" />
                          <div className="mt-2 h-[9px] w-[58%] rounded-full bg-[#e7f2e7]" />
                          <div className="mt-4 grid grid-cols-2 gap-2.5">
                            <div className="h-[64px] rounded-2xl border border-[#e4eee4] bg-[#f2f8f2]/84" />
                            <div className="h-[64px] rounded-2xl border border-[#e4eee4] bg-[#f6faf6]/88" />
                          </div>
                        </div>

                        <div className="hero-ios-preview">
                          <div className="hero-ios-card hero-ios-load-1 rounded-[22px] border border-[#d7e4d8] bg-white/92 px-4 py-3.5 backdrop-blur-[1px]">
                            <div className="flex items-center gap-2.5">
                              <KapITLogo className="h-6 w-6 rounded-md bg-white object-contain" />
                              <div className="space-y-0.5">
                                <p className="text-[12px] font-semibold leading-none text-[#102a1b]">KapIT</p>
                                <p className="text-[10px] font-medium text-[#5f755f]">AI Job Matching Platform</p>
                              </div>
                            </div>
                            <div className="mt-3 h-2 w-[88%] rounded-full bg-[#dce8db]" />
                            <div className="mt-2 h-2 w-[62%] rounded-full bg-[#e8f1e6]" />
                            <div className="mt-4 grid grid-cols-2 gap-2.5">
                              <div className="h-[70px] rounded-2xl border border-white/40 bg-[linear-gradient(165deg,rgba(189,217,191,0.42),rgba(237,247,236,0.84))]" />
                              <div className="h-[70px] rounded-2xl border border-white/40 bg-[linear-gradient(165deg,rgba(208,228,205,0.38),rgba(244,250,243,0.9))]" />
                            </div>
                          </div>

                          <div className="hero-ios-load-2 mt-3.5 grid grid-cols-6 gap-2.5">
                            <div className="col-span-4 h-[76px] rounded-2xl border border-[#dce8dc] bg-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-sm" />
                            <div className="col-span-2 h-[76px] rounded-2xl border border-[#dce8dc] bg-[#eef6ee]/85 backdrop-blur-sm" />
                          </div>
                          <div className="hero-ios-load-3 mt-2.5 h-[90px] rounded-2xl border border-[#dbe7db] bg-[linear-gradient(160deg,rgba(252,255,252,0.82),rgba(231,243,231,0.78))] backdrop-blur-sm" />
                        </div>

                        <div className="hero-safari-toolbar absolute inset-x-3 bottom-[26px] rounded-[26px] border border-[#d6e3d7] bg-white/94 px-3 py-2.5 backdrop-blur-md">
                          <div className="hero-safari-address flex items-center justify-between rounded-full border border-[#d8e6d9] bg-[#f3f8f3] px-3 py-1.5 text-[10px] font-semibold text-[#47614e]">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] text-[#607667]">aA</span>
                            <span className="hero-address-field mx-2 flex min-w-0 flex-1 items-center justify-center gap-1 truncate">
                              <span className={`hero-address-domain ${typedDomain ? 'has-value' : ''}`} aria-label={typedDomain || 'address input'}>
                                {typedDomain || ' '}
                              </span>
                              <span className={`hero-address-caret ${showHeroCaret ? 'is-visible' : ''}`} aria-hidden="true" />
                            </span>
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#607667]">+</span>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between px-3 text-[#487c56]">
                            <ChevronLeft className="h-[15px] w-[15px]" />
                            <ChevronRight className="h-[15px] w-[15px]" />
                            <Share2 className="h-[15px] w-[15px]" />
                            <BookOpen className="h-[15px] w-[15px]" />
                            <SquareStack className="h-[15px] w-[15px]" />
                          </div>
                        </div>

                        <div className="absolute inset-x-[39%] bottom-2 h-[4px] rounded-full bg-[#050606]/84" />
                      </div>
                      <div className="hero-phone-reflection pointer-events-none absolute inset-y-0 right-0 w-24" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-feature-orbit pointer-events-auto">
                {HERO_FEATURE_CALLOUTS.map(({ title, icon: Icon, className, socialName }) => {
                  const socialLink = SOCIAL_LINKS.find((item) => item.name === socialName);
                  const href = socialLink?.href || '#';
                  const isHttpLink = /^https?:\/\//.test(href);

                  return (
                  <article key={title} className={`hero-feature-callout pointer-events-auto ${className}`}>
                    <a
                      href={href}
                      target={isHttpLink ? '_blank' : undefined}
                      rel={isHttpLink ? 'noopener noreferrer nofollow' : undefined}
                      className="hero-feature-icon hero-feature-flip"
                      aria-label={`Open KapIT on ${socialName}`}
                      title={socialName}
                    >
                      <span className="hero-feature-flip-inner relative block h-full w-full">
                        <span className="hero-feature-flip-face hero-feature-flip-front" aria-hidden="true">
                          <Icon className="h-[16px] w-[16px]" />
                        </span>
                        <span className="hero-feature-flip-face hero-feature-flip-back" aria-hidden="true">
                          <KapITLogo className="h-[17px] w-[17px] rounded-full object-contain" />
                        </span>
                      </span>
                    </a>
                  </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </section>

      <section className="relative bg-gradient-to-b from-[#edf3ef] via-[#ecefe9] to-[#e5e0d4] dark:bg-gradient-to-b dark:from-[#1a1d20] dark:via-[#1d2226] dark:to-[#20262b] backdrop-blur">
        <ThinSectionLine className="top-0" />
        <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-5 sm:py-6">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
            <p className="text-sm font-semibold tracking-[0.01em] text-[#2f4e39] dark:text-[#d0d7dd]">
              Trusted by companies hiring Filipino tech talent
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {TRUSTED_LOGOS.map((name) => (
                <div
                  key={name}
                  className="text-sm font-semibold tracking-wide text-[#5f6f67] dark:text-slate-400 opacity-80 grayscale"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
        <ThinSectionLine className="bottom-0" />
      </section>

      <section
        ref={categoriesRef}
        className="relative bg-gradient-to-b from-[#e2ddcf] via-[#ebe6da] to-[#f7f6f1] dark:bg-gradient-to-b dark:from-[#1a1d20] dark:via-[#202428] dark:to-[#23282e] scroll-mt-24"
      >
        <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-12 sm:py-14 lg:py-16">
          <div className="max-w-3xl">
            <h3 className="text-3xl font-bold text-[#102a1b] dark:text-white">Explore categories</h3>
          </div>

          <div className="mt-8">
            {isDesktopCarousel ? (
              <CategoryOrbitRow categories={CATEGORIES} onCategoryClick={handleOpenAccountChoice} />
            ) : (
              <MobileCategoryCarousel categories={CATEGORIES} onCategoryClick={handleOpenAccountChoice} />
            )}
          </div>
        </div>
        <ThinSectionLine className="bottom-0" />
      </section>

      <section className="relative bg-gradient-to-b from-[#fbfaf6] via-[#fbfaf6] via-[97%] to-[#f8f4ec] dark:bg-gradient-to-b dark:from-[#23282e] dark:via-[#202428] dark:to-[#1a1d20]">
        <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-12 sm:py-14 lg:py-16">
          <div className="max-w-3xl">
            <h3 className="text-3xl font-bold text-[#102a1b] dark:text-white">How KapIT works</h3>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
            <div className="rounded-2xl border border-[#a3b18a] dark:border-[#444d57] bg-[#fbfaf6]/70 dark:bg-[#23282e]/35 p-5 min-h-[200px]">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#f0c766]">Step 1</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8c1] dark:border-[#5b6672] bg-white/70 dark:bg-[#2b3138]">
                  <Users className="h-5 w-5 text-[#588157] dark:text-[#e9c86b]" />
                </span>
              </div>
              <h4 className="mt-5 text-xl font-bold text-[#102a1b] dark:text-white">Create your profile</h4>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-[#344e41] dark:text-[#d0d7dd]">
                Create your developer profile or company account.
              </p>
            </div>
            <div className="rounded-2xl border border-[#a3b18a] dark:border-[#444d57] bg-[#fbfaf6]/70 dark:bg-[#23282e]/35 p-5 min-h-[200px]">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#f0c766]">Step 2</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8c1] dark:border-[#5b6672] bg-white/70 dark:bg-[#2b3138]">
                  <Code2 className="h-5 w-5 text-[#588157] dark:text-[#e9c86b]" />
                </span>
              </div>
              <h4 className="mt-5 text-xl font-bold text-[#102a1b] dark:text-white">Showcase work</h4>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-[#344e41] dark:text-[#d0d7dd]">
                Showcase portfolios or post IT projects with clear requirements.
              </p>
            </div>
            <div className="rounded-2xl border border-[#a3b18a] dark:border-[#444d57] bg-[#fbfaf6]/70 dark:bg-[#23282e]/35 p-5 min-h-[200px]">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#f0c766]">Step 3</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfd8c1] dark:border-[#5b6672] bg-white/70 dark:bg-[#2b3138]">
                  <ArrowRight className="h-5 w-5 text-[#588157] dark:text-[#e9c86b]" />
                </span>
              </div>
              <h4 className="mt-5 text-xl font-bold text-[#102a1b] dark:text-white">Connect & collaborate</h4>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-[#344e41] dark:text-[#d0d7dd]">
                Connect and collaborate with Filipino IT talent.
              </p>
            </div>
          </div>
        </div>
        <ThinSectionLine className="bottom-0 z-10" />
      </section>

      <section className="relative bg-gradient-to-b from-[#f8f4ec] via-[#eee9de] via-[8%] to-[#e2ddcf] dark:bg-gradient-to-b dark:from-[#1a1d20] dark:via-[#23282e] dark:to-[#121416]">
        <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-12 sm:py-14 lg:py-16 flex items-center">
          <div className="w-full px-2 sm:px-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
            <div className="max-w-2xl">
              <h3 className="text-3xl font-bold text-[#102a1b] dark:text-white">
                Start building with Filipino IT Talent
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:shrink-0">
              <button
                type="button"
                onClick={handleOpenAccountChoice}
                className="w-full sm:w-auto inline-flex min-h-[54px] items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#444d57] text-[#102a1b] dark:text-white font-semibold hover:bg-white/90 dark:hover:bg-[#353c44] transition-colors"
              >
                Find Developers <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleJoinDeveloperClick}
                className="w-full sm:w-auto inline-flex min-h-[54px] items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold transition-colors"
              >
                Join as Developer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <ThinSectionLine className="bottom-0 z-10" />
      </section>

      <style>{`
        .hero-phone-stage {
          position: relative;
          width: 690px;
          height: 690px;
        }
        .hero-phone-shell {
          transform: rotate(3.15deg) perspective(1200px) rotateY(-6deg);
          transform-origin: 56% 88%;
          box-shadow: 0 42px 95px rgba(12, 24, 17, 0.26), 0 8px 18px rgba(15, 20, 25, 0.28);
          transition: transform 280ms ease-out, box-shadow 280ms ease-out;
        }
        .hero-phone-shell:hover {
          transform: translateY(-8px) rotate(3.95deg) perspective(1200px) rotateY(-7deg);
          box-shadow: 0 48px 115px rgba(12, 24, 17, 0.31), 0 9px 20px rgba(15, 20, 25, 0.32);
        }
        .hero-phone-bezel {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 -24px 38px rgba(5, 10, 14, 0.42);
        }
        .dark .hero-phone-shell {
          box-shadow: 0 0 0 1px rgba(189, 201, 214, 0.2), 0 48px 106px rgba(10, 18, 28, 0.52);
        }
        .dark .hero-phone-bezel {
          box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.12), inset 0 -24px 38px rgba(5, 10, 14, 0.52);
        }
        .hero-phone-glow {
          background: radial-gradient(56% 52% at 50% 52%, rgba(111, 155, 116, 0.21) 0%, rgba(111, 155, 116, 0) 82%);
          filter: blur(16px);
          transition: opacity 300ms ease-out;
          opacity: 0.78;
          pointer-events: none;
        }
        .hero-dynamic-island {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 6px 13px rgba(0, 0, 0, 0.38);
        }
        .hero-screen-status {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0) 100%);
        }
        .hero-ios-card {
          box-shadow: 0 14px 34px rgba(23, 40, 28, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.74);
        }
        .hero-safari-toolbar {
          box-shadow: 0 -2px 0 rgba(255, 255, 255, 0.72), 0 10px 24px rgba(17, 37, 24, 0.14);
        }
        .hero-safari-address {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }
        .hero-address-field {
          color: #5a725f;
        }
        .hero-address-domain {
          display: inline-block;
          min-height: 11px;
          min-width: 1px;
          white-space: nowrap;
          letter-spacing: 0.002em;
          transition: color 220ms ease;
        }
        .hero-address-domain.has-value {
          color: #405a45;
        }
        .hero-address-caret {
          width: 1px;
          height: 10px;
          background: rgba(76, 102, 83, 0.84);
          border-radius: 999px;
          opacity: 0;
          transition: opacity 160ms ease;
        }
        .hero-address-caret.is-visible {
          opacity: 0.9;
          animation: hero-address-caret-soft 880ms ease-in-out infinite;
        }
        .hero-ios-loading-shell {
          position: absolute;
          inset: 58px 16px 118px 16px;
          z-index: 2;
          opacity: 0.92;
          transform: translateY(0) scale(1);
          filter: blur(0);
          transition: opacity 380ms ease, transform 460ms cubic-bezier(0.22, 1, 0.36, 1), filter 460ms ease;
          box-shadow: 0 16px 36px rgba(31, 56, 36, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.75);
        }
        .hero-ios-preview {
          position: relative;
          z-index: 3;
        }
        .hero-screen-demo.is-loaded .hero-ios-loading-shell {
          opacity: 0;
          transform: translateY(-6px) scale(0.992);
          filter: blur(1.2px);
        }
        .hero-ios-load-1,
        .hero-ios-load-2,
        .hero-ios-load-3 {
          opacity: 0;
          transform: translateY(8px) scale(0.988);
          filter: blur(1.25px);
          transition: opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 600ms cubic-bezier(0.22, 1, 0.36, 1), filter 500ms ease;
          visibility: hidden;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-1,
        .hero-screen-demo.is-loaded .hero-ios-load-2,
        .hero-screen-demo.is-loaded .hero-ios-load-3 {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
          visibility: visible;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-1 {
          transition-delay: 80ms;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-2 {
          transition-delay: 170ms;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-3 {
          transition-delay: 250ms;
        }
        .hero-screen-demo:not(.is-loaded) .hero-ios-load-1,
        .hero-screen-demo:not(.is-loaded) .hero-ios-load-2,
        .hero-screen-demo:not(.is-loaded) .hero-ios-load-3 {
          pointer-events: none;
        }
        .hero-screen-demo.is-loaded .hero-ios-load-1 {
          box-shadow: 0 16px 36px rgba(23, 40, 28, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.76);
        }
        .hero-screen-demo.is-loaded .hero-ios-load-2 .col-span-4,
        .hero-screen-demo.is-loaded .hero-ios-load-2 .col-span-2,
        .hero-screen-demo.is-loaded .hero-ios-load-3 {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }
        .hero-phone-reflection {
          background: linear-gradient(108deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.23) 48%, rgba(255, 255, 255, 0) 100%);
          opacity: 0.34;
        }
        @keyframes hero-address-caret-soft {
          0%, 36% {
            opacity: 0.92;
          }
          37%, 62% {
            opacity: 0.25;
          }
          63%, 100% {
            opacity: 0.92;
          }
        }
        .hero-feature-orbit {
          position: relative;
          left: 370px;
          top: -548px;
          width: 310px;
          height: 556px;
        }
        .hero-feature-callout {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hero-feature-callout::before {
          content: '';
          position: absolute;
          left: -152px;
          top: 50%;
          width: 140px;
          height: 1.5px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(118, 141, 124, 0) 0%, rgba(118, 141, 124, 0.42) 42%, rgba(118, 141, 124, 0.8) 100%);
          transform-origin: right center;
          pointer-events: none;
        }
        .hero-feature-icon {
          position: relative;
          z-index: 1;
          display: inline-flex;
          height: 56px;
          width: 56px;
          min-height: 56px;
          min-width: 56px;
          max-height: 56px;
          max-width: 56px;
          flex: 0 0 56px;
          aspect-ratio: 1 / 1;
          overflow: visible;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: #2c4f37;
          box-shadow: none;
          backdrop-filter: blur(7px);
        }
        .hero-feature-icon svg {
          display: block;
          height: 18px;
          width: 18px;
        }
        .hero-feature-flip {
          perspective: 900px;
        }
        .hero-feature-flip-inner {
          display: block;
          transform-style: preserve-3d;
          transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
          transform: rotateY(0deg);
        }
        .hero-feature-flip-face {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(169, 193, 173, 0.9);
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 14px 32px rgba(16, 42, 27, 0.16);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transition: opacity 220ms ease;
        }
        .hero-feature-flip-front {
          opacity: 1;
        }
        .hero-feature-flip-back {
          transform: rotateY(180deg);
          opacity: 0;
        }
        .hero-feature-flip:hover .hero-feature-flip-inner {
          transform: rotateY(180deg);
        }
        .hero-feature-flip:hover .hero-feature-flip-front {
          opacity: 0;
        }
        .hero-feature-flip:hover .hero-feature-flip-back {
          opacity: 1;
        }
        .hero-feature-flip:active .hero-feature-flip-inner {
          transform: rotateY(180deg);
        }
        .hero-feature-flip:active .hero-feature-flip-front {
          opacity: 0;
        }
        .hero-feature-flip:active .hero-feature-flip-back {
          opacity: 1;
        }
        .hero-feature-flip:focus-visible .hero-feature-flip-inner {
          transform: rotateY(180deg);
        }
        .hero-feature-flip:focus-visible .hero-feature-flip-front {
          opacity: 0;
        }
        .hero-feature-flip:focus-visible .hero-feature-flip-back {
          opacity: 1;
        }
        .hero-feature-callout--top {
          left: 114px;
          top: 74px;
        }
        .hero-feature-callout--top::before {
          transform: rotate(-8deg);
        }
        .hero-feature-callout--upper-mid {
          left: 134px;
          top: 206px;
        }
        .hero-feature-callout--upper-mid::before {
          width: 160px;
          left: -172px;
          transform: rotate(-2deg);
        }
        .hero-feature-callout--lower-mid {
          left: 132px;
          top: 338px;
        }
        .hero-feature-callout--lower-mid::before {
          width: 166px;
          left: -178px;
          transform: rotate(4deg);
        }
        .hero-feature-callout--bottom {
          left: 110px;
          top: 468px;
        }
        .hero-feature-callout--bottom::before {
          width: 150px;
          left: -162px;
          transform: rotate(12deg);
        }
        .dark .hero-feature-icon {
          background: transparent;
          color: #d7e5d8;
          box-shadow: none;
        }
        .dark .hero-feature-flip-face {
          border-color: rgba(91, 107, 97, 0.92);
          background: rgba(41, 49, 56, 0.92);
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.34);
        }
        .dark .hero-feature-callout::before {
          background: linear-gradient(90deg, rgba(146, 171, 149, 0) 0%, rgba(146, 171, 149, 0.4) 38%, rgba(170, 199, 175, 0.86) 100%);
        }
      `}</style>

      <Footer />
    </div>
  );
}

function CategoryCard({ icon: Icon, title, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[164px] w-[min(78vw,320px)] shrink-0 flex-col text-left rounded-2xl bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] p-5 sm:min-h-[176px] sm:w-[280px] sm:p-6 lg:min-h-[200px] lg:w-[320px] lg:rounded-[1.6rem] lg:p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f5f2] dark:bg-[#353c44] lg:h-14 lg:w-14 lg:rounded-2xl">
        <Icon className="h-6 w-6 text-[#588157] dark:text-[#6f9b74] lg:h-7 lg:w-7" />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="text-lg font-bold text-[#102a1b] dark:text-white lg:text-[1.35rem]">{title}</div>
        <div className="mt-auto pt-2 text-sm text-[#344e41] dark:text-[#d0d7dd] lg:text-[0.95rem]">Browse specialists -&gt;</div>
      </div>
    </button>
  );
}

function MobileCategoryCarousel({ categories, onCategoryClick }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const segmentRef = useRef(null);
  const frameRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const offsetRef = useRef(0);
  const segmentWidthRef = useRef(0);
  const suppressClickRef = useRef(false);
  const scrollSpeedRef = useRef(20);
  const isPageVisibleRef = useRef(true);
  const isCarouselVisibleRef = useRef(true);
  const activePointerTypeRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startOffset: 0,
  });
  const orbitPausedRef = useRef(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const repeatedCategoryGroups = useMemo(() => [categories, categories, categories], [categories]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const segment = segmentRef.current;
    if (!viewport || !track || !segment) return undefined;

    const applyTransform = () => {
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    };

    const normalizeLoopOffset = () => {
      const segmentWidth = segmentWidthRef.current;
      if (segmentWidth <= 0) return;

      if (offsetRef.current === 0) {
        offsetRef.current = -segmentWidth;
      }

      while (offsetRef.current >= 0) {
        offsetRef.current -= segmentWidth;
      }
      while (offsetRef.current <= segmentWidth * -2) {
        offsetRef.current += segmentWidth;
      }

    };

    const syncLoopPosition = () => {
      normalizeLoopOffset();
      applyTransform();
    };

    const measure = () => {
      const segmentWidth = segment.getBoundingClientRect().width;
      if (segmentWidth <= 0) return;
      const previousSegmentWidth = segmentWidthRef.current || segmentWidth;
      segmentWidthRef.current = segmentWidth;

      if (offsetRef.current === 0) {
        offsetRef.current = -segmentWidth;
      } else if (previousSegmentWidth > 0 && previousSegmentWidth !== segmentWidth) {
        // Preserve relative carousel position when iOS viewport height changes.
        offsetRef.current = (offsetRef.current / previousSegmentWidth) * segmentWidth;
      }

      normalizeLoopOffset();
      applyTransform();
    };

    measure();

    const resizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            measure();
          })
        : null;
    resizeObserver?.observe(segment);

    const handleResize = () => {
      measure();
    };
    window.addEventListener('resize', handleResize);

    const tick = (timestamp) => {
      const currentTrack = trackRef.current;
      if (!currentTrack) return;

      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (
        isPageVisibleRef.current &&
        isCarouselVisibleRef.current &&
        !dragStateRef.current.active &&
        !orbitPausedRef.current
      ) {
        offsetRef.current += (scrollSpeedRef.current * delta) / 1000;
        normalizeLoopOffset();
        applyTransform();
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      if (isPageVisibleRef.current) {
        lastTimestampRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intersectionObserver =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            ([entry]) => {
              isCarouselVisibleRef.current = Boolean(entry?.isIntersecting);
              if (isCarouselVisibleRef.current) {
                lastTimestampRef.current = 0;
              }
            },
            { threshold: 0.08 }
          )
        : null;
    intersectionObserver?.observe(viewport);

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      lastTimestampRef.current = 0;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [repeatedCategoryGroups]);

  const beginDrag = ({ pointerId = null, clientX }) => {
    orbitPausedRef.current = true;
    dragStateRef.current = {
      active: true,
      moved: false,
      pointerId,
      startX: clientX,
      startOffset: offsetRef.current || -segmentWidthRef.current || 0,
    };
    setIsInteracting(true);
    lastTimestampRef.current = 0;
  };

  const moveDrag = (clientX) => {
    const dragState = dragStateRef.current;
    const track = trackRef.current;
    if (!track || !dragState.active) return;

    const deltaX = clientX - dragState.startX;
    if (Math.abs(deltaX) > 4 && !dragState.moved) {
      dragStateRef.current.moved = true;
      suppressClickRef.current = true;
    }

    offsetRef.current = dragState.startOffset + deltaX;
    const segmentWidth = segmentWidthRef.current;
    if (segmentWidth > 0) {
      while (offsetRef.current >= 0) {
        offsetRef.current -= segmentWidth;
      }
      while (offsetRef.current <= segmentWidth * -2) {
        offsetRef.current += segmentWidth;
      }
    }

    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  };

  const endDrag = () => {
    dragStateRef.current = {
      active: false,
      moved: false,
      pointerId: null,
      startX: 0,
      startOffset: 0,
    };
    setIsInteracting(false);
    orbitPausedRef.current = false;
    lastTimestampRef.current = 0;
  };

  const handleTouchStart = (event) => {
    if (typeof window !== 'undefined' && 'PointerEvent' in window) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    beginDrag({ clientX: touch.clientX });
  };

  const handleTouchMove = (event) => {
    if (typeof window !== 'undefined' && 'PointerEvent' in window) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    moveDrag(touch.clientX);
    if (dragStateRef.current.moved) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (typeof window !== 'undefined' && 'PointerEvent' in window) return;
    if (dragStateRef.current.active) {
      endDrag();
    }
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    activePointerTypeRef.current = event.pointerType || null;
    beginDrag({ pointerId: event.pointerId, clientX: event.clientX });
    trackRef.current?.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    moveDrag(event.clientX);
  };

  const handlePointerUp = () => {
    const track = trackRef.current;
    if (track && dragStateRef.current.pointerId !== null) {
      track.releasePointerCapture?.(dragStateRef.current.pointerId);
    }
    activePointerTypeRef.current = null;
    endDrag();
  };

  const handlePointerLeave = () => {
    if (activePointerTypeRef.current === 'touch') {
      return;
    }
    if (dragStateRef.current.active) {
      endDrag();
    }
  };

  const handleCategoryClick = (event) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      return;
    }
    onCategoryClick();
  };

  return (
    <div className="relative -mx-3 px-3 pt-4 pb-1 sm:-mx-6 sm:px-6">
      <div ref={viewportRef} className="relative overflow-hidden">
        <div
          ref={trackRef}
          className={`relative flex w-max items-stretch py-2 select-none ${
            isInteracting ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'pan-y pinch-zoom', willChange: 'transform' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {repeatedCategoryGroups.map((group, groupIndex) => (
            <div
              key={`mobile-group-${groupIndex}`}
              ref={groupIndex === 0 ? segmentRef : null}
              className="flex shrink-0 gap-4 pr-4"
            >
              {group.map((category, index) => (
                <div key={`${category.title}-${groupIndex}-${index}`} className="shrink-0">
                  <CategoryCard
                    icon={category.icon}
                    title={category.title}
                    onClick={handleCategoryClick}
                    className="w-[min(82vw,320px)] min-h-[168px]"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryOrbitRow({ categories, onCategoryClick }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const segmentRef = useRef(null);
  const frameRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const offsetRef = useRef(0);
  const segmentWidthRef = useRef(0);
  const suppressClickRef = useRef(false);
  const scrollSpeedRef = useRef(18);
  const isPageVisibleRef = useRef(true);
  const isCarouselVisibleRef = useRef(true);
  const activePointerTypeRef = useRef(null);
  const dragStateRef = useRef({
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
  });
  const [isInteracting, setIsInteracting] = useState(false);
  const repeatedCategoryGroups = useMemo(() => [categories, categories, categories], [categories]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const segment = segmentRef.current;
    if (!viewport || !track || !segment) return undefined;

    const applyTransform = () => {
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    };

    const normalizeLoopOffset = () => {
      const segmentWidth = segmentWidthRef.current;
      if (segmentWidth <= 0) return;

      if (offsetRef.current === 0) {
        offsetRef.current = -segmentWidth;
      }

      while (offsetRef.current >= 0) {
        offsetRef.current -= segmentWidth;
      }
      while (offsetRef.current <= segmentWidth * -2) {
        offsetRef.current += segmentWidth;
      }

    };

    const syncLoopPosition = ({ shouldApplyTransform = true } = {}) => {
      normalizeLoopOffset();
      if (shouldApplyTransform) applyTransform();
    };

    const measure = () => {
      const segmentWidth = segment.getBoundingClientRect().width;
      if (segmentWidth <= 0) return;
      const previousSegmentWidth = segmentWidthRef.current || segmentWidth;
      segmentWidthRef.current = segmentWidth;
      if (offsetRef.current !== 0 && previousSegmentWidth > 0 && previousSegmentWidth !== segmentWidth) {
        offsetRef.current = (offsetRef.current / previousSegmentWidth) * segmentWidth;
      }
      syncLoopPosition();
    };

    measure();

    const resizeObserver =
      typeof ResizeObserver === 'function'
        ? new ResizeObserver(() => {
            measure();
          })
        : null;
    resizeObserver?.observe(track);

    const handleResize = () => {
      measure();
    };
    window.addEventListener('resize', handleResize);

    const tick = (timestamp) => {
      const currentTrack = trackRef.current;
      if (!currentTrack) return;

      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (isPageVisibleRef.current && isCarouselVisibleRef.current && !dragStateRef.current.active) {
        offsetRef.current += (scrollSpeedRef.current * delta) / 1000;
      }

      normalizeLoopOffset();
      applyTransform();
      frameRef.current = window.requestAnimationFrame(tick);
    };

    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      if (isPageVisibleRef.current) {
        lastTimestampRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intersectionObserver =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            ([entry]) => {
              isCarouselVisibleRef.current = Boolean(entry?.isIntersecting);
              if (isCarouselVisibleRef.current) {
                lastTimestampRef.current = 0;
              }
            },
            { threshold: 0.08 }
          )
        : null;
    intersectionObserver?.observe(viewport);

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      lastTimestampRef.current = 0;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [repeatedCategoryGroups]);

  const beginDrag = ({ pointerId = null, clientX }) => {
    const track = trackRef.current;
    if (!track) return;

    dragStateRef.current = {
      active: true,
      moved: false,
      pointerId,
      startX: clientX,
      startScrollLeft: offsetRef.current || -segmentWidthRef.current || 0,
    };
    setIsInteracting(true);
    lastTimestampRef.current = 0;
  };

  const moveDrag = (clientX) => {
    const dragState = dragStateRef.current;
    const track = trackRef.current;
    if (!track || !dragState.active) return;

    const deltaX = clientX - dragState.startX;
    if (Math.abs(deltaX) > 4 && !dragState.moved) {
      dragStateRef.current.moved = true;
      suppressClickRef.current = true;
    }

    offsetRef.current = dragState.startScrollLeft + deltaX;
    const segmentWidth = segmentWidthRef.current;
    if (segmentWidth > 0) {
      while (offsetRef.current >= 0) {
        offsetRef.current -= segmentWidth;
      }
      while (offsetRef.current <= segmentWidth * -2) {
        offsetRef.current += segmentWidth;
      }
    }
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  };

  const endDrag = () => {
    dragStateRef.current = {
      active: false,
      moved: false,
      pointerId: null,
      startX: 0,
      startScrollLeft: 0,
    };
    lastTimestampRef.current = 0;
    setIsInteracting(false);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    activePointerTypeRef.current = event.pointerType || null;
    beginDrag({ pointerId: event.pointerId, clientX: event.clientX });
    trackRef.current?.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    moveDrag(event.clientX);
  };

  const handlePointerUp = () => {
    const track = trackRef.current;
    if (track && dragStateRef.current.pointerId !== null) {
      track.releasePointerCapture?.(dragStateRef.current.pointerId);
    }
    activePointerTypeRef.current = null;
    endDrag();
  };

  const handlePointerLeave = () => {
    if (activePointerTypeRef.current === 'touch') {
      return;
    }
    if (dragStateRef.current.active) {
      endDrag();
    }
  };

  const handleTouchStart = (event) => {
    if (typeof window !== 'undefined' && 'PointerEvent' in window) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    beginDrag({ clientX: touch.clientX });
  };

  const handleTouchMove = (event) => {
    if (typeof window !== 'undefined' && 'PointerEvent' in window) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    moveDrag(touch.clientX);
    if (dragStateRef.current.moved) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (typeof window !== 'undefined' && 'PointerEvent' in window) return;
    if (dragStateRef.current.active) {
      endDrag();
    }
  };

  const handleCategoryClick = (event) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      return;
    }
    onCategoryClick();
  };

  return (
    <div className="relative overflow-hidden px-0 pt-4 pb-2 sm:px-2 sm:pt-5 sm:pb-3">
      <div ref={viewportRef} className="orbit-shell relative overflow-hidden">
        <div
          ref={trackRef}
          className={`orbit-track relative flex w-max items-stretch py-5 sm:py-6 select-none ${
            isInteracting ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'pan-y pinch-zoom', willChange: 'transform' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {repeatedCategoryGroups.map((group, groupIndex) => (
            <div
              key={`orbit-group-${groupIndex}`}
              ref={groupIndex === 0 ? segmentRef : null}
              className="flex shrink-0 items-stretch gap-5 pr-5 lg:gap-6 lg:pr-6"
            >
              {group.map((cat, index) => (
                <div key={`${cat.title}-${groupIndex}-${index}`} className="shrink-0">
                  <CategoryCard icon={cat.icon} title={cat.title} onClick={handleCategoryClick} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThinSectionLine({ className = '' }) {
  return (
      <div
        className={`pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#b8ad94] to-transparent opacity-95 shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:via-[#5b6672] dark:shadow-[0_1px_0_rgba(12,24,40,0.7)] ${className}`}
        aria-hidden="true"
      />
    );
}







