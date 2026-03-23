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

export default function LandingPage({ onGetStarted, onJoinDeveloper }) {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [highlightGetStarted, setHighlightGetStarted] = useState(false);
  const topRef = useRef(null);
  const categoriesRef = useRef(null);

  const heroSubtitle = useMemo(
    () =>
      'The platform where companies find skilled Filipino developers and IT professionals showcase their portfolios.',
    []
  );

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
    highlightTopGetStarted();
  };

  const highlightTopGetStarted = () => {
    scrollToTop();
    setHighlightGetStarted(false);
    window.setTimeout(() => setHighlightGetStarted(true), 40);
    window.setTimeout(() => setHighlightGetStarted(false), 2200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gradient-to-b dark:from-[#0a1628] dark:via-[#0f2139] dark:to-[#162842]">
      <div ref={topRef} />
      <header className="sticky top-0 z-30 border-b border-[#a3b18a] dark:border-[#1e3a5f] bg-white/75 dark:bg-[#0f2139]/75 backdrop-blur">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-4 flex justify-between items-center">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-3"
            aria-label="Back to top"
          >
            <KapITLogo className="w-10 h-10 rounded-lg object-contain bg-white" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#3a5a40] dark:text-white">KapIT</h1>
          </button>

          <div className="flex items-center gap-2">
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
              <p className="mt-8 text-xl sm:text-2xl text-[#344e41] dark:text-[#b8d4e8] max-w-4xl mx-auto leading-relaxed">
                {heroSubtitle}
              </p>

              <form onSubmit={handleSearch} className="mt-16 sm:mt-20">
                <div className="mx-auto max-w-5xl">
                  <div className="flex items-stretch gap-2 rounded-2xl bg-white/85 dark:bg-[#0f2139]/85 border border-[#a3b18a] dark:border-[#2a4a6f] shadow-lg shadow-black/5 dark:shadow-[#3ba9d6]/10 p-2 backdrop-blur">
                    <div className="flex items-center pl-3">
                      <Search className="w-6 h-6 text-[#588157] dark:text-[#3ba9d6]" />
                    </div>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search developers, skills, or services..."
                      className="flex-1 bg-transparent px-4 py-4 text-base sm:text-lg text-[#102a1b] dark:text-white placeholder:text-[#344e41]/70 dark:placeholder:text-[#b8d4e8]/70 outline-none"
                    />
                    <button
                      type="submit"
                      className="px-6 sm:px-8 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white text-base sm:text-lg font-semibold transition-colors"
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
                      onClick={highlightTopGetStarted}
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

        <div className="relative border-y border-[#a3b18a]/60 dark:border-[#1e3a5f] bg-white/95 dark:bg-[#0f2139]/95 backdrop-blur">
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
        </div>
      </section>

      <section
        ref={categoriesRef}
        className="relative bg-gradient-to-b from-[#e2ddcf] via-[#ebe6da] to-[#f7f6f1] dark:bg-[#0f2139] scroll-mt-24"
      >
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 pt-14 pb-8 min-h-[360px] sm:min-h-[400px]">
          <div className="max-w-3xl">
            <h3 className="text-3xl font-bold text-[#102a1b] dark:text-white">Explore categories</h3>
            <p className="mt-2 text-[#344e41] dark:text-[#b8d4e8]">
              Browse popular areas and find specialists with portfolios you can verify.
            </p>
          </div>

          <div className="mt-8">
            <CategoryOrbitRow categories={CATEGORIES} onCategoryClick={highlightTopGetStarted} />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#bfb6a1] to-transparent dark:via-[#5f87b5]/85"
          aria-hidden="true"
        />
      </section>

      <section className="relative bg-gradient-to-b from-[#fbfaf6] via-[#fbfaf6] via-[97%] to-[#f8f4ec] dark:bg-[#0f2139]">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 pt-10 pb-8 min-h-[360px] sm:min-h-[400px]">
          <div className="max-w-3xl">
            <h3 className="text-3xl font-bold text-[#102a1b] dark:text-white">How KapIT works</h3>
            <p className="mt-2 text-[#344e41] dark:text-[#b8d4e8]">
              A simple workflow designed for graduates, developers, and hiring teams.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            <StepCard
              step="Step 1"
              title="Create your profile"
              description="Create your developer profile or company account."
              icon={Users}
            />
            <StepCard
              step="Step 2"
              title="Showcase work"
              description="Showcase portfolios or post IT projects with clear requirements."
              icon={Code2}
            />
            <StepCard
              step="Step 3"
              title="Connect & collaborate"
              description="Connect and collaborate with Filipino IT talent."
              icon={ArrowRight}
            />
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[2px] bg-gradient-to-r from-transparent via-[#b8af9b] to-transparent dark:via-[#5f87b5]/85"
          aria-hidden="true"
        />
      </section>

      <section className="relative bg-gradient-to-b from-[#f8f4ec] via-[#eee9de] via-[8%] to-[#e2ddcf] dark:bg-[#0a1628]">
        <div className="w-full max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 py-10 min-h-[360px] sm:min-h-[400px] flex items-center">
          <div className="rounded-3xl border border-white/50 dark:border-[#1e3a5f] bg-white/60 dark:bg-[#0f2139]/50 backdrop-blur p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-lg shadow-black/5 dark:shadow-[#3ba9d6]/10">
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#102a1b] dark:text-white">
                Start building with Filipino IT Talent
              </h3>
              <p className="mt-3 text-[#344e41] dark:text-[#b8d4e8]">
                From capstone-ready graduates to experienced developers, find the right match, faster.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={highlightTopGetStarted}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#2a4a6f] text-[#102a1b] dark:text-white font-semibold hover:bg-white/90 dark:hover:bg-[#1e3a5f] transition-colors"
              >
                Find Developers <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleJoinDeveloperClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold transition-colors"
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

function CategoryCard({ icon: Icon, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group shrink-0 w-[220px] sm:w-[280px] lg:w-[320px] text-left rounded-2xl bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] p-5 sm:p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-[#f5f5f2] dark:bg-[#1e3a5f] flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#588157] dark:text-[#3ba9d6]" />
      </div>
      <div className="mt-4">
        <div className="text-lg font-bold text-[#102a1b] dark:text-white">{title}</div>
        <div className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">Browse specialists -&gt;</div>
      </div>
    </button>
  );
}

function CategoryOrbitRow({ categories, onCategoryClick }) {
  const trackRef = useRef(null);
  const frameRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const scrollPositionRef = useRef(0);
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
  const loopedCategories = useMemo(() => [...categories, ...categories, ...categories], [categories]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const syncLoopPosition = () => {
      const segmentWidth = track.scrollWidth / 3;
      if (segmentWidth <= 0) return;

      if (scrollPositionRef.current === 0) {
        scrollPositionRef.current = segmentWidth;
        track.scrollLeft = segmentWidth;
        return;
      }

      if (scrollPositionRef.current >= segmentWidth * 2) {
        scrollPositionRef.current -= segmentWidth;
      } else if (scrollPositionRef.current <= 0) {
        scrollPositionRef.current += segmentWidth;
      }

      track.scrollLeft = scrollPositionRef.current;
    };

    syncLoopPosition();
    const initFrame = window.requestAnimationFrame(syncLoopPosition);

    const tick = (timestamp) => {
      const currentTrack = trackRef.current;
      if (!currentTrack) return;

      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (!dragStateRef.current.active) {
        scrollPositionRef.current -= (scrollSpeedRef.current * delta) / 1000;
      }

      syncLoopPosition();

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      lastTimestampRef.current = 0;
      window.cancelAnimationFrame(initFrame);
      window.cancelAnimationFrame(frameRef.current);
    };
  }, [loopedCategories]);

  const handlePointerDown = (event) => {
    const track = trackRef.current;
    if (!track) return;

    dragStateRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: scrollPositionRef.current || track.scrollLeft,
    };
    setIsInteracting(true);
    lastTimestampRef.current = 0;
    track.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const dragState = dragStateRef.current;
    const track = trackRef.current;
    if (!track || !dragState.active) return;

    const deltaX = event.clientX - dragState.startX;
    if (Math.abs(deltaX) > 4 && !dragState.moved) {
      dragStateRef.current.moved = true;
      suppressClickRef.current = true;
    }

    scrollPositionRef.current = dragState.startScrollLeft - deltaX;
    track.scrollLeft = scrollPositionRef.current;
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

  const handlePointerUp = (event) => {
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
    <div className="relative overflow-hidden px-0 pt-4 pb-1 sm:px-2 sm:pt-5 sm:pb-2">
      <div
        ref={trackRef}
        className={`orbit-scroll orbit-fade relative mx-auto flex items-center gap-5 overflow-x-auto py-5 sm:py-6 w-full select-none touch-pan-x ${
          isInteracting ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {loopedCategories.map((cat, index) => (
          <div key={`${cat.title}-${index}`} className="shrink-0">
            <CategoryCard icon={cat.icon} title={cat.title} onClick={handleCategoryClick} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCard({ step, title, description, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-[#f5f5f2] dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-[#588157] dark:text-[#3ba9d6]">{step}</p>
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0f2139] border border-[#a3b18a] dark:border-[#2a4a6f] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
        </div>
      </div>
      <h4 className="mt-4 text-lg font-bold text-[#102a1b] dark:text-white">{title}</h4>
      <p className="mt-2 text-sm text-[#344e41] dark:text-[#b8d4e8] leading-relaxed">{description}</p>
    </div>
  );
}



