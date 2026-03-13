import React from 'react';
import { Briefcase, Check, Crown, MessageCircle, Search, ShieldCheck, X } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    amount: '0',
    unit: 'PHP /\nmonth',
    subtitle: 'Start posting and hiring with the basics.',
    cta: 'Your current plan',
    features: [
      { icon: Briefcase, text: 'Create company profile' },
      { icon: Check, text: 'Post jobs and manage listings' },
      { icon: MessageCircle, text: 'Send limited candidate messages' },
      { icon: Search, text: 'Review applicants and basic search access' },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    amount: '399',
    unit: 'PHP /\nmonth',
    subtitle: 'Get more visibility and better hiring tools.',
    cta: 'Upgrade to Premium',
    highlighted: true,
    features: [
      { icon: Check, text: 'Everything in Free' },
      { icon: Search, text: 'Priority ranking in search' },
      { icon: MessageCircle, text: 'Unlimited messages and applications' },
      { icon: ShieldCheck, text: 'Premium badge and boosted trust' },
      { icon: Briefcase, text: 'Advanced hiring tools and filters' },
    ],
  },
];

function PlanCard({ plan }) {
  return (
    <div className="flex min-h-[620px] flex-col rounded-[22px] border border-[#d6d3c9] bg-[linear-gradient(180deg,#ffffff,#f5f5f2)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-white/12 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <div>
        <h3 className="text-[2rem] font-medium tracking-tight text-[#102a1b] dark:text-white">{plan.name}</h3>
        <div className="mt-6 flex items-start gap-3 text-[#102a1b] dark:text-white">
          <span className="pt-2 text-xl text-[#344e41]/70 dark:text-white/70">PHP</span>
          <span className="text-5xl font-semibold leading-none">{plan.amount}</span>
          <span className="whitespace-pre-line pt-2 text-sm leading-4 text-[#344e41]/85 dark:text-white/85">{plan.unit}</span>
        </div>
        <p className="mt-6 text-base text-[#344e41] dark:text-white/88">{plan.subtitle}</p>
      </div>

      <button
        type="button"
        onClick={plan.highlighted ? () => window.alert('Premium upgrade coming soon.') : undefined}
        className={`mt-8 w-full rounded-full border px-6 py-3 text-sm font-medium transition-colors ${
          plan.highlighted
            ? 'border-[#3a5a40] bg-[#3a5a40] text-white hover:bg-[#344e41] dark:border-white/5 dark:bg-white dark:text-black dark:hover:bg-white/90'
            : 'border-[#a3b18a] bg-transparent text-[#344e41] hover:bg-[#eef6ee] hover:text-[#102a1b] dark:border-white/10 dark:text-white/75 dark:hover:bg-white/5 dark:hover:text-white'
        }`}
      >
        {plan.cta}
      </button>

      <div className="mt-8 space-y-4">
        {plan.features.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-3 text-[#344e41] dark:text-white/92">
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#588157] dark:text-white/90" />
            <span className="text-[0.97rem] leading-6">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompanyPremiumPopup({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#a3b18a] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-[#171717] dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#a3b18a] px-6 py-5 dark:border-white/10">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#102a1b] dark:text-white">
              <Crown className="h-6 w-6 text-[#f5b301]" />
              Premium Plans
            </h2>
            <p className="mt-1 text-sm text-[#344e41] dark:text-white/70">Choose between Free Plan and Premium Plan.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#344e41] transition-colors hover:bg-[#f5f5f2] hover:text-[#102a1b] dark:text-white/80 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label="Close premium popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}
