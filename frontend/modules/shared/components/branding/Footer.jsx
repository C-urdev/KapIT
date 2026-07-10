import React from 'react';
import Link from '../../../../components/shared/Link';
import SocialLinksGroup from './SocialLinksGroup';

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

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-black/5 bg-[#FDFBF7] pt-20 pb-28 dark:border-white/8 dark:bg-[#181a1b] lg:pt-24 lg:pb-32">
      <div className="landing-desktop-shell relative z-10">
        
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Brand & Left Column */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <Link href="/" className="text-3xl font-bold tracking-tight text-[#111] dark:text-white" style={{ fontFamily: 'var(--font-desktop)' }}>
              KapIT
            </Link>
            <p className="mt-5 max-w-sm text-[1.05rem] leading-relaxed text-[#555] dark:text-[#a1a1aa]">
              Built for focused hiring in Philippine tech. A minimalist, high-end platform connecting talent with opportunity.
            </p>
            <div className="mt-9 flex flex-col gap-4">
              <a
                href="mailto:support@kapit.online"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-[#d7e4d6] bg-[#edf3ea] text-[#2e5038] hover:border-[#b9cfb6] hover:bg-[#e3eddf] dark:border-[#36453b] dark:bg-[#172019] dark:text-[#d0e4d1] dark:hover:bg-[#203025] text-sm font-semibold transition-colors"
              >
                Contact Support
              </a>
              <SocialLinksGroup />
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12 lg:gap-8">
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-[#111] dark:text-white">
                  {group.title}
                </h3>
                <ul className="space-y-3.5">
                  {group.links.map((link) => {
                    const isExternal = /^https?:\/\//.test(link.href) || link.href.startsWith('mailto:');
                    const className = "text-[1.05rem] text-[#555] dark:text-[#a1a1aa] hover:text-[#111] dark:hover:text-white transition-colors duration-200";
                    
                    return (
                      <li key={link.label}>
                        {isExternal ? (
                          <a href={link.href} className={className} target="_blank" rel="noopener noreferrer nofollow">
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href} className={className}>
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-20 flex flex-col items-start justify-between gap-4 border-t border-black/5 pt-6 dark:border-white/5 sm:flex-row sm:items-center lg:mt-24">
          <p className="text-sm text-[#787774] dark:text-[#a1a1aa]">
            &copy; {new Date().getFullYear()} KapIT, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-[#787774] dark:text-[#a1a1aa]">
            <Link href="/privacy-policy" className="hover:text-[#111] dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-[#111] dark:hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>

      {/* Giant Background Text */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[clamp(8rem,18vw,14rem)] overflow-hidden" aria-hidden="true">
        <div className="absolute bottom-[-2rem] left-1/2 flex w-full -translate-x-1/2 items-center justify-center sm:bottom-[-3rem]">
          <p className="whitespace-nowrap text-[clamp(4.9rem,17vw,18rem)] font-black leading-[0.88] tracking-[-0.04em] text-[#3a5a40]/[0.08] dark:text-[#a3b18a]/[0.05]">
            KapIT
          </p>
        </div>
      </div>
    </footer>
  );
}

