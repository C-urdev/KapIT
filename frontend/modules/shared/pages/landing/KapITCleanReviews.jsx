import React, { useState } from 'react';
import { Star } from 'lucide-react';

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

const REVIEWS = [
  {
    id: 'mika',
    name: 'Mika R.',
    role: 'Hiring Lead',
    rating: 4.5,
    text: 'We started getting great applicants right away. The quality and fit were both impressive.',
    cardStyle: 'absolute left-[160px] top-[-30px] w-[276px]',
    anchorStyle: 'top-[227px] left-[81px]',
    line: { x1: 436, y1: 40, x2: 549, y2: 275 },
  },
  {
    id: 'paolo',
    name: 'Paolo S.',
    role: 'Product Manager',
    rating: 4.7,
    text: 'Shortlisting was easier than expected. We found strong matches without extra back-and-forth.',
    cardStyle: 'absolute left-[150px] top-[430px] w-[276px]',
    anchorStyle: 'top-[312px] left-[122px]',
    line: { x1: 426, y1: 520, x2: 590, y2: 360 },
  },
  {
    id: 'janelle',
    name: 'Janelle P.',
    role: 'Startup Founder',
    rating: 4.1,
    text: 'The platform feels clean, fast, and very trustworthy. We loved the positive candidate flow.',
    cardStyle: 'absolute left-[760px] top-[220px] w-[276px] min-[1280px]:-translate-x-[60px] min-[1700px]:translate-x-0',
    anchorStyle: 'top-[227px] left-[202px]',
    line: { x1: 780, y1: 300, x2: 670, y2: 275 },
    responsiveLine: {
      className: 'hidden min-[1280px]:block min-[1700px]:hidden',
      x1: 720,
      y1: 300,
      x2: 670,
      y2: 275,
    },
  },
];

