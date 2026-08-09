import { ArrowRight, BadgeCheck, BriefcaseBusiness, ClipboardCheck, ListChecks, MessageCircle, Search, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Footer from '../../../shared/components/branding/Footer';
import ScrollRevealSection from '../../../shared/components/effects/ScrollRevealSection';
import EmployerProductPreview from '../../../shared/pages/employers/EmployerProductPreview';
import LandingFaqList from '../../../shared/pages/landing/LandingFaqList';
import { EMPLOYER_CAPABILITIES, EMPLOYER_FAQ, EMPLOYER_PAGE_META, EMPLOYER_PROOF_SIGNALS, EMPLOYER_REVIEWS, EMPLOYER_WORKFLOW } from '../../../shared/pages/employers/employerLandingData';
import EmployerMobileNav from '../../components/navigation/EmployerMobileNav';

const CAPABILITY_ICONS = [Search, BriefcaseBusiness, ClipboardCheck, BadgeCheck, ListChecks, MessageCircle];

export default function EmployerLandingPage({ onCreateAccount, onSignIn }) {
  const pageUrl = typeof window === 'undefined' ? 'https://kapit.online/for-employers' : `${window.location.origin}/for-employers`;

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f7faf5] text-[#173225] antialiased dark:bg-[#121416] dark:text-white">
      <Helmet>
        <title>{EMPLOYER_PAGE_META.title}</title>
        <meta name="description" content={EMPLOYER_PAGE_META.description} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={EMPLOYER_PAGE_META.title} />
        <meta property="og:description" content={EMPLOYER_PAGE_META.description} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
      </Helmet>

      <EmployerMobileNav onCreateAccount={onCreateAccount} onSignIn={onSignIn} />

      <main>
        <ScrollRevealSection as="section" startVisible className="relative overflow-hidden px-5 pb-16 pt-28">
          <div className="pointer-events-none absolute inset-x-[-35%] top-0 h-[28rem] rounded-full bg-[#7fab82]/15 blur-3xl dark:bg-[#7fab82]/10" />
          <div className="relative">
            <p data-landing-reveal className="text-sm font-semibold text-[#58705a] dark:text-[#a8b7ac]">Employer workspace for Philippine tech hiring</p>
            <h1 data-landing-reveal style={{ '--landing-part-delay': '100ms' }} className="mt-5 max-w-[10ch] text-[3.35rem] font-bold leading-[0.96] tracking-[-0.06em] text-[#102a1b] dark:text-white">
              Find stronger-fit Filipino IT talent.
            </h1>
            <p data-landing-reveal style={{ '--landing-part-delay': '220ms' }} className="mt-6 max-w-[34rem] text-[1.05rem] leading-7 text-[#4b6251] dark:text-[#c6d0c9]">
              Search focused developer profiles, compare role fit, and manage every hiring step in one workspace.
            </p>
            <div data-landing-reveal style={{ '--landing-part-delay': '340ms' }} className="mt-8 grid gap-3">
              <button type="button" onClick={onCreateAccount} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#31572c] px-6 font-semibold text-white shadow-[0_14px_30px_rgba(49,87,44,0.22)] active:scale-[0.98] dark:bg-[#8db692] dark:text-[#102115]">
                Create company account <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
            <div data-landing-reveal style={{ '--landing-part-delay': '460ms' }} className="mt-9">
              <EmployerProductPreview compact onExplore={onCreateAccount} />
            </div>
          </div>
        </ScrollRevealSection>

        <ScrollRevealSection as="section" aria-label="Employer platform signals" className="border-y border-[#dce5d9] bg-[#fbfdf9] px-5 py-10 dark:border-white/8 dark:bg-[#15191b]">
          <p data-landing-reveal className="text-sm font-semibold text-[#516854] dark:text-[#b9c5bd]">Built around focused hiring signals</p>
          <div className="mt-5 grid gap-3">
            {EMPLOYER_PROOF_SIGNALS.map((signal, index) => (
              <div key={signal} data-landing-reveal style={{ '--landing-part-delay': `${120 + index * 80}ms` }} className="flex min-h-14 items-center justify-center rounded-xl border border-[#b9cbb5] bg-[#f4f8f1] px-4 text-center text-xs font-semibold text-[#526854] dark:border-white/15 dark:bg-white/[0.025] dark:text-[#b9c5bd]">
                {signal}
              </div>
            ))}
          </div>
        </ScrollRevealSection>

        <ScrollRevealSection as="section" id="why-kapit" className="scroll-mt-24 bg-[#fbfdf9] px-5 py-20 dark:bg-[#15191b]">
          <h2 data-landing-reveal className="max-w-[11ch] text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">Technical hiring needs a narrower signal.</h2>
          <p data-landing-reveal style={{ '--landing-part-delay': '100ms' }} className="mt-5 text-base leading-7 text-[#526858] dark:text-[#bdc8c0]">KapIT keeps profiles, roles, and review tools centered on Philippine IT work.</p>
          <div className="mt-10 border-t border-[#d5e1d1] dark:border-white/10">
            {['See skills and portfolio context together.', 'Compare applicants against the role.', 'Keep decisions and conversations connected.'].map((item, index) => (
              <div key={item} data-landing-reveal style={{ '--landing-part-delay': `${200 + index * 100}ms` }} className="grid grid-cols-[2.25rem_1fr] gap-4 border-b border-[#dce5d9] py-6 dark:border-white/8">
                <span className="font-mono text-xs font-semibold text-[#789079] dark:text-[#91a496]">0{index + 1}</span>
                <p className="text-lg font-semibold leading-snug tracking-[-0.025em]">{item}</p>
              </div>
            ))}
          </div>
        </ScrollRevealSection>

        <ScrollRevealSection as="section" id="how-it-works" className="scroll-mt-24 bg-[#edf4ea] px-5 py-20 dark:bg-[#171d19]">
          <h2 data-landing-reveal className="max-w-[10ch] text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">From open role to clear next step.</h2>
          <div className="mt-10 space-y-5">
            {EMPLOYER_WORKFLOW.map((step, index) => (
              <article key={step.title} data-landing-reveal style={{ '--landing-part-delay': `${140 + index * 110}ms` }} className="rounded-[1.5rem] border border-[#ceddca] bg-[#f8fbf5] p-6 dark:border-white/10 dark:bg-[#121614]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#31572c] text-sm font-bold text-white dark:bg-[#8db692] dark:text-[#102115]">{index + 1}</span>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.025em]">{step.title}</h3>
                <p className="mt-2 leading-7 text-[#536b58] dark:text-[#bdc8c0]">{step.description}</p>
              </article>
            ))}
          </div>
        </ScrollRevealSection>

        <ScrollRevealSection as="section" id="hiring-tools" className="scroll-mt-24 bg-[#f7faf5] py-20 dark:bg-[#121416]">
          <div className="px-5">
            <h2 data-landing-reveal className="max-w-[10ch] text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">One focused hiring workspace.</h2>
            <p data-landing-reveal style={{ '--landing-part-delay': '100ms' }} className="mt-5 leading-7 text-[#536b58] dark:text-[#bdc8c0]">Candidate context stays connected across the full hiring journey.</p>
          </div>
          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {EMPLOYER_CAPABILITIES.map((capability, index) => {
              const Icon = CAPABILITY_ICONS[index];
              return (
                <article key={capability.title} data-landing-reveal style={{ '--landing-part-delay': `${180 + index * 70}ms` }} className="min-h-[15rem] min-w-[82vw] snap-center rounded-[1.75rem] border border-[#d4e1d0] bg-[#fbfdf9] p-7 shadow-[0_16px_40px_rgba(34,62,45,0.07)] dark:border-white/8 dark:bg-[#171b1d]">
                  <Icon className="h-7 w-7 text-[#527656] dark:text-[#91ba96]" />
                  <h3 className="mt-10 text-2xl font-semibold tracking-[-0.035em]">{capability.title}</h3>
                  <p className="mt-3 leading-7 text-[#596d5d] dark:text-[#b9c5bd]">{capability.description}</p>
                </article>
              );
            })}
          </div>
        </ScrollRevealSection>

        <ScrollRevealSection as="section" aria-label="Employer reviews" className="bg-[#edf4ea] px-5 py-20 dark:bg-[#171d19]">
          <h2 data-landing-reveal className="max-w-[11ch] text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">Employers keep the hiring signal close.</h2>
          <p data-landing-reveal style={{ '--landing-part-delay': '100ms' }} className="mt-5 leading-7 text-[#536b58] dark:text-[#bdc8c0]">KapIT gives company teams a quieter way to review Filipino IT talent: role context, profile details, and outreach decisions stay together.</p>
          <div data-landing-reveal style={{ '--landing-part-delay': '180ms' }} className="mt-8 grid gap-3">
            {[
              ['Focused pool', 'Philippine IT talent only'],
              ['Role-fit review', 'Skills matched to opening'],
              ['One workspace', 'Profiles, notes, outreach'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-[#cbdcc7] bg-[#f8fbf5] px-5 py-4 shadow-[0_10px_28px_rgba(34,62,45,0.045)] dark:border-white/10 dark:bg-[#121614]">
                <p className="text-sm font-semibold text-[#31572c] dark:text-[#a8c9ac]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#647765] dark:text-[#aab8af]">{detail}</p>
              </div>
            ))}
          </div>
          <article data-landing-reveal style={{ '--landing-part-delay': '260ms' }} className="mt-6 flex min-h-[26rem] flex-col overflow-hidden rounded-[1.75rem] border border-[#c8dac3] bg-[#fbfdf9] p-6 shadow-[0_20px_56px_rgba(34,62,45,0.09)] dark:border-white/10 dark:bg-[#121614]">
            <div>
              <p className="text-[1.55rem] font-semibold leading-[1.14] tracking-[-0.04em] text-[#183622] dark:text-[#e8eeea]">"{EMPLOYER_REVIEWS[0].quote}"</p>
            </div>
            <div className="mt-auto border-t border-[#dce5d9] pt-5 dark:border-white/8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#cbdcc7] bg-[#edf4ea] text-base font-bold text-[#31572c] dark:border-white/10 dark:bg-white/8 dark:text-[#a8c9ac]">MS</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#102a1b] dark:text-white">{EMPLOYER_REVIEWS[0].name}</p>
                    <p className="mt-1 text-sm leading-6 text-[#647765] dark:text-[#aab8af]">{EMPLOYER_REVIEWS[0].role}</p>
                  </div>
                </div>
                <div className="flex text-[#527656] dark:text-[#a8c9ac]" aria-label="Five star review">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          </article>
          <div className="mt-4 grid gap-4">
            {EMPLOYER_REVIEWS.slice(1).map((review, index) => (
              <article key={review.name} data-landing-reveal style={{ '--landing-part-delay': `${340 + index * 90}ms` }} className="flex min-h-[18rem] flex-col rounded-[1.35rem] border border-[#d0dec9] bg-[#f7fbf4] p-5 shadow-[0_14px_36px_rgba(34,62,45,0.06)] dark:border-white/8 dark:bg-[#151a17]">
                <div>
                  <p className="text-lg font-semibold leading-snug tracking-[-0.025em] text-[#25432b] dark:text-[#e8eeea]">"{review.quote}"</p>
                </div>
                <div className="mt-auto border-t border-[#dce5d9] pt-4 dark:border-white/8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#cbdcc7] bg-[#edf4ea] text-sm font-bold text-[#31572c] dark:border-white/10 dark:bg-white/8 dark:text-[#a8c9ac]">{review.name.split(' ').map((part) => part[0]).join('')}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#102a1b] dark:text-white">{review.name}</p>
                        <p className="mt-1 text-xs leading-5 text-[#647765] dark:text-[#aab8af]">{review.role}</p>
                      </div>
                    </div>
                    <div className="flex text-[#527656] dark:text-[#a8c9ac]" aria-label="Five star review">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className="h-3 w-3 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </ScrollRevealSection>

        <ScrollRevealSection as="section" className="bg-[#fbfdf9] px-5 py-20 dark:bg-[#15191b]">
          <h2 data-landing-reveal className="text-[2.35rem] font-bold tracking-[-0.05em] text-[#102a1b] dark:text-white">Before your team starts hiring</h2>
          <div className="mt-6">
            <LandingFaqList items={EMPLOYER_FAQ} idPrefix="employer-landing-faq" />
          </div>
        </ScrollRevealSection>

        <ScrollRevealSection as="section" className="bg-[#edf4ea] px-5 py-20 dark:bg-[#171d19]">
          <div data-landing-reveal className="rounded-[2rem] border border-[#ceddca] bg-[#f9fcf7] px-6 py-12 text-center dark:border-white/10 dark:bg-[#121614]">
            <h2 data-landing-reveal style={{ '--landing-part-delay': '90ms' }} className="text-[2.45rem] font-bold leading-[1.03] tracking-[-0.055em] text-[#102a1b] dark:text-white">Build a clearer path to your next IT hire.</h2>
            <p data-landing-reveal style={{ '--landing-part-delay': '180ms' }} className="mt-5 leading-7 text-[#536b58] dark:text-[#bdc8c0]">Create your employer workspace and start with the hiring task your team needs now.</p>
            <button data-landing-reveal style={{ '--landing-part-delay': '280ms' }} type="button" onClick={onCreateAccount} className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#31572c] px-6 font-semibold text-white active:scale-[0.98] dark:bg-[#8db692] dark:text-[#102115]">
              Create company account <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </ScrollRevealSection>
      </main>

      <Footer />
    </div>
  );
}
