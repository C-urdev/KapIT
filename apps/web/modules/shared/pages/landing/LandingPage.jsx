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
import heroBg from '../../../assets/hero-bg.svg';
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gradient-to-b dark:from-[#0a1628] dark:via-[#0f2139] dark:to-[#162842]">
      <div ref={topRef} />
      <header className="sticky top-0 z-30 bg-white/75 dark:bg-[#0f2139]/75 backdrop-blur">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 flex flex-wrap justify-between items-center gap-3">
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
              className="inline-flex px-3 sm:px-4 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] bg-white dark:bg-[#162842] text-[#344e41] dark:text-white text-sm sm:text-base font-semibold hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className={`group relative inline-flex px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base text-white font-semibold transition-all duration-500 ease-out ${
                highlightGetStarted
                  ? 'bg-[#3a5a40] dark:bg-[#3ba9d6] -translate-y-1 scale-105 shadow-[0_0_0_1px_rgba(255,255,255,0.14)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_0_18px_rgba(59,130,246,0.38),0_0_32px_rgba(139,92,246,0.42)]'
                  : 'bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de]'
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
                      : 'linear-gradient(115deg, #a855f7 0%, #3b82f6 45%, #22d3ee 100%)',
                  boxShadow:
                    theme === 'dark' && highlightGetStarted
                      ? '0 0 0 1px rgba(167, 139, 250, 0.9), 0 0 20px rgba(59, 130, 246, 0.45), 0 0 36px rgba(34, 211, 238, 0.35)'
                      : 'none',
                }}
              />
              <span
                className={`absolute inset-[1px] rounded-[0.62rem] ${
                  highlightGetStarted
                    ? 'bg-[#3a5a40] dark:bg-[#3ba9d6]'
                    : 'bg-[#3a5a40] dark:bg-[#3ba9d6] sm:group-hover:bg-[#344e41] dark:sm:group-hover:bg-[#5bc0de]'
                }`}
                aria-hidden="true"
              />
              <span className="relative z-10">Get Started</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
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
          style={{ backgroundImage: `url(${heroBg})` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-white dark:to-[#0f2139]" aria-hidden="true" />

        <div className="relative flex-1 flex items-center">
          <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-16 sm:py-20 lg:py-24">
            <div className="max-w-6xl mx-auto text-center w-full">
              <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-[#162842]/70 border border-white/40 dark:border-[#1e3a5f] text-sm font-semibold text-[#344e41] dark:text-[#b8d4e8] backdrop-blur">
                <Users className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                Marketplace for Filipino IT talent
              </p>

              <h2 className="mt-8 text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold tracking-tight text-[#102a1b] dark:text-white max-w-6xl mx-auto">
                Connect Filipino IT Talent with Opportunity
              </h2>

              <form onSubmit={handleSearch} className="mt-16 sm:mt-20">
                <div className="mx-auto max-w-5xl">
                  <div className="flex flex-col gap-2 rounded-2xl bg-white/85 dark:bg-[#0f2139]/85 border border-[#a3b18a] dark:border-[#2a4a6f] shadow-lg shadow-black/5 dark:shadow-[#3ba9d6]/10 p-2 backdrop-blur sm:flex-row sm:items-stretch">
                    <div className="flex min-w-0 flex-1 items-center pl-3">
                      <Search className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[#588157] dark:text-[#3ba9d6]" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search developers, skills, or services..."
                        className="min-w-0 flex-1 bg-transparent px-3 sm:px-4 py-4 text-base sm:text-lg text-[#102a1b] dark:text-white placeholder:text-[#344e41]/70 dark:placeholder:text-[#b8d4e8]/70 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="shrink-0 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] px-5 sm:px-8 min-w-[112px] sm:min-w-0 text-white text-base sm:text-lg font-semibold transition-colors"
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
                        className="px-4 py-2 rounded-full text-sm font-semibold border border-[#a3b18a] dark:border-[#2a4a6f] bg-white/70 dark:bg-[#162842]/60 text-[#344e41] dark:text-[#b8d4e8] hover:bg-white dark:hover:bg-[#1e3a5f] transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-5">
                    <button
                      type="button"
                      onClick={handleOpenAccountChoice}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white/85 dark:bg-[#162842]/70 border border-[#a3b18a] dark:border-[#2a4a6f] text-[#102a1b] dark:text-white text-base sm:text-lg font-semibold hover:bg-white dark:hover:bg-[#1e3a5f] transition-colors backdrop-blur"
                    >
                      Find Developers <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleJoinDeveloperClick}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white text-base sm:text-lg font-semibold transition-colors"
                    >
                      Join as Developer <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="relative bg-white/95 dark:bg-[#0f2139]/95 backdrop-blur">
          <ThinSectionLine className="top-0" />
          <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-6 sm:py-7">
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
              <p className="text-sm font-semibold text-[#344e41] dark:text-[#b8d4e8]">
                Trusted by companies hiring Filipino tech talent
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {TRUSTED_LOGOS.map((name) => (
                  <div
                    key={name}
                    className="text-sm sm:text-base font-semibold tracking-wide text-slate-500 dark:text-slate-400 opacity-80 grayscale"
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
        className="relative bg-gradient-to-b from-[#e2ddcf] via-[#ebe6da] to-[#f7f6f1] dark:bg-gradient-to-b dark:from-[#0f2139] dark:via-[#102743] dark:to-[#132d4d] scroll-mt-24"
      >
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 pt-14 pb-10 min-h-[360px] sm:min-h-[400px]">
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

      <section className="relative bg-gradient-to-b from-[#fbfaf6] via-[#fbfaf6] via-[97%] to-[#f8f4ec] dark:bg-gradient-to-b dark:from-[#132d4d] dark:via-[#102743] dark:to-[#0f2139]">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 pt-10 pb-10 min-h-[360px] sm:min-h-[400px]">
          <div className="max-w-3xl">
            <h3 className="text-3xl font-bold text-[#102a1b] dark:text-white">How KapIT works</h3>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#7fd0ee]">Step 1</p>
              <h4 className="mt-3 text-2xl font-bold text-[#102a1b] dark:text-white">Create your profile</h4>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-[#344e41] dark:text-[#b8d4e8]">
                Create your developer profile or company account.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#7fd0ee]">Step 2</p>
              <h4 className="mt-3 text-2xl font-bold text-[#102a1b] dark:text-white">Showcase work</h4>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-[#344e41] dark:text-[#b8d4e8]">
                Showcase portfolios or post IT projects with clear requirements.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#7fd0ee]">Step 3</p>
              <h4 className="mt-3 text-2xl font-bold text-[#102a1b] dark:text-white">Connect & collaborate</h4>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-[#344e41] dark:text-[#b8d4e8]">
                Connect and collaborate with Filipino IT talent.
              </p>
            </div>
          </div>
        </div>
        <ThinSectionLine className="bottom-0 z-10" />
      </section>

      <section className="relative bg-gradient-to-b from-[#f8f4ec] via-[#eee9de] via-[8%] to-[#e2ddcf] dark:bg-gradient-to-b dark:from-[#0f2139] dark:via-[#0d1d33] dark:to-[#0a1628]">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-10 min-h-[360px] sm:min-h-[400px] flex items-center">
          <div className="w-full px-2 sm:px-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#102a1b] dark:text-white">
                Start building with Filipino IT Talent
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:shrink-0">
              <button
                type="button"
                onClick={handleOpenAccountChoice}
                className="w-full sm:w-auto inline-flex min-h-[54px] items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#2a4a6f] text-[#102a1b] dark:text-white font-semibold hover:bg-white/90 dark:hover:bg-[#1e3a5f] transition-colors"
              >
                Find Developers <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleJoinDeveloperClick}
                className="w-full sm:w-auto inline-flex min-h-[54px] items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold transition-colors"
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
      className={`group flex min-h-[164px] w-[min(78vw,320px)] shrink-0 flex-col text-left rounded-2xl bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] p-5 sm:min-h-[176px] sm:w-[280px] sm:p-6 lg:min-h-[210px] lg:w-[360px] lg:rounded-[1.75rem] lg:p-8 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f5f2] dark:bg-[#1e3a5f] lg:h-14 lg:w-14 lg:rounded-2xl">
        <Icon className="h-6 w-6 text-[#588157] dark:text-[#3ba9d6] lg:h-7 lg:w-7" />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="text-lg font-bold text-[#102a1b] dark:text-white lg:text-[1.35rem]">{title}</div>
        <div className="mt-auto pt-2 text-sm text-[#344e41] dark:text-[#b8d4e8] lg:text-[0.95rem]">Browse specialists -&gt;</div>
      </div>
    </button>
  );
}

function MobileCategoryCarousel({ categories, onCategoryClick }) {
  const trackRef = useRef(null);
  const segmentRef = useRef(null);
  const frameRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const offsetRef = useRef(0);
  const segmentWidthRef = useRef(0);
  const suppressClickRef = useRef(false);
  const scrollSpeedRef = useRef(20);
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
    const track = trackRef.current;
    const segment = segmentRef.current;
    if (!track || !segment) return undefined;

    const applyTransform = () => {
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    };

    const syncLoopPosition = () => {
      const segmentWidth = segment.getBoundingClientRect().width;
      if (segmentWidth <= 0) return;
      segmentWidthRef.current = segmentWidth;

      if (offsetRef.current === 0) {
        offsetRef.current = -segmentWidth;
      }

      while (offsetRef.current >= 0) {
        offsetRef.current -= segmentWidth;
      }
      while (offsetRef.current <= segmentWidth * -2) {
        offsetRef.current += segmentWidth;
      }

      applyTransform();
    };

    const measure = () => {
      const segmentWidth = segment.getBoundingClientRect().width;
      if (segmentWidth <= 0) return;
      segmentWidthRef.current = segmentWidth;
      offsetRef.current = -segmentWidth;
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

      if (!dragStateRef.current.active && !orbitPausedRef.current) {
        offsetRef.current += (scrollSpeedRef.current * delta) / 1000;
        syncLoopPosition();
      }

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      lastTimestampRef.current = 0;
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(frameRef.current);
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
    const touch = event.touches?.[0];
    if (!touch) return;
    beginDrag({ clientX: touch.clientX });
  };

  const handleTouchMove = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    moveDrag(touch.clientX);
    if (dragStateRef.current.moved) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
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
      <div className="relative overflow-hidden">
        <div
          ref={trackRef}
          className={`relative flex w-max items-stretch py-2 select-none ${
            isInteracting ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'pan-y pinch-zoom' }}
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
  const trackRef = useRef(null);
  const segmentRef = useRef(null);
  const frameRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const offsetRef = useRef(0);
  const segmentWidthRef = useRef(0);
  const suppressClickRef = useRef(false);
  const scrollSpeedRef = useRef(18);
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
    const track = trackRef.current;
    const segment = segmentRef.current;
    if (!track || !segment) return undefined;

    const applyTransform = () => {
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    };

    const syncLoopPosition = ({ shouldApplyTransform = true } = {}) => {
      const segmentWidth = segment.getBoundingClientRect().width;
      if (segmentWidth <= 0) return;
      segmentWidthRef.current = segmentWidth;

      if (offsetRef.current === 0) {
        offsetRef.current = -segmentWidth;
      }

      while (offsetRef.current >= 0) {
        offsetRef.current -= segmentWidth;
      }
      while (offsetRef.current <= segmentWidth * -2) {
        offsetRef.current += segmentWidth;
      }

      if (shouldApplyTransform) {
        applyTransform();
      }
    };

    const measure = () => {
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

      if (!dragStateRef.current.active) {
        offsetRef.current += (scrollSpeedRef.current * delta) / 1000;
      }

      syncLoopPosition();
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      lastTimestampRef.current = 0;
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(frameRef.current);
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
    endDrag();
  };

  const handlePointerLeave = () => {
    if (dragStateRef.current.active) {
      endDrag();
    }
  };

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    beginDrag({ clientX: touch.clientX });
  };

  const handleTouchMove = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    moveDrag(touch.clientX);
    if (dragStateRef.current.moved) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
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
      <div className="orbit-shell relative overflow-hidden">
        <div
          ref={trackRef}
          className={`orbit-track relative flex w-max items-stretch py-5 sm:py-6 select-none ${
            isInteracting ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ touchAction: 'pan-y pinch-zoom' }}
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
        className={`pointer-events-none absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#b8ad94] to-transparent opacity-95 shadow-[0_1px_0_rgba(255,255,255,0.45)] dark:via-[#6d95c5] dark:shadow-[0_1px_0_rgba(12,24,40,0.7)] ${className}`}
        aria-hidden="true"
      />
    );
}






