import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Code2,
  Shield,
  Palette,
  Smartphone,
  Cpu,
  Cloud,
  ArrowRight,
  Users,
  ChevronLeft,
  ChevronRight,
  Share2,
  BookOpen,
  SquareStack,
  Star,
} from 'lucide-react';
import Footer from '@sharedComponents/branding/Footer';
import KapITLogo from '@sharedComponents/branding/KapITLogo';
import HeroLampGlow from '@sharedComponents/effects/HeroLampGlow';
import Lamp from '@sharedComponents/effects/Lamp';
import SiteTopNav from '@sharedComponents/navigation/SiteTopNav';
import ThinSectionLine from '@sharedComponents/ui/ThinSectionLine';
import { useTheme } from '@sharedContext/ThemeContext';

const TRUSTED_LOGOS = ['Google', 'Microsoft', 'PayPal', 'Meta'];

const CATEGORIES = [
  { title: 'Programming & Tech', icon: Code2 },
  { title: 'Cybersecurity', icon: Shield },
  { title: 'UI/UX Design', icon: Palette },
  { title: 'Mobile Development', icon: Smartphone },
  { title: 'AI & Data', icon: Cpu },
  { title: 'Cloud & DevOps', icon: Cloud },
];
const HERO_DEMO_DOMAIN = 'kapit.online';

const HERO_REVIEW_CALLOUTS = [
  {
    reviewer: 'Mika R.',
    role: 'Hiring Lead',
    text: 'We started getting great applicants right away. The quality and fit were both impressive.',
    rating: 4.5,
    className: 'hero-review-card--top-right',
  },
  {
    reviewer: 'Janelle P.',
    role: 'Startup Founder',
    text: 'The platform feels clean, fast, and very trustworthy. We loved the positive candidate flow.',
    rating: 4.1,
    className: 'hero-review-card--mid-right',
  },
  {
    reviewer: 'Paolo S.',
    role: 'Product Manager',
    text: 'Shortlisting was easier than expected. We found strong matches without extra back-and-forth.',
    rating: 4.7,
    className: 'hero-review-card--bottom-right',
  },
];

