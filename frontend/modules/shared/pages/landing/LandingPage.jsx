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
} from 'lucide-react';
import { useTheme } from '@sharedContext/ThemeContext';
import Footer from '@sharedComponents/branding/Footer';
import KapITLogo from '@sharedComponents/branding/KapITLogo';

const QUICK_TAGS = [
  'Frontend Development',
  'Backend Development',
  'UI/UX Design',
  'Cybersecurity',
  'Database Development',
  'Mobile Development',
];

const TRUSTED_LOGOS = ['Google', 'Microsoft', 'PayPal', 'Meta'];

const CATEGORIES = [
  { title: 'Programming & Tech', icon: Code2 },
  { title: 'Cybersecurity', icon: Shield },
  { title: 'UI/UX Design', icon: Palette },
  { title: 'Mobile Development', icon: Smartphone },
  { title: 'AI & Data', icon: Cpu },
  { title: 'Cloud & DevOps', icon: Cloud },
];

const LANDING_BG_STARS = [
  { top: '8%', left: '10%', size: 'h-1 w-1', delay: '0s' },
  { top: '12%', left: '24%', size: 'h-1.5 w-1.5', delay: '0.8s' },
  { top: '10%', left: '42%', size: 'h-1 w-1', delay: '1.4s' },
  { top: '15%', left: '59%', size: 'h-1.5 w-1.5', delay: '0.5s' },
  { top: '11%', left: '76%', size: 'h-1 w-1', delay: '1.8s' },
  { top: '18%', left: '89%', size: 'h-1.5 w-1.5', delay: '1.1s' },
  { top: '26%', left: '13%', size: 'h-1 w-1', delay: '0.7s' },
  { top: '31%', left: '31%', size: 'h-1.5 w-1.5', delay: '1.9s' },
  { top: '35%', left: '49%', size: 'h-1 w-1', delay: '0.3s' },
  { top: '39%', left: '66%', size: 'h-1.5 w-1.5', delay: '1.5s' },
  { top: '43%', left: '84%', size: 'h-1 w-1', delay: '0.9s' },
  { top: '52%', left: '17%', size: 'h-1.5 w-1.5', delay: '1.2s' },
  { top: '57%', left: '37%', size: 'h-1 w-1', delay: '0.2s' },
  { top: '63%', left: '56%', size: 'h-1.5 w-1.5', delay: '1.6s' },
  { top: '68%', left: '74%', size: 'h-1 w-1', delay: '0.6s' },
  { top: '74%', left: '91%', size: 'h-1.5 w-1.5', delay: '1.3s' },
];

