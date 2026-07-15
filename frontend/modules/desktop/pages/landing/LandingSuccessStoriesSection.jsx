import React from 'react';
import { Star } from 'lucide-react';

const EMPLOYER_WORDMARKS = [
  { label: 'SM', className: 'text-[1.95rem] tracking-[-0.04em]' },
  { label: 'Accenture', className: 'text-[1.75rem] tracking-[-0.03em]' },
  { label: 'Ayala', className: 'text-[1.95rem] tracking-[0.04em]' },
  { label: 'STI Colleges', className: 'text-[1.55rem] tracking-[-0.02em]' },
  { label: 'BDO Unibank', className: 'text-[1.65rem] tracking-[-0.03em]' },
  { label: 'PLDT', className: 'text-[1.9rem] tracking-[0.08em]' },
  { label: 'Philippine Airlines', className: 'text-[1.45rem] tracking-[-0.02em]' },
];

const REVIEWS = [
  {
    id: 'celine',
    name: 'Celine Navarro',
    role: 'Frontend developer',
    rating: 4.1,
    image:
      'https://randomuser.me/api/portraits/women/68.jpg',
    quote:
      'KapIT feels more focused than generic job sites. My profile, resume, and applications are all in one place, so applying feels much less scattered.',
  },
  {
    id: 'marco',
    name: 'Marco Villanueva',
    role: 'Engineering manager',
    rating: 4.6,
    image:
      'https://randomuser.me/api/portraits/men/32.jpg',
    quote:
      'The fit signals and cleaner candidate profiles made shortlisting easier on our side. We spend less time guessing and more time reviewing relevant people.',
  },
  {
    id: 'danica',
    name: 'Danica Reyes',
    role: 'Product designer',
    rating: 4.3,
    image:
      'https://randomuser.me/api/portraits/women/52.jpg',
    quote:
      'I like that KapIT shows the practical parts of the search clearly. The resume flow, application tracking, and mobile access all feel simple to keep up with.',
  },
];

function RatingStars({ rating }) {
  const clampedRating = Math.max(0, Math.min(5, rating));

  return (
    <span className="inline-flex items-center gap-0.5 text-[#e4b54f]" aria-label={`${clampedRating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const fillAmount = Math.max(0, Math.min(1, clampedRating - index));

        return (
          <span key={`success-rating-star-${index}`} className="relative inline-flex h-4 w-4 shrink-0">
            <Star className="absolute inset-0 h-4 w-4 text-[#d8d1c3]" strokeWidth={1.65} aria-hidden="true" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillAmount * 100}%` }}>
              <Star className="h-4 w-4 fill-current text-[#e4b54f]" strokeWidth={1.65} aria-hidden="true" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default function LandingSuccessStoriesSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fdfbf7_0%,#fdfbf7_18%,#f6f1e8_30%,#ece4d7_50%,#e9e0d2_68%,#f8f5ee_100%)] dark:bg-[linear-gradient(180deg,#181a1b_0%,#181a1b_18%,#1a1d1d_32%,#181a1b_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(253,251,247,0.94)_22%,rgba(250,247,242,0.68)_48%,rgba(245,238,228,0.14)_82%,rgba(245,238,228,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(24,26,27,0.98)_0%,rgba(24,26,27,0.84)_24%,rgba(24,26,27,0.34)_58%,rgba(24,26,27,0)_100%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-0.75rem] h-32 w-[66%] -translate-x-1/2 rounded-[999px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.82)_0%,rgba(244,250,247,0.46)_40%,rgba(244,250,247,0)_76%)] blur-[22px] dark:bg-[radial-gradient(circle_at_center,rgba(239,247,243,0.14)_0%,rgba(84,123,111,0.08)_40%,rgba(84,123,111,0)_76%)]" />

      <div className="landing-desktop-shell relative py-[4.5rem] sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="mt-4 text-balance text-[1.85rem] font-semibold tracking-[-0.04em] text-[#151714] dark:text-white sm:text-[2.15rem]">
            Made for candidates aiming at serious roles in the Philippines
          </h3>
        </div>

        <div className="mx-auto mt-14 max-w-5xl text-center lg:mt-16">
          <p className="mx-auto max-w-2xl text-balance text-[1.08rem] font-medium tracking-[-0.02em] text-[#3b3a35] dark:text-[#d6dde3]">
            Built for applicants who want to stand out to leading employers across the Philippines
          </p>

          <div className="mx-auto mt-7 flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-5 text-[#8f897f] dark:text-[#c7ced6] sm:gap-x-10 lg:gap-x-12">
            {EMPLOYER_WORDMARKS.map((company) => (
              <span
                key={company.label}
                className={`select-none whitespace-nowrap font-semibold opacity-90 ${company.className}`}
              >
                {company.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-14 h-px max-w-6xl bg-[#d2ccbf] dark:bg-white/10" />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {REVIEWS.map((review, index) => (
            <article
              key={review.id}
              className={`group relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.58))] p-5 shadow-[0_18px_45px_rgba(63,46,24,0.06)] transition-[transform,box-shadow,background-color] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(63,46,24,0.1)] dark:bg-[linear-gradient(180deg,rgba(33,36,38,0.82),rgba(28,31,33,0.65))] dark:shadow-[0_20px_44px_rgba(0,0,0,0.18)] ${
                index === 1 ? 'lg:translate-y-8' : ''
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.58),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),rgba(255,255,255,0))]" />

              <div className="relative">
                <div className="flex items-center gap-4">
                  <img
                    src={review.image}
                    alt={`${review.name} sample reviewer portrait`}
                    className="h-14 w-14 rounded-[1.2rem] object-cover object-center shadow-[0_10px_24px_rgba(30,22,15,0.12)] ring-1 ring-black/5"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <RatingStars rating={review.rating} />
                      <span className="font-mono text-[0.76rem] font-semibold tracking-[0.16em] text-[#7e786f] dark:text-[#cfd6dc]">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-[1.08rem] font-semibold tracking-[-0.03em] text-[#171915] dark:text-white">
                      {review.name}
                    </p>
                    <p className="truncate text-[0.92rem] text-[#645f56] dark:text-[#c3ccd3]">{review.role}</p>
                  </div>
                </div>

                <p className="mt-6 text-pretty text-[1.06rem] leading-[1.9] text-[#1d1f1c] dark:text-[#edf1f3]">
                  "{review.quote}"
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