const renderRatingStars = (rating) => {
  const roundedRating = Math.max(0, Math.min(5, rating));

  return (
    <span className="inline-flex items-center gap-0.5 text-[#f0c766]" aria-label={`${roundedRating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const fillAmount = Math.max(0, Math.min(1, roundedRating - index));
        return (
          <span key={`rating-star-${index}`} className="relative inline-flex h-3.5 w-3.5 shrink-0">
            <Star className="absolute inset-0 h-3.5 w-3.5 text-[#d9d9d2]" strokeWidth={1.6} aria-hidden="true" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillAmount * 100}%` }}>
              <Star className="h-3.5 w-3.5 fill-current text-[#f0c766]" strokeWidth={1.6} aria-hidden="true" />
            </span>
          </span>
        );
      })}
    </span>
  );
};

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
  const { theme } = useTheme();
  const [typedDomain, setTypedDomain] = useState('');
  const [showHeroCaret, setShowHeroCaret] = useState(false);
  const [isHeroPreviewLoaded, setIsHeroPreviewLoaded] = useState(false);
  const [highlightGetStarted, setHighlightGetStarted] = useState(false);
  const [isDesktopCarousel, setIsDesktopCarousel] = useState(false);
  const topRef = useRef(null);
  const categoriesRef = useRef(null);
  const heroTypingTimersRef = useRef(new Set());

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

  const handleJoinDeveloperClick = () => {
    onJoinDeveloper?.();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const typingCadenceMs = [120, 112, 126, 118, 114, 152, 122, 118, 132, 116, 136, 128];

    const queue = (callback, delay) => {
      const timer = window.setTimeout(() => {
        heroTypingTimersRef.current.delete(timer);
        callback();
      }, delay);
      heroTypingTimersRef.current.add(timer);
      return timer;
    };

    const clearHeroTypingTimers = () => {
      heroTypingTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      heroTypingTimersRef.current.clear();
    };

    const startDemoCycle = () => {
      clearHeroTypingTimers();
      setTypedDomain('');
      setShowHeroCaret(false);
      setIsHeroPreviewLoaded(false);

      queue(() => {
        setShowHeroCaret(true);
        let charIndex = 0;

        const typeNextCharacter = () => {
          charIndex += 1;
          setTypedDomain(HERO_DEMO_DOMAIN.slice(0, charIndex));

          if (charIndex >= HERO_DEMO_DOMAIN.length) {
            queue(() => {
              setIsHeroPreviewLoaded(true);
              queue(() => setShowHeroCaret(false), 240);
            }, 640);
            return;
          }

          queue(typeNextCharacter, typingCadenceMs[charIndex - 1] ?? 86);
        };

        typeNextCharacter();
      }, 700);
    };

    startDemoCycle();

    const handlePageShow = (event) => {
      if (event.persisted) {
        startDemoCycle();
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      clearHeroTypingTimers();
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
      <SiteTopNav onLogoClick={scrollToTop} onGetStarted={handleOpenAccountChoice} onSignIn={onSignIn} />

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
        <HeroLampGlow />

        <div className="relative z-[5] flex-1 flex items-center">
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
              <div
                className="hero-phone-stage relative group"
              >
                <div className="hero-phone-wrap pointer-events-auto relative z-20">
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

              <div className="hero-review-orbit pointer-events-none">
                {HERO_REVIEW_CALLOUTS.map(({ reviewer, role, text, rating, className }) => (
                  <article key={reviewer} className={`hero-review-card pointer-events-auto ${className}`}>
                    <div className="hero-review-panel">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#102a1b] dark:text-white">{reviewer}</p>
                        <p className="truncate text-xs font-medium text-[#5f6f67] dark:text-[#cbd5e1]">{role}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-[#f0c766]">
                          {renderRatingStars(rating)}
                          <span className="text-[0.72rem] font-semibold tracking-[0.16em] text-[#5f755f] dark:text-[#c9d7cb]">
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-[0.95rem] leading-[1.65] text-[#24412d] dark:text-[#e7efe5]">
                        "{text}"
                      </p>
                    </div>
                  </article>
                ))}
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
      </section>

      <Lamp
        actions={(
          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
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
        )}
      />

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
        .hero-review-orbit {
          position: absolute;
          inset: 0;
          z-index: 16;
          opacity: 0;
          transform: translateX(12px);
          transition: opacity 260ms ease, transform 300ms ease;
        }
        .hero-review-card {
          position: absolute;
          z-index: 15;
          width: min(276px, 32vw);
          max-width: 276px;
          opacity: 0;
          transform: translateX(10px) scale(0.985);
          transition: opacity 260ms ease, transform 300ms ease;
        }
        .hero-review-card::before {
          content: '';
          position: absolute;
          right: calc(100% - 2px);
          top: 50%;
          z-index: 0;
          width: var(--review-line-width, 128px);
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(118, 141, 124, 0), rgba(118, 141, 124, 0.82));
          box-shadow: 0 0 6px rgba(111, 155, 116, 0.12);
          transform: translateY(-50%);
          transform-origin: right center;
        }
        .hero-review-panel {
          position: relative;
          z-index: 1;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(192, 209, 194, 0.95);
          background:
            linear-gradient(180deg, rgba(251, 253, 249, 0.98) 0%, rgba(239, 247, 239, 0.95) 100%);
          padding: 20px 20px 18px;
          box-shadow: 0 18px 38px rgba(23, 40, 28, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(12px);
        }
        .hero-phone-stage:hover .hero-review-orbit,
        .hero-phone-stage:focus-within .hero-review-orbit {
          opacity: 1;
          transform: translateX(0);
        }
        .hero-phone-stage:hover .hero-review-card,
        .hero-phone-stage:focus-within .hero-review-card {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        .dark .hero-review-panel {
          border-color: rgba(73, 85, 78, 0.92);
          background: linear-gradient(180deg, rgba(35, 40, 44, 0.96) 0%, rgba(28, 33, 38, 0.9) 100%);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .hero-review-card--top-right {
          right: 14px;
          top: 24px;
          --review-line-width: 126px;
        }
        .hero-review-card--mid-right {
          right: 20px;
          top: 290px;
          --review-line-width: 118px;
        }
        .hero-review-card--bottom-right {
          right: 16px;
          bottom: 24px;
          --review-line-width: 124px;
        }
        @media (hover: none) and (pointer: coarse) {
          .hero-review-orbit {
            opacity: 1;
            transform: none;
          }
          .hero-review-card {
            opacity: 1;
            transform: none;
          }
        }
        .dark .hero-review-card::before {
          background: linear-gradient(90deg, rgba(170, 199, 175, 0), rgba(170, 199, 175, 0.9));
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






