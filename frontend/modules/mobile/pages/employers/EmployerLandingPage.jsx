import { ArrowRight, BadgeCheck, BriefcaseBusiness, ClipboardCheck, ListChecks, MessageCircle, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Link from '../../../../components/shared/Link';
import Footer from '../../../shared/components/branding/Footer';
import EmployerProductPreview from '../../../shared/pages/employers/EmployerProductPreview';
import { EMPLOYER_CAPABILITIES, EMPLOYER_FAQ, EMPLOYER_PAGE_META, EMPLOYER_PROOF_PLACEHOLDERS, EMPLOYER_WORKFLOW } from '../../../shared/pages/employers/employerLandingData';
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
        <section className="relative overflow-hidden px-5 pb-16 pt-28">
          <div className="pointer-events-none absolute inset-x-[-35%] top-0 h-[28rem] rounded-full bg-[#7fab82]/15 blur-3xl dark:bg-[#7fab82]/10" />
          <div className="relative">
            <p className="text-sm font-semibold text-[#58705a] dark:text-[#a8b7ac]">Employer workspace for Philippine tech hiring</p>
            <h1 className="mt-5 max-w-[10ch] text-[3.35rem] font-bold leading-[0.96] tracking-[-0.06em] text-[#102a1b] dark:text-white">
              Find stronger-fit Filipino IT talent.
            </h1>
            <p className="mt-6 max-w-[34rem] text-[1.05rem] leading-7 text-[#4b6251] dark:text-[#c6d0c9]">
              Search focused developer profiles, compare role fit, and manage every hiring step in one workspace.
            </p>
            <div className="mt-8 grid gap-3">
              <button type="button" onClick={onCreateAccount} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#31572c] px-6 font-semibold text-white shadow-[0_14px_30px_rgba(49,87,44,0.22)] active:scale-[0.98] dark:bg-[#8db692] dark:text-[#102115]">
                Create company account <ArrowRight className="h-4.5 w-4.5" />
              </button>
              <button type="button" onClick={onSignIn} className="min-h-[52px] rounded-full border border-[#c7d7c3] bg-white/75 px-6 font-semibold text-[#173225] active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white">
                Sign in
              </button>
            </div>
            <div className="mt-9">
              <EmployerProductPreview compact onExplore={onCreateAccount} />
            </div>
          </div>
        </section>

        <section aria-label="Employer social proof placeholders" className="border-y border-[#dce5d9] bg-[#fbfdf9] px-5 py-10 dark:border-white/8 dark:bg-[#15191b]">
          <p className="text-sm font-semibold text-[#516854] dark:text-[#b9c5bd]">Reserved for verified employer proof</p>
          <div className="mt-5 grid gap-3">
            {EMPLOYER_PROOF_PLACEHOLDERS.map((placeholder) => (
              <div key={placeholder} className="flex min-h-14 items-center justify-center rounded-xl border border-dashed border-[#b9cbb5] bg-[#f4f8f1] px-4 text-center text-xs font-semibold text-[#708171] dark:border-white/15 dark:bg-white/[0.025] dark:text-[#9eaaa2]">
                {placeholder}
              </div>
            ))}
          </div>
        </section>

        <section id="why-kapit" className="scroll-mt-24 bg-[#fbfdf9] px-5 py-20 dark:bg-[#15191b]">
          <h2 className="max-w-[11ch] text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">Technical hiring needs a narrower signal.</h2>
          <p className="mt-5 text-base leading-7 text-[#526858] dark:text-[#bdc8c0]">KapIT keeps profiles, roles, and review tools centered on Philippine IT work.</p>
          <div className="mt-10 border-t border-[#d5e1d1] dark:border-white/10">
            {['See skills and portfolio context together.', 'Compare applicants against the role.', 'Keep decisions and conversations connected.'].map((item, index) => (
              <div key={item} className="grid grid-cols-[2.25rem_1fr] gap-4 border-b border-[#dce5d9] py-6 dark:border-white/8">
                <span className="font-mono text-xs font-semibold text-[#789079] dark:text-[#91a496]">0{index + 1}</span>
                <p className="text-lg font-semibold leading-snug tracking-[-0.025em]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-[#edf4ea] px-5 py-20 dark:bg-[#171d19]">
          <h2 className="max-w-[10ch] text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">From open role to clear next step.</h2>
          <div className="mt-10 space-y-5">
            {EMPLOYER_WORKFLOW.map((step, index) => (
              <article key={step.title} className="rounded-[1.5rem] border border-[#ceddca] bg-[#f8fbf5] p-6 dark:border-white/10 dark:bg-[#121614]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#31572c] text-sm font-bold text-white dark:bg-[#8db692] dark:text-[#102115]">{index + 1}</span>
                <h3 className="mt-6 text-xl font-semibold tracking-[-0.025em]">{step.title}</h3>
                <p className="mt-2 leading-7 text-[#536b58] dark:text-[#bdc8c0]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="hiring-tools" className="scroll-mt-24 bg-[#f7faf5] py-20 dark:bg-[#121416]">
          <div className="px-5">
            <h2 className="max-w-[10ch] text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">One focused hiring workspace.</h2>
            <p className="mt-5 leading-7 text-[#536b58] dark:text-[#bdc8c0]">Candidate context stays connected across the full hiring journey.</p>
          </div>
          <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {EMPLOYER_CAPABILITIES.map((capability, index) => {
              const Icon = CAPABILITY_ICONS[index];
              return (
                <article key={capability.title} className="min-h-[15rem] min-w-[82vw] snap-center rounded-[1.75rem] border border-[#d4e1d0] bg-[#fbfdf9] p-7 shadow-[0_16px_40px_rgba(34,62,45,0.07)] dark:border-white/8 dark:bg-[#171b1d]">
                  <Icon className="h-7 w-7 text-[#527656] dark:text-[#91ba96]" />
                  <h3 className="mt-10 text-2xl font-semibold tracking-[-0.035em]">{capability.title}</h3>
                  <p className="mt-3 leading-7 text-[#596d5d] dark:text-[#b9c5bd]">{capability.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="employer-pricing" className="scroll-mt-24 bg-[#173225] px-5 py-20 text-white dark:bg-[#1a241e]">
          <p className="text-sm font-semibold text-[#b8cfba]">Current employer posting options</p>
          <h2 className="mt-5 text-[2.6rem] font-bold leading-[1.02] tracking-[-0.055em]">Choose a posting plan when the role is ready.</h2>
          <p className="mt-5 leading-7 text-[#c9d8cc]">Review current options before publishing. Final payable amounts remain part of checkout.</p>
          <Link href="/for-employers/pricing" className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#f2f7ef] px-6 font-semibold text-[#173225] active:scale-[0.98]">
            View pricing <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </section>

        <section className="bg-[#fbfdf9] px-5 py-20 dark:bg-[#15191b]">
          <h2 className="text-[2.35rem] font-bold tracking-[-0.05em] text-[#102a1b] dark:text-white">Employer questions</h2>
          <div className="mt-6">
            {EMPLOYER_FAQ.map((item) => (
              <details key={item.question} className="border-b border-[#d7e2d3] py-6 dark:border-white/10">
                <summary className="cursor-pointer list-none pr-8 text-lg font-semibold marker:hidden">{item.question}</summary>
                <p className="mt-4 leading-7 text-[#596d5d] dark:text-[#b9c5bd]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-[#edf4ea] px-5 py-20 dark:bg-[#171d19]">
          <div className="rounded-[2rem] border border-[#ceddca] bg-[#f9fcf7] px-6 py-12 text-center dark:border-white/10 dark:bg-[#121614]">
            <h2 className="text-[2.45rem] font-bold leading-[1.03] tracking-[-0.055em] text-[#102a1b] dark:text-white">Build a clearer path to your next IT hire.</h2>
            <p className="mt-5 leading-7 text-[#536b58] dark:text-[#bdc8c0]">Create your employer workspace and start with the hiring task your team needs now.</p>
            <button type="button" onClick={onCreateAccount} className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#31572c] px-6 font-semibold text-white active:scale-[0.98] dark:bg-[#8db692] dark:text-[#102115]">
              Create company account <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