export default function LandingPage({ onGetStarted, onJoinDeveloper, onSignIn }) {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [highlightGetStarted, setHighlightGetStarted] = useState(false);
  const [isDesktopCarousel, setIsDesktopCarousel] = useState(false);
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

  const handleOpenAccountChoice = () => {
    highlightTopGetStarted();
    window.setTimeout(() => {
      onGetStarted?.();
    }, 120);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gradient-to-b dark:from-[#121416] dark:via-[#1a1d20] dark:to-[#22272b]">
      <div ref={topRef} />
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/78 dark:border-[#2f353c] dark:bg-[#121416]/90 backdrop-blur-xl">
        <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-4 flex flex-wrap justify-between items-center gap-3">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-3"
            aria-label="Back to top"
          >
            <KapITLogo className="w-10 h-10 rounded-lg object-contain bg-white" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#3a5a40] dark:text-white">KapIT</h1>
          </button>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex px-3 sm:px-4 py-2 rounded-lg border border-[#a3b18a] dark:border-[#444d57] bg-white dark:bg-[#22272b] text-[#344e41] dark:text-white text-sm sm:text-base font-semibold hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className={`group relative inline-flex px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base text-white font-semibold transition-all duration-500 ease-out ${
                highlightGetStarted
                  ? 'bg-[#3a5a40] dark:bg-[#6f9b74] -translate-y-1 scale-105 shadow-[0_0_0_1px_rgba(255,255,255,0.14)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_0_18px_rgba(111,155,116,0.34),0_0_30px_rgba(240,199,102,0.22)]'
                  : 'bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute -inset-[2px] rounded-[0.72rem] transition-opacity duration-300 ${
                  highlightGetStarted ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  background:
                    theme === 'light'
                      ? 'linear-gradient(115deg, #c2410c 0%, #f97316 45%, #facc15 100%)'
                      : 'linear-gradient(115deg, #4b5f52 0%, #6f9b74 52%, #f0c766 100%)',
                  boxShadow:
                    theme === 'dark' && highlightGetStarted
                      ? '0 0 0 1px rgba(111, 155, 116, 0.75), 0 0 18px rgba(111, 155, 116, 0.35), 0 0 34px rgba(240, 199, 102, 0.22)'
                      : 'none',
                }}
              />
              <span
                className={`absolute inset-[1px] rounded-[0.62rem] ${
                  highlightGetStarted
                    ? 'bg-[#3a5a40] dark:bg-[#6f9b74]'
                    : 'bg-[#3a5a40] dark:bg-[#6f9b74] sm:group-hover:bg-[#344e41] dark:sm:group-hover:bg-[#82ad86]'
                }`}
                aria-hidden="true"
              />
              <span className="relative z-10">Get Started</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-[#344e41]" /> : <Sun className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
        <ThinSectionLine className="bottom-0" />
      </header>

      <section className="relative overflow-hidden min-h-[calc(100vh-5rem)] flex flex-col">
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
                  : 'radial-gradient(58% 44% at 50% 14%, rgba(16, 185, 129, 0.1) 0%, rgba(163, 230, 53, 0.06) 44%, rgba(247, 246, 241, 0) 86%), radial-gradient(58% 38% at 50% 72%, rgba(245, 222, 179, 0.18) 0%, rgba(247,246,241,0) 80%)',
            }}
          />
          <div
            className="landing-bg-horizon absolute inset-x-[-10%] bottom-[8%] h-36 sm:h-44"
            style={{
              background:
                theme === 'dark'
                  ? 'radial-gradient(58% 90% at 50% 100%, rgba(203, 213, 225, 0.2) 0%, rgba(148, 163, 184, 0.12) 36%, rgba(18,20,22,0) 76%)'
                  : 'radial-gradient(58% 90% at 50% 100%, rgba(132, 204, 22, 0.14) 0%, rgba(16, 185, 129, 0.1) 34%, rgba(247,246,241,0) 78%)',
            }}
          />
          <div
            className="landing-bg-wave absolute inset-x-[7%] bottom-[10%] h-20 rounded-[50%] border"
            style={{
              borderColor: theme === 'dark' ? 'rgba(203,213,225,0.24)' : 'rgba(132, 204, 22, 0.34)',
            }}
          />
          <div
            className="landing-bg-wave landing-bg-wave-delay absolute inset-x-[15%] bottom-[11.5%] h-16 rounded-[50%] border"
            style={{
              borderColor: theme === 'dark' ? 'rgba(226,232,240,0.18)' : 'rgba(101, 163, 13, 0.3)',
            }}
          />
          {LANDING_BG_STARS.map((star) => (
            <span
              key={`${star.top}-${star.left}`}
              className={`landing-bg-star absolute ${star.size} rounded-full bg-[#facc15] shadow-[0_0_9px_rgba(217,119,6,0.5)] dark:bg-white/80 dark:shadow-none`}
              style={{ top: star.top, left: star.left, animationDelay: star.delay }}
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-white dark:from-[#121416]/58 dark:via-[#121416]/34 dark:to-[#1a1d20]" aria-hidden="true" />

        <div className="relative flex-1 flex items-center">
          <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-16 sm:py-20 lg:py-24">
            <div className="max-w-6xl mx-auto text-center w-full">
              <h2 className="mt-8 text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold tracking-tight text-[#102a1b] dark:text-white max-w-6xl mx-auto">
                Connect Filipino IT Talent with Opportunity
              </h2>

              <form onSubmit={handleSearch} className="mt-16 sm:mt-20">
                <div className="mx-auto max-w-5xl">
                  <div className="flex items-stretch gap-2 overflow-hidden rounded-3xl bg-white/85 dark:bg-[#1a1d20]/85 border border-[#a3b18a] dark:border-[#444d57] shadow-lg shadow-black/5 dark:shadow-[#6f9b74]/10 p-2 backdrop-blur">
                    <div className="flex min-w-0 flex-1 items-center pl-3">
                      <Search className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[#588157] dark:text-[#6f9b74]" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search developers, skills, or services..."
                        className="min-w-0 flex-1 bg-transparent px-3 sm:px-4 py-3.5 sm:py-4 text-base sm:text-lg text-[#102a1b] dark:text-white placeholder:text-[#344e41]/70 dark:placeholder:text-[#d0d7dd]/70 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="shrink-0 my-0.5 mr-0.5 sm:my-1.5 sm:mr-1.5 appearance-none border-0 rounded-xl sm:rounded-[1.15rem] bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] px-4 py-2 sm:px-8 sm:py-3.5 min-w-[75px] sm:min-w-0 text-[0.95rem] text-white font-semibold leading-none shadow transition-all active:scale-95"
                    >
                      Search
                    </button>
                  </div>

                  <div className="mt-8 flex flex-wrap justify-center gap-4">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setQuery(tag);
                          scrollTo(categoriesRef);
                        }}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border border-[#a3b18a] dark:border-[#444d57] bg-white/70 dark:bg-[#22272b]/60 text-[#344e41] dark:text-[#d0d7dd] hover:bg-white dark:hover:bg-[#353c44] transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="mt-12 sm:mt-14 flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-5">
                    <button
                      type="button"
                      onClick={handleOpenAccountChoice}
                      className="w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-xl bg-white/85 dark:bg-[#22272b]/70 border border-[#a3b18a] dark:border-[#444d57] text-[#102a1b] dark:text-white text-[0.95rem] sm:text-lg font-semibold hover:bg-white dark:hover:bg-[#353c44] transition-colors backdrop-blur"
                    >
                      Find Developers <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleJoinDeveloperClick}
                      className="w-auto inline-flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white text-[0.95rem] sm:text-lg font-semibold transition-colors"
                    >
                      Join as Developer <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                  <div className="pointer-events-none relative mt-4 sm:mt-6 h-14 sm:h-16 z-[3]" aria-hidden="true">
                    <div
                      className="absolute left-1/2 top-1/2 h-12 sm:h-14 w-[102%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border"
                      style={{
                        borderColor:
                          theme === 'dark' ? 'rgba(203,213,225,0.28)' : 'rgba(217,119,6,0.42)',
                      }}
                    />
                    <div
                      className="absolute left-1/2 top-1/2 h-9 sm:h-10 w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border"
                      style={{
                        borderColor:
                          theme === 'dark' ? 'rgba(226,232,240,0.22)' : 'rgba(202,138,4,0.36)',
                      }}
                    />
                    <div
                      className="absolute left-1/2 top-1/2 h-7 w-[104%] -translate-x-1/2 -translate-y-1/2"
                      style={{
                        background:
                          theme === 'dark'
                            ? 'radial-gradient(60% 100% at 50% 50%, rgba(203,213,225,0.14) 0%, rgba(148,163,184,0.08) 42%, rgba(0,0,0,0) 76%)'
                            : 'radial-gradient(60% 100% at 50% 50%, rgba(245,158,11,0.24) 0%, rgba(217,119,6,0.14) 42%, rgba(0,0,0,0) 76%)',
                      }}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="relative z-20 bg-white/95 dark:bg-[#1a1d20]/95 backdrop-blur lg:sticky lg:top-[72px]">
          <ThinSectionLine className="top-0" />
          <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 py-4 sm:py-5">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
              <p className="text-sm font-semibold text-[#344e41] dark:text-[#d0d7dd]">
                Trusted by companies hiring Filipino tech talent
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {TRUSTED_LOGOS.map((name) => (
                  <div
                    key={name}
                    className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 opacity-80 grayscale"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ThinSectionLine className="bottom-0" />
        </div>
      </section>

      <section
        ref={categoriesRef}
        className="relative bg-gradient-to-b from-[#e2ddcf] via-[#ebe6da] to-[#f7f6f1] dark:bg-gradient-to-b dark:from-[#1a1d20] dark:via-[#202428] dark:to-[#23282e] scroll-mt-24"
      >
        <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 pt-14 pb-10 min-h-[360px] sm:min-h-[400px]">
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
        <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 pt-14 pb-10 min-h-[360px] sm:min-h-[400px]">
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
        <div className="w-full max-w-[min(100%,1800px)] mx-auto px-3 sm:px-5 lg:px-6 xl:px-7 2xl:px-9 pt-14 pb-10 min-h-[360px] sm:min-h-[400px] flex items-center">
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
      </section>

      <Footer />
    </div>
  );
}

function CategoryCard({ icon: Icon, title, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[164px] w-[min(78vw,320px)] shrink-0 flex-col text-left rounded-2xl bg-white dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] p-5 sm:min-h-[176px] sm:w-[280px] sm:p-6 lg:min-h-[210px] lg:w-[360px] lg:rounded-[1.75rem] lg:p-8 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all ${className}`}
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






