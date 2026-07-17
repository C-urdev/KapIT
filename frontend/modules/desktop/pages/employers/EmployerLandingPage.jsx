import { ArrowRight, BadgeCheck, BriefcaseBusiness, ClipboardCheck, ListChecks, MessageCircle, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Link from '../../../../components/shared/Link';
import Footer from '../../../shared/components/branding/Footer';
import EmployerProductPreview from '../../../shared/pages/employers/EmployerProductPreview';
import { EMPLOYER_CAPABILITIES, EMPLOYER_FAQ, EMPLOYER_PAGE_META, EMPLOYER_PROOF_PLACEHOLDERS, EMPLOYER_WORKFLOW } from '../../../shared/pages/employers/employerLandingData';
import EmployerDesktopNav from '../../components/navigation/EmployerDesktopNav';

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

      <EmployerDesktopNav onCreateAccount={onCreateAccount} onSignIn={onSignIn} />

      <main>
        <section className="relative min-h-[100dvh] overflow-hidden pt-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(127,171,130,0.22),transparent_32%),linear-gradient(180deg,#f7faf5_0%,#edf4ea_100%)] dark:bg-[radial-gradient(circle_at_78%_18%,rgba(127,171,130,0.13),transparent_30%),linear-gradient(180deg,#121416_0%,#171d19_100%)]" />
          <div className="relative mx-auto grid max-w-[1400px] grid-cols-2 items-center gap-12 px-8 pb-20 pt-8">
            <div className="max-w-[42rem]">
              <p className="text-sm font-semibold text-[#58705a] dark:text-[#a8b7ac]">Employer workspace for Philippine tech hiring</p>
              <h1 className="mt-6 text-balance text-[clamp(3.2rem,4.4vw,4.5rem)] font-bold leading-[0.96] tracking-[-0.06em] text-[#102a1b] dark:text-white">
                Find stronger-fit Filipino IT talent.
              </h1>
              <p className="mt-7 max-w-[34rem] text-pretty text-lg leading-8 text-[#4b6251] dark:text-[#c6d0c9]">
                Search focused developer profiles, compare role fit, and manage every hiring step in one workspace.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button type="button" onClick={onCreateAccount} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#31572c] px-7 font-semibold text-white shadow-[0_16px_32px_rgba(49,87,44,0.23)] transition-[background-color,transform] duration-200 hover:bg-[#274823] active:scale-[0.98] dark:bg-[#8db692] dark:text-[#102115] dark:hover:bg-[#9bc49f]">
                  Create company account <ArrowRight className="h-4.5 w-4.5" />
                </button>
                <button type="button" onClick={onSignIn} className="min-h-[52px] rounded-full border border-[#c7d7c3] bg-white/70 px-7 font-semibold text-[#173225] transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/8">
                  Sign in
                </button>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[#d5e1d1] pt-6 text-sm font-medium text-[#536b58] dark:border-white/10 dark:text-[#b9c5bd]">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Focused on IT roles</span>
                <span className="inline-flex items-center gap-2"><UsersRound className="h-4 w-4" /> Built for Philippine hiring</span>
              </div>
            </div>
            <EmployerProductPreview onExplore={onCreateAccount} />
          </div>
        </section>

        <section aria-label="Employer social proof placeholders" className="border-y border-[#dce5d9] bg-[#fbfdf9] dark:border-white/8 dark:bg-[#15191b]">
          <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-8 py-7">
            <p className="max-w-[13rem] text-sm font-semibold text-[#516854] dark:text-[#b9c5bd]">Reserved for verified employer proof</p>
            <div className="grid flex-1 grid-cols-3 gap-3">
              {EMPLOYER_PROOF_PLACEHOLDERS.map((placeholder) => (
                <div key={placeholder} className="flex min-h-14 items-center justify-center rounded-xl border border-dashed border-[#b9cbb5] bg-[#f4f8f1] px-4 text-center text-xs font-semibold text-[#708171] dark:border-white/15 dark:bg-white/[0.025] dark:text-[#9eaaa2]">
                  {placeholder}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why-kapit" className="scroll-mt-28 bg-[#fbfdf9] py-32 dark:bg-[#15191b]">
          <div className="mx-auto grid max-w-[1400px] grid-cols-[0.78fr_1.22fr] gap-24 px-8">
            <div>
              <h2 className="max-w-[12ch] text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">Technical hiring needs a narrower signal.</h2>
              <p className="mt-6 max-w-md text-lg leading-8 text-[#526858] dark:text-[#bdc8c0]">Broad marketplaces make recruiters sort through noise. KapIT keeps profiles, roles, and review tools centered on Philippine IT work.</p>
            </div>
            <div className="border-l border-[#d5e1d1] pl-12 dark:border-white/10">
              {['See skills, portfolio context, and role intent together.', 'Compare applicants against the opening your team published.', 'Keep jobs, applicant decisions, and candidate conversations connected.'].map((item, index) => (
                <div key={item} className="grid grid-cols-[3rem_1fr] gap-5 border-b border-[#dce5d9] py-8 first:pt-0 last:border-0 dark:border-white/8">
                  <span className="font-mono text-sm font-semibold text-[#789079] dark:text-[#91a496]">0{index + 1}</span>
                  <p className="text-2xl font-semibold leading-snug tracking-[-0.035em] text-[#25432b] dark:text-[#e8eeea]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-28 bg-[#edf4ea] py-32 dark:bg-[#171d19]">
          <div className="mx-auto grid max-w-[1400px] grid-cols-[1.1fr_0.9fr] gap-16 px-8">
            <div className="rounded-[2.25rem] border border-[#ceddca] bg-[#f8fbf5] p-10 dark:border-white/10 dark:bg-[#121614]">
              <EmployerProductPreview onExplore={onCreateAccount} />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">From open role to clear next step.</h2>
              <div className="mt-10 space-y-8">
                {EMPLOYER_WORKFLOW.map((step, index) => (
                  <article key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#31572c] text-sm font-bold text-white dark:bg-[#8db692] dark:text-[#102115]">{index + 1}</span>
                    <div>
                      <h3 className="text-xl font-semibold tracking-[-0.025em]">{step.title}</h3>
                      <p className="mt-2 leading-7 text-[#536b58] dark:text-[#bdc8c0]">{step.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="hiring-tools" className="scroll-mt-28 bg-[#f7faf5] py-32 dark:bg-[#121416]">
          <div className="mx-auto max-w-[1400px] px-8">
            <h2 className="max-w-[13ch] text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-[#102a1b] dark:text-white">One focused hiring workspace.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#536b58] dark:text-[#bdc8c0]">Use the parts you need today, while candidate context stays connected across the full hiring journey.</p>
            <div className="mt-14 grid grid-cols-12 gap-5">
              {EMPLOYER_CAPABILITIES.map((capability, index) => {
                const Icon = CAPABILITY_ICONS[index];
                const sizeClass = index === 0 || index === 5 ? 'col-span-7' : index === 1 || index === 4 ? 'col-span-5' : 'col-span-6';
                return (
                  <article key={capability.title} className={`${sizeClass} min-h-[14rem] rounded-[1.75rem] border border-[#d4e1d0] bg-[#fbfdf9] p-8 shadow-[0_18px_45px_rgba(34,62,45,0.06)] dark:border-white/8 dark:bg-[#171b1d]`}>
                    <Icon className="h-7 w-7 text-[#527656] dark:text-[#91ba96]" />
                    <h3 className="mt-10 text-2xl font-semibold tracking-[-0.035em]">{capability.title}</h3>
                    <p className="mt-3 max-w-[34rem] leading-7 text-[#596d5d] dark:text-[#b9c5bd]">{capability.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="employer-pricing" className="scroll-mt-28 bg-[#173225] py-28 text-white dark:bg-[#1a241e]">
          <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto] items-end gap-16 px-8">
            <div>
              <p className="text-sm font-semibold text-[#b8cfba]">Current employer posting options</p>
              <h2 className="mt-5 max-w-[15ch] text-5xl font-bold leading-[1.02] tracking-[-0.055em]">Choose a posting plan when the role is ready.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c9d8cc]">Review current options before publishing. Final payable amounts remain part of the checkout flow.</p>
            </div>
            <Link href="/pricing" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#f2f7ef] px-7 font-semibold text-[#173225] transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.98]">
              View pricing <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>
        </section>

        <section className="bg-[#fbfdf9] py-28 dark:bg-[#15191b]">
          <div className="mx-auto grid max-w-[1200px] grid-cols-[0.7fr_1.3fr] gap-20 px-8">
            <h2 className="text-4xl font-bold tracking-[-0.05em] text-[#102a1b] dark:text-white">Employer questions</h2>
            <div>
              {EMPLOYER_FAQ.map((item) => (
                <details key={item.question} className="group border-b border-[#d7e2d3] py-6 dark:border-white/10">
                  <summary className="cursor-pointer list-none pr-8 text-lg font-semibold marker:hidden">{item.question}</summary>
                  <p className="mt-4 max-w-2xl leading-7 text-[#596d5d] dark:text-[#b9c5bd]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#edf4ea] py-28 dark:bg-[#171d19]">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center rounded-[2.5rem] border border-[#ceddca] bg-[#f9fcf7] px-10 py-20 text-center shadow-[0_30px_80px_rgba(34,62,45,0.09)] dark:border-white/10 dark:bg-[#121614]">
            <h2 className="max-w-[13ch] text-5xl font-bold leading-[1.03] tracking-[-0.055em] text-[#102a1b] dark:text-white">Build a clearer path to your next IT hire.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#536b58] dark:text-[#bdc8c0]">Create your employer workspace and start with the role, candidate search, or hiring task your team needs now.</p>
            <button type="button" onClick={onCreateAccount} className="mt-9 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#31572c] px-8 font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-[#274823] active:scale-[0.98] dark:bg-[#8db692] dark:text-[#102115]">
              Create company account <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
