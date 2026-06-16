import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import Link from '../../../../components/shared/Link';
import SocialLinksGroup from './SocialLinksGroup';
import ThinSectionLine from '@sharedComponents/ui/ThinSectionLine';

const LINK_GROUPS = [
  {
    title: 'About',
    links: [
      { label: 'What is KapIT?', href: '/pricing' },
      { label: 'Careers', href: '/auth/register' },
      { label: 'Press', href: 'mailto:business@kapit.dev' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Create Profile', href: '/auth/register' },
      { label: 'Portfolios', href: '/auth/register' },
      { label: 'Projects', href: '/jobs' },
    ],
  },
  {
    title: 'Companies',
    links: [
      { label: 'Find Talent', href: '/auth/register' },
      { label: 'Post Projects', href: '/auth/register' },
      { label: 'Help Center', href: 'mailto:support@kapit.online' },
      { label: 'Safety', href: '/privacy-policy' },
    ],
  },
];

const FOOTER_INFO = {
  'What is KapIT?':
    'KapIT is a focused hiring marketplace that connects Filipino developers with companies through skill-based discovery and transparent opportunities.',
  Careers:
    'KapIT welcomes contributors in engineering, product, design, growth, and operations. Reach out through official channels to explore current or future openings.',
  Press:
    'For media requests, collaborations, and announcements, contact KapIT through the business email so the right team can respond quickly.',
  'Create Profile':
    'Build your developer profile with skills, projects, and experience so employers can match you to relevant roles faster.',
  Portfolios:
    'Showcase practical work, code, and outcomes. A strong portfolio improves visibility and gives employers better context when screening candidates.',
  Projects:
    'Discover project-based and full-time opportunities aligned to your stack, then apply using your profile and supporting details.',
  'Find Talent':
    'Companies can discover candidates with role-relevant skills using targeted search and profile signals for faster shortlisting.',
  'Post Projects':
    'Publish project requirements with clear scope, skills, and expectations so qualified developers can apply with better alignment.',
  Pricing:
    'KapIT offers flexible access for developers and companies. Plans are designed to support both early-stage hiring and growing teams.',
  'Help Center':
    'Get support for account setup, profile updates, applications, and hiring workflows through the KapIT support channel.',
  Safety:
    'KapIT prioritizes trustworthy listings, responsible data handling, and safer interactions between developers and hiring teams.',
};

export default function Footer() {
  const [selectedItem, setSelectedItem] = useState(null);
  const selectedInfo = useMemo(() => FOOTER_INFO[selectedItem] ?? '', [selectedItem]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleFooterInfoOpen = (event) => {
      const item = event?.detail?.item;
      if (!item || !FOOTER_INFO[item]) return;
      setSelectedItem(item);
      window.requestAnimationFrame(() => {
        document.getElementById('kapit-footer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    window.addEventListener('kapit:footer-info-open', handleFooterInfoOpen);
    return () => window.removeEventListener('kapit:footer-info-open', handleFooterInfoOpen);
  }, []);

  return (
    <footer
      id="kapit-footer"
      className="relative overflow-hidden border-t border-black/10 bg-[#f6f8f3] text-[#102a1b] dark:border-[#2f353c] dark:bg-[#121416] dark:text-[#d0d7dd]"
    >
      <ThinSectionLine className="top-0" />
      <div className="relative mx-auto w-full max-w-[min(100%,1700px)] px-6 sm:px-8 lg:px-10 xl:px-12 2xl:px-14 pt-14 sm:pt-16 lg:pt-20 pb-44 sm:pb-48 lg:pb-52">
        <div className="relative z-10 grid items-start gap-12 lg:grid-cols-[420px_1fr] lg:gap-20 xl:gap-24">
          <div>
            <div className="inline-flex items-center gap-3.5">
              <div>
                <p className="text-[2.1rem] font-black leading-none text-[#102a1b] dark:text-white">KapIT</p>
                <p className="mt-1 text-sm text-[#42634a] dark:text-[#d0d7dd]">Built for focused hiring in Philippine tech</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <a
                href="mailto:support@kapit.online"
                className="inline-flex min-h-[44px] items-center rounded-full bg-[#3a5a40] px-7 py-2.5 text-[1rem] font-semibold text-white transition hover:bg-[#344e41] dark:bg-[#6f9b74] dark:text-[#121416] dark:hover:bg-[#82ad86]"
              >
                Contact
              </a>
              <SocialLinksGroup />
            </div>

          </div>

          <nav
            aria-label="Footer"
            className="grid gap-6 sm:grid-cols-3 sm:gap-8 lg:gap-x-6 lg:pt-1 xl:gap-x-8"
            style={{ fontFamily: 'var(--font-desktop)' }}
          >
            {LINK_GROUPS.map((group) => (
              <section key={group.title} className="min-w-0" aria-label={group.title}>
                <h3 className="text-[1.02rem] font-semibold text-[#3a5a40] dark:text-white">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-2">
                  {group.links.map((link) => {
                    const sharedClassName = `inline-block text-[1.02rem] font-medium leading-8 transition-colors ${
                      selectedItem === link.label
                        ? 'text-[#102a1b] dark:text-white'
                        : 'text-[#3a5a40] hover:text-[#102a1b] dark:text-[#d0d7dd] dark:hover:text-white'
                    }`;
                    const hasInfoPanel = Boolean(FOOTER_INFO[link.label]);

                    if (link.href) {
                      const isExternal = /^https?:\/\//.test(link.href) || link.href.startsWith('mailto:');
                      return (
                        <li key={link.label}>
                          {isExternal ? (
                            <a href={link.href} className={sharedClassName} target="_blank" rel="noopener noreferrer nofollow">
                              {link.label}
                            </a>
                          ) : (
                            <Link href={link.href} className={sharedClassName}>
                              {link.label}
                            </Link>
                          )}
                        </li>
                      );
                    }

                    return (
                      <li key={link.label}>
                        <button
                          type="button"
                          onClick={() => setSelectedItem((current) => (current === link.label ? null : link.label))}
                          className={sharedClassName}
                          aria-pressed={selectedItem === link.label}
                          disabled={!hasInfoPanel}
                        >
                          {link.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </nav>
        </div>

        <div className="relative z-10 mt-12 flex flex-col gap-2 text-xs text-[#5f755f] dark:text-[#a7b0ba] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} KapIT, Inc. All rights reserved.</p>
          <p>Built for developers and teams hiring with confidence.</p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[clamp(11rem,24vw,19rem)] overflow-hidden" aria-hidden="true">
          <div className="absolute bottom-[-2.2rem] left-1/2 flex w-[min(100%,1700px)] -translate-x-1/2 items-center justify-center px-6 sm:px-10">
            <p className="whitespace-nowrap text-[clamp(6.3rem,18.2vw,15.6rem)] font-black leading-[0.88] tracking-[-0.02em] text-transparent [-webkit-text-stroke:2.8px_rgba(78,106,85,0.72)] dark:text-transparent dark:[-webkit-text-stroke:2px_rgba(43,51,61,0.65)]">
              KapIT
            </p>
          </div>
        </div>

        {selectedItem ? (
          <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[70] sm:inset-x-auto sm:right-24 sm:bottom-10">
            <div className="pointer-events-auto relative ml-auto w-full max-w-[680px] overflow-hidden rounded-2xl border border-[#8faa80] bg-[#f8f8f4]/82 px-5 py-5 shadow-[0_16px_36px_rgba(16,42,27,0.14)] ring-1 ring-[#dce8d5]/80 backdrop-blur-md backdrop-saturate-125 supports-[backdrop-filter]:bg-[#f8f8f4]/76 dark:border-[#7a8797] dark:bg-[#1a1d20]/74 dark:ring-[#8ea0b6]/35 dark:shadow-[0_18px_40px_rgba(0,0,0,0.42)] sm:px-6">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.1)_36%,rgba(255,255,255,0.03)_100%)] dark:bg-[linear-gradient(140deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_42%,rgba(255,255,255,0.01)_100%)]" aria-hidden="true" />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-[1.65rem] font-bold leading-tight text-[#102a1b] dark:text-white">{selectedItem}</h4>
                  <p className="mt-2 text-[1.04rem] leading-8 text-[#344e41] dark:text-[#d0d7dd]">{selectedInfo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="shrink-0 text-[#344e41] hover:text-[#102a1b] dark:text-[#d0d7dd] dark:hover:text-white"
                  aria-label="Close footer info"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </footer>
  );
}
