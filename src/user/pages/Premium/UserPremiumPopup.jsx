import React from 'react';
import { Brain, Check, Crown, Image as ImageIcon, MessageCircle, Sparkles, X } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    amount: '0',
    unit: 'PHP /\nmonth',
    subtitle: 'Get started with the basics.',
    cta: 'Your current plan',
    features: [
      { icon: Sparkles, text: 'Get simple explanations' },
      { icon: MessageCircle, text: 'Have short chats for common questions' },
      { icon: ImageIcon, text: 'Try out image generation' },
      { icon: Brain, text: 'Save limited memory and context' },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    amount: '399',
    unit: 'PHP /\nmonth',
    subtitle: 'Unlock more tools and deeper access.',
    cta: 'Upgrade to Premium',
    highlighted: true,
    features: [
      { icon: Sparkles, text: 'Explore topics in depth' },
      { icon: MessageCircle, text: 'Chat longer and send more messages' },
      { icon: ImageIcon, text: 'Generate more images for your work' },
      { icon: Brain, text: 'Get more memory for smarter replies' },
      { icon: Check, text: 'Priority visibility and premium badge' },
    ],
  },
];

function PlanCard({ plan }) {
  const highlighted = Boolean(plan.highlighted);

  return (
    <div
      className={`flex min-h-[520px] flex-col rounded-[20px] border p-5 transition-colors ${
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
          <span className={`pt-2 text-xl ${highlighted ? 'text-[#3a5a40]/80 dark:text-[#d7eef9]' : 'text-[#344e41]/70 dark:text-[#b8d4e8]'}`}>PHP</span>
          <span className="text-5xl font-semibold leading-none">{plan.amount}</span>
          <span className={`whitespace-pre-line pt-2 text-sm leading-4 ${highlighted ? 'text-[#3a5a40]/90 dark:text-[#d7eef9]' : 'text-[#344e41]/85 dark:text-[#b8d4e8]'}`}>{plan.unit}</span>
        </div>
        <p className={`mt-6 text-base ${highlighted ? 'text-[#2f4e39] dark:text-[#dcecff]' : 'text-[#344e41] dark:text-[#b8d4e8]'}`}>{plan.subtitle}</p>
      </div>

      <button
        type="button"
        className={`mt-8 w-full rounded-full border px-6 py-3 text-sm font-medium transition-colors ${
          highlighted
            ? 'border-[#3a5a40] bg-[#3a5a40] text-white hover:bg-[#344e41] dark:border-[#3ba9d6] dark:bg-[#3ba9d6] dark:text-[#0a1628] dark:hover:bg-[#5bc0de]'
            : 'border-[#a3b18a] bg-transparent text-[#344e41] hover:bg-[#eef6ee] hover:text-[#102a1b] dark:border-[#2a4a6f] dark:text-[#dcecff] dark:hover:bg-[#1e3a5f] dark:hover:text-white'
        }`}
      >
        {plan.cta}
      </button>

      <div className="mt-8 space-y-4">
        {plan.features.map(({ icon: Icon, text }) => (
          <div key={text} className={`flex items-start gap-3 ${highlighted ? 'text-[#2f4e39] dark:text-[#dcecff]' : 'text-[#344e41] dark:text-[#dcecff]'}`}>
            <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${highlighted ? 'text-[#588157] dark:text-[#7fd0ee]' : 'text-[#588157] dark:text-[#7fd0ee]'}`} />
            <span className="text-[0.97rem] leading-6">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PremiumPopup({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#a3b18a] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)] dark:border-[#2a4a6f] dark:bg-[#162842] dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#a3b18a] px-5 py-4 dark:border-[#2a4a6f]">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-[#102a1b] dark:text-white">
              <Crown className="h-6 w-6 text-[#588157] dark:text-[#7fd0ee]" />
              Premium Plans
            </h2>
            <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">Choose between Free Plan and Premium Plan.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#344e41] transition-colors hover:bg-[#f5f5f2] hover:text-[#102a1b] dark:text-[#b8d4e8] dark:hover:bg-[#1e3a5f] dark:hover:text-white"
            aria-label="Close premium popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}



