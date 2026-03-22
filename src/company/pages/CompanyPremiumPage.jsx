import React from 'react';
import { Briefcase, Check, Crown, RotateCcw, WalletCards, BadgeCheck } from 'lucide-react';

const plans = [
  {
    id: 'starter',
    name: 'Starter Posting',
    amount: 'Flexible',
    unit: 'usage model',
    subtitle: 'Create listings and manage applicants without a monthly subscription.',
    cta: 'Included by default',
    features: [
      { icon: Briefcase, text: 'Post and manage job listings for free' },
      { icon: Check, text: 'Review applicants and shortlist candidates' },
      { icon: RotateCcw, text: 'Reopen closed jobs using the same saved details' },
      { icon: WalletCards, text: 'No monthly billing required' },
    ],
  },
  {
    id: 'pay-per-use',
    name: 'Pay Before Posting',
    amount: 'Per plan',
    unit: 'selected at checkout',
    subtitle: 'Each job post requires plan selection and payment before it is published.',
    cta: 'Charged only when used',
    highlighted: true,
    features: [
      { icon: BadgeCheck, text: 'Publish each role after the selected posting plan is confirmed' },
      { icon: WalletCards, text: 'No monthly subscription required' },
      { icon: RotateCcw, text: 'Reopen the same role later without rebuilding the form' },
      { icon: Briefcase, text: 'Best fit for occasional or flexible hiring' },
    ],
  },
];

function PlanCard({ plan }) {
  const highlighted = Boolean(plan.highlighted);

  return (
    <div
      className={`flex min-h-[620px] flex-col rounded-[22px] border p-6 transition-colors ${
        highlighted
          ? 'border-[#588157] bg-[linear-gradient(180deg,#f4f8f1,#eaf2e5)] shadow-[0_20px_60px_rgba(88,129,87,0.16)] dark:border-[#3ba9d6]/45 dark:bg-[linear-gradient(180deg,#17314a,#102235)] dark:shadow-[0_20px_60px_rgba(11,26,45,0.42)]'
          : 'border-[#d6d3c9] bg-[linear-gradient(180deg,#ffffff,#f5f5f2)] shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-[#2a4a6f] dark:bg-[linear-gradient(180deg,#162842,#102235)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)]'
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          {highlighted ? <Crown className="h-5 w-5 text-[#588157] dark:text-[#7fd0ee]" /> : null}
          <h3 className="text-[2rem] font-medium tracking-tight text-[#102a1b] dark:text-white">{plan.name}</h3>
        </div>
        <div className="mt-6 flex items-start gap-3 text-[#102a1b] dark:text-white">
          <span className="text-5xl font-semibold leading-none">{plan.amount}</span>
          <span className={`pt-2 text-sm leading-5 ${highlighted ? 'text-[#3a5a40]/90 dark:text-[#d7eef9]' : 'text-[#344e41]/85 dark:text-[#b8d4e8]'}`}>{plan.unit}</span>
        </div>
        <p className={`mt-6 text-base ${highlighted ? 'text-[#2f4e39] dark:text-[#dcecff]' : 'text-[#344e41] dark:text-[#b8d4e8]'}`}>{plan.subtitle}</p>
      </div>

      <button
        type="button"
        className={`mt-8 w-full rounded-full border px-6 py-3 text-sm font-medium transition-colors ${
          highlighted
            ? 'border-[#3a5a40] bg-[#3a5a40] text-white dark:border-[#3ba9d6] dark:bg-[#3ba9d6] dark:text-[#0a1628]'
            : 'border-[#a3b18a] bg-transparent text-[#344e41] dark:border-[#2a4a6f] dark:text-[#dcecff]'
        }`}
      >
        {plan.cta}
      </button>

      <div className="mt-8 space-y-4">
        {plan.features.map(({ icon: Icon, text }) => (
          <div key={text} className={`flex items-start gap-3 ${highlighted ? 'text-[#2f4e39] dark:text-[#dcecff]' : 'text-[#344e41] dark:text-[#dcecff]'}`}>
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#588157] dark:text-[#7fd0ee]" />
            <span className="text-[0.97rem] leading-6">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompanyPremium() {
  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-[#a3b18a] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)] dark:border-[#2a4a6f] dark:bg-[#162842] dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#a3b18a] px-6 py-5 dark:border-[#2a4a6f]">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#102a1b] dark:text-white">
            <Crown className="h-6 w-6 text-[#588157] dark:text-[#7fd0ee]" />
            Usage Pricing
          </h2>
          <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">Company hiring now uses a pay-before-posting flow instead of a monthly posting plan.</p>
        </div>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}





