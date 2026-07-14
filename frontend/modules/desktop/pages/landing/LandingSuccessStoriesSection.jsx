import React from 'react';
import { Star } from 'lucide-react';

const BRAND_WORDMARKS = [
  { label: 'airbnb', className: 'text-[2.15rem] tracking-[-0.05em]' },
  { label: 'Meta', className: 'text-[2.3rem] tracking-[-0.08em]' },
  { label: 'Tesla', className: 'text-[2rem] tracking-[0.18em] uppercase' },
  { label: 'SpaceX', className: 'text-[1.75rem] tracking-[0.2em]' },
  { label: 'Google', className: 'text-[2.45rem] tracking-[-0.06em]' },
  { label: 'Apple', className: 'text-[2.4rem] tracking-[-0.05em]' },
];

const REVIEWS = [
  {
    id: 'mika',
    rating: 4.5,
    quote:
      'We started getting great applicants right away. The quality and fit were both impressive.',
    name: 'Mika R.',
    role: 'Hiring Lead',
    avatar: 'MR',
    avatarClassName: 'from-[#d9e6d4] to-[#f3ede2]',
  },
  {
    id: 'paolo',
    rating: 4.7,
    quote:
      'Shortlisting was easier than expected. We found strong matches without extra back-and-forth.',
    name: 'Paolo S.',
    role: 'Product Manager',
    avatar: 'PS',
    avatarClassName: 'from-[#dce7ef] to-[#f2ebe2]',
  },
  {
    id: 'janelle',
    rating: 4.1,
    quote:
      'The platform feels clean, fast, and very trustworthy. We loved the positive candidate flow.',
    name: 'Janelle P.',
    role: 'Startup Founder',
    avatar: 'JP',
    avatarClassName: 'from-[#ead7cb] to-[#f4eee8]',
  },
];

const renderRatingStars = (rating) => {
  const clampedRating = Math.max(0, Math.min(5, rating));

  return (
    <span className="inline-flex items-center gap-0.5 text-[#f0c766]" aria-label={`${clampedRating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const fillAmount = Math.max(0, Math.min(1, clampedRating - index));
        return (
          <span key={`success-rating-star-${index}`} className="relative inline-flex h-4 w-4 shrink-0">
            <Star className="absolute inset-0 h-4 w-4 text-[#ddd6c8]" strokeWidth={1.6} aria-hidden="true" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillAmount * 100}%` }}>
              <Star className="h-4 w-4 fill-current text-[#f0c766]" strokeWidth={1.6} aria-hidden="true" />
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default function LandingSuccessStoriesSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#e5ddcf] via-[#ece4d7] to-[#f8f5ee] dark:bg-[#181a1b]">
      <div className="landing-desktop-shell relative py-14 sm:py-18 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[1.65rem] font-semibold tracking-[-0.03em] text-[#151714] dark:text-white sm:text-[1.85rem]">
            Helped thousands of users land jobs at top companies
          </p>
          <p className="mt-3 text-[1.02rem] leading-relaxed text-[#5f5b53] dark:text-[#cbd5e1]">
            From new grads to senior executives
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-5xl flex-wrap items-center justify-center gap-x-10 gap-y-6 text-[#8a8781] dark:text-[#c7ced6] sm:gap-x-12 lg:mt-14 lg:flex-nowrap lg:gap-x-14">
          {BRAND_WORDMARKS.map((brand) => (
            <span
              key={brand.label}
              className={`select-none whitespace-nowrap font-semibold opacity-95 ${brand.className}`}
            >
              {brand.label}
            </span>
          ))}
        </div>

        <div className="mx-auto mt-12 h-px max-w-6xl bg-[#d2ccbf] dark:bg-white/10" />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {REVIEWS.map((review) => (
            <article
              key={review.id}
              className="flex h-full min-h-[19.75rem] flex-col rounded-[1.45rem] border border-[#dbd4c8] bg-white/95 p-6 shadow-[0_10px_28px_rgba(44,34,19,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(44,34,19,0.08)] dark:border-white/10 dark:bg-[#202224]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[1.02rem] font-semibold text-[#161815] dark:text-white">{review.name}</p>
                  <p className="truncate text-sm text-[#6a655c] dark:text-[#cbd5e1]">{review.role}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {renderRatingStars(review.rating)}
                  <span className="text-[0.78rem] font-semibold tracking-[0.14em] text-[#6f715f] dark:text-[#d3d8df]">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              <p className="mt-6 text-[1.05rem] leading-[1.8] text-[#161815] dark:text-[#f3f4f6]">
                "{review.quote}"
              </p>

              <div className="mt-auto flex items-end justify-between gap-4 pt-8">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${review.avatarClassName} text-sm font-semibold text-[#23211d] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:text-white`}
                  >
                    {review.avatar}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[1.02rem] font-semibold text-[#161815] dark:text-white">{review.name}</p>
                    <p className="truncate text-sm text-[#6a655c] dark:text-[#cbd5e1]">{review.role}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right text-[0.82rem] font-medium uppercase tracking-[0.16em] text-[#9d978f] dark:text-[#a6adb5]">
                  KapIT Review
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
