import React from 'react';
import KapITLogo from './KapITLogo';

export const SOCIAL_LINKS = [
  { name: 'Email', href: 'mailto:support@kapit.online', icon: EmailIcon },
  { name: 'Product Hunt', href: 'https://www.producthunt.com/@kapitph', icon: ProductHuntIcon },
  { name: 'X', href: 'https://x.com/kapitjobsph', icon: XLogoIcon },
  { name: 'Facebook', href: 'https://www.facebook.com/kapitjobsph', icon: FacebookIcon },
];

const BASE_ITEM_CLASS =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e4d6] bg-[#edf3ea] text-[#2e5038] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-[#b9cfb6] hover:bg-[#e3eddf] hover:text-[#102a1b] hover:scale-105 dark:border-[#36453b] dark:bg-[#172019] dark:text-[#d0e4d1] dark:hover:bg-[#203025] dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#588157]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

const FLIP_CARD_CLASS =
  'group relative inline-flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5f7f67]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

const FLIP_FACE_CLASS =
  'absolute inset-0 inline-flex items-center justify-center rounded-full border border-[#8ea98f] bg-[#edf3ea] text-[#2e5038] shadow-[0_7px_16px_rgba(16,42,27,0.12)] dark:border-[#444d57] dark:bg-[#1a1d20] dark:text-[#d0d7dd]';

export default function SocialLinksGroup({
  className = '',
  itemClassName = '',
  iconClassName = 'h-[18px] w-[18px]',
  direction = 'row',
  gapClassName = 'gap-2.5',
  ariaLabel = 'KapIT social links',
  interaction = 'default',
  flipFaceClassName = '',
}) {
  const useFlipInteraction = interaction === 'flip';
  const directionClassName = direction === 'column' ? 'flex-col' : 'flex-row';
  return (
    <nav aria-label={ariaLabel} className={`flex ${directionClassName} items-center ${gapClassName} ${className}`.trim()}>
      {SOCIAL_LINKS.map(({ name, href, icon: Icon }) => {
        const isHttpLink = /^https?:\/\//.test(href);

        if (useFlipInteraction) {
          return (
            <a
              key={name}
              href={href}
              target={isHttpLink ? '_blank' : undefined}
              rel={isHttpLink ? 'noopener noreferrer nofollow' : undefined}
              className={`${FLIP_CARD_CLASS} social-flip-card ${itemClassName}`.trim()}
              aria-label={`Open KapIT on ${name}`}
              title={name}
            >
              <span className="social-flip-inner relative h-full w-full">
                <span className={`${FLIP_FACE_CLASS} social-flip-face-front ${flipFaceClassName}`.trim()} aria-hidden="true">
                  <Icon className={iconClassName} />
                </span>
                <span className={`${FLIP_FACE_CLASS} social-flip-face-back ${flipFaceClassName}`.trim()} aria-hidden="true">
                  <KapITLogo className="h-[18px] w-[18px] rounded-sm object-contain" alt="" />
                </span>
              </span>
            </a>
          );
        }

        return (
          <a
            key={name}
            href={href}
            target={isHttpLink ? '_blank' : undefined}
            rel={isHttpLink ? 'noopener noreferrer nofollow' : undefined}
            className={`${BASE_ITEM_CLASS} ${itemClassName}`.trim()}
            aria-label={`Open KapIT on ${name}`}
            title={name}
          >
            <Icon className={iconClassName} />
          </a>
        );
      })}
      {useFlipInteraction ? (
        <style jsx>{`
          .social-flip-card {
            perspective: 900px;
          }
          .social-flip-inner {
            transform-style: preserve-3d;
            transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: transform;
          }
          .social-flip-face-back {
            transform: rotateY(180deg);
          }
          .social-flip-face-back,
          .social-flip-face-front {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
          @media (hover: hover) and (pointer: fine) {
            .social-flip-card:hover .social-flip-inner {
              transform: rotateY(180deg);
            }
          }
          .social-flip-card:focus-visible .social-flip-inner {
            transform: rotateY(180deg);
          }
        `}</style>
      ) : null}
    </nav>
  );
}

function ProductHuntIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8h3.2a2.8 2.8 0 0 1 0 5.6H10z" />
      <path d="M10 13.6V17" />
    </svg>
  );
}

function EmailIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

function XLogoIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.8 4H20l-4.8 5.5L21 20h-4.9l-3.8-4.9L7.9 20H5.7l5.2-6-5.6-10h5l3.4 4.5L17.8 4Zm-1.7 14.4h1.4L9.1 5.5H7.6l8.5 12.9Z" />
    </svg>
  );
}

function FacebookIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M13.5 20v-6h2l.3-2.4h-2.3V10c0-.7.2-1.2 1.2-1.2h1.3V6.6c-.2 0-1-.1-1.8-.1-1.8 0-3.1 1.1-3.1 3.2v1.8H9v2.4h2.2v6h2.3Z" />
    </svg>
  );
}