const renderReviewBody = (review) => (
  <div className="hero-review-panel">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#102a1b] dark:text-white">{review.name}</p>
        <p className="truncate text-xs font-medium text-[#5f6f67] dark:text-[#cbd5e1]">{review.role}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-[#f0c766]">
        {renderRatingStars(review.rating)}
        <span className="text-[0.72rem] font-semibold tracking-[0.16em] text-[#5f755f] dark:text-[#c9d7cb]">
          {review.rating.toFixed(1)}
        </span>
      </div>
    </div>
    <p className="mt-3 text-[0.95rem] leading-[1.65] text-[#24412d] dark:text-[#e7efe5]">
      "{review.text}"
    </p>
  </div>
);

export default function KapITCleanReviews({ children }) {
  const [activeHover, setActiveHover] = useState(null);

  return (
    <>
      <div className="relative hidden w-full items-center justify-center overflow-visible bg-transparent py-5 lg:flex xl:py-6">
        <div className="relative h-[620px] w-[1100px] flex items-center justify-center">
          <div className="hero-review-orbit absolute left-0 top-0 h-[620px] w-[1100px] z-20">
            <div className="relative h-full w-full min-[1100px]:-translate-x-[92px] min-[1280px]:translate-x-0">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" xmlns="http://www.w3.org/2000/svg">
                {REVIEWS.map((review) => (
                  <React.Fragment key={`line-${review.id}`}>
                    <line
                      x1={review.line.x1}
                      y1={review.line.y1}
                      x2={review.line.x2}
                      y2={review.line.y2}
                      stroke="rgba(16, 185, 129, 0.5)"
                      strokeWidth="1.5"
                      className={`${review.responsiveLine ? 'min-[1280px]:hidden min-[1700px]:block' : ''} transition-all duration-500 ease-in-out ${
                        activeHover === review.id ? 'stroke-emerald-500/80 stroke-[2px] opacity-100' : 'opacity-70'
                      }`}
                    />
                    {review.responsiveLine ? (
                      <line
                        x1={review.responsiveLine.x1}
                        y1={review.responsiveLine.y1}
                        x2={review.responsiveLine.x2}
                        y2={review.responsiveLine.y2}
                        stroke="rgba(16, 185, 129, 0.5)"
                        strokeWidth="1.5"
                        className={`${review.responsiveLine.className} transition-all duration-500 ease-in-out ${
                          activeHover === review.id ? 'stroke-emerald-500/80 stroke-[2px] opacity-100' : 'opacity-70'
                        }`}
                      />
                    ) : null}
                  </React.Fragment>
                ))}
              </svg>

              <div className="absolute left-[460px] top-[40px] w-[260px] z-20 select-none pointer-events-auto">
                <div className="relative w-full h-full">
                  <div className="w-[314px] h-[622px] origin-top-left scale-[0.828]">
                    {children}
                  </div>

                  {REVIEWS.map((review) => (
                    <div
                      key={`anchor-${review.id}`}
                      className={`absolute ${review.anchorStyle} w-4 h-4 flex items-center justify-center cursor-pointer transition-all duration-300 opacity-100`}
                      onMouseEnter={() => setActiveHover(review.id)}
                      onMouseLeave={() => setActiveHover(null)}
                    >
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 animate-ping ${
                          activeHover === review.id ? 'opacity-75' : 'opacity-50'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 transition-all duration-300 ${
                          activeHover === review.id
                            ? 'bg-emerald-500 scale-150 shadow-[0_0_12px_#10b981]'
                            : 'bg-emerald-500/80'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {REVIEWS.map((review) => (
                <article
                  key={review.id}
                  onMouseEnter={() => setActiveHover(review.id)}
                  onMouseLeave={() => setActiveHover(null)}
                  className={`hero-review-card ${review.cardStyle} z-30 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer pointer-events-auto ${
                    activeHover === review.id
                      ? 'opacity-100 scale-[1.05] -translate-y-3 z-40 [filter:drop-shadow(0_24px_48px_rgba(0,0,0,0.12))]'
                      : 'opacity-100 scale-100 [filter:drop-shadow(0_8px_24px_rgba(0,0,0,0.04))]'
                  }`}
                >
                  {renderReviewBody(review)}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden relative w-full overflow-hidden px-3 py-10 sm:px-4">
        <div className="mx-auto max-w-[430px]">
          <div className="rounded-[2rem] border border-[#c8d5c4] bg-[linear-gradient(180deg,rgba(250,252,248,0.98),rgba(240,247,240,0.96))] p-4 shadow-[0_20px_50px_rgba(23,40,28,0.12)] dark:border-[#46505a] dark:bg-[linear-gradient(180deg,rgba(35,40,44,0.96),rgba(28,33,38,0.92))]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#588157] dark:text-[#f0c766]">Reviews</p>
                <h3 className="mt-1 text-2xl font-bold text-[#102a1b] dark:text-white">Phone preview</h3>
              </div>
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/35 animate-ping" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="shadow-[0_28px_50px_rgba(15,23,17,0.18)]">
                {children}
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {REVIEWS.map((review, index) => (
                <article
                  key={review.id}
                  className="rounded-[1.5rem] border border-[#a3b18a]/20 dark:border-white/5 bg-white/50 dark:bg-[#1a1d20]/50 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all duration-500 dark:border-[#46505a]"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <span className="relative mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/40 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#102a1b] dark:text-white">{review.name}</p>
                          <p className="truncate text-xs font-medium text-[#5f6f67] dark:text-[#cbd5e1]">{review.role}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 text-[#f0c766]">
                          {renderRatingStars(review.rating)}
                          <span className="text-[0.72rem] font-semibold tracking-[0.16em] text-[#5f755f] dark:text-[#c9d7cb]">
                            {review.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-[1.65] text-[#24412d] dark:text-[#e7efe5]">
                        "{review.text}"
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero-review-panel {
          position: relative;
          z-index: 1;
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid rgba(163, 177, 138, 0.2);
          background: rgba(255, 255, 255, 0.5);
          padding: 20px 20px 18px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: border-color 500ms ease-out, box-shadow 500ms ease-out;
        }
        .hero-review-panel:hover {
          border-color: rgba(88, 129, 87, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.78);
        }
        .dark .hero-review-panel {
          border-color: rgba(255, 255, 255, 0.05);
          background: rgba(26, 29, 32, 0.5);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .dark .hero-review-panel:hover {
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
      `}</style>
    </>
  );
}
