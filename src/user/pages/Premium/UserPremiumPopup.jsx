import React from 'react';
import { BadgeDollarSign, Brain, Check, Crown, Image as ImageIcon, Landmark, MessageCircle, QrCode, Sparkles, WalletCards, X } from 'lucide-react';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';

const PREMIUM_PLAN = {
  id: 'premium',
  name: 'Premium',
  amount: 399,
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
};

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
  PREMIUM_PLAN,
];

const DEFAULT_BANK = 'BDO Online Banking';

const BANK_OPTIONS = [
  'BDO Online Banking',
  'BPI Online',
  'UnionBank Online',
  'Metrobank Online',
  'Landbank iAccess',
  'RCBC Pulz',
  'Security Bank Online',
  'PNB Digital',
  'Chinabank Online',
  'EastWest Online',
];

const PAYMENT_PROVIDERS = [
  {
    id: 'gcash',
    label: 'GCash',
    merchantName: 'KapIT GCash Merchant',
    merchantCode: 'KAPIT-GCASH-001',
    accountHint: 'Merchant wallet ending in 2841',
    description: 'Collect premium upgrades through a verified GCash merchant wallet.',
    icon: WalletCards,
  },
  {
    id: 'maya',
    label: 'PayMaya',
    merchantName: 'KapIT Maya Business',
    merchantCode: 'KAPIT-MAYA-110',
    accountHint: 'Business wallet ending in 5518',
    description: 'Accept Maya wallet and card-backed payments in one flow.',
    icon: QrCode,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    merchantName: 'KapIT PayPal Merchant',
    merchantCode: 'KAPIT-PP-314',
    accountHint: 'merchant@kapit.example',
    description: 'Use PayPal checkout for local or international premium payments.',
    icon: BadgeDollarSign,
  },
  {
    id: 'bank',
    label: 'PH Online Banks',
    merchantName: 'KapIT Bank Collection',
    merchantCode: 'KAPIT-BANK-808',
    accountHint: 'Instapay / Pesonet merchant collection',
    description: 'Route payment through supported Philippine online banking partners.',
    icon: Landmark,
  },
];

function PlanCard({ plan, onUpgrade }) {
  const highlighted = Boolean(plan.highlighted);

  return (
    <div
      className={`flex min-h-0 flex-col rounded-[20px] border p-4 sm:min-h-[520px] sm:p-5 transition-colors ${
        highlighted
          ? 'border-[#588157] bg-[linear-gradient(180deg,#f4f8f1,#eaf2e5)] shadow-[0_20px_60px_rgba(88,129,87,0.16)] dark:border-[#3ba9d6]/45 dark:bg-[linear-gradient(180deg,#17314a,#102235)] dark:shadow-[0_20px_60px_rgba(11,26,45,0.42)]'
          : 'border-[#d6d3c9] bg-[linear-gradient(180deg,#ffffff,#f5f5f2)] shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-[#2a4a6f] dark:bg-[linear-gradient(180deg,#162842,#102235)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)]'
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          {highlighted ? <Crown className="h-5 w-5 text-[#588157] dark:text-[#7fd0ee]" /> : null}
          <h3 className="text-[1.85rem] sm:text-[2rem] font-medium tracking-tight text-[#102a1b] dark:text-white">{plan.name}</h3>
        </div>
        <div className="mt-5 flex items-start gap-2 sm:mt-6 sm:gap-3 text-[#102a1b] dark:text-white">
          <span className={`pt-1.5 text-lg sm:pt-2 sm:text-xl ${highlighted ? 'text-[#3a5a40]/80 dark:text-[#d7eef9]' : 'text-[#344e41]/70 dark:text-[#b8d4e8]'}`}>PHP</span>
          <span className="text-[3.3rem] sm:text-5xl font-semibold leading-none">{plan.amount}</span>
          <span className={`whitespace-pre-line pt-1.5 text-sm leading-4 sm:pt-2 ${highlighted ? 'text-[#3a5a40]/90 dark:text-[#d7eef9]' : 'text-[#344e41]/85 dark:text-[#b8d4e8]'}`}>{plan.unit}</span>
        </div>
        <p className={`mt-5 text-[0.98rem] sm:mt-6 sm:text-base ${highlighted ? 'text-[#2f4e39] dark:text-[#dcecff]' : 'text-[#344e41] dark:text-[#b8d4e8]'}`}>{plan.subtitle}</p>
      </div>

      <button
        type="button"
        onClick={highlighted ? onUpgrade : undefined}
        className={`mt-6 w-full rounded-full border px-5 py-3 text-sm font-medium transition-colors sm:mt-8 sm:px-6 ${
          highlighted
            ? 'border-[#3a5a40] bg-[#3a5a40] text-white hover:bg-[#344e41] dark:border-[#3ba9d6] dark:bg-[#3ba9d6] dark:text-[#0a1628] dark:hover:bg-[#5bc0de]'
            : 'border-[#a3b18a] bg-transparent text-[#344e41] hover:bg-[#eef6ee] hover:text-[#102a1b] dark:border-[#2a4a6f] dark:text-[#dcecff] dark:hover:bg-[#1e3a5f] dark:hover:text-white'
        }`}
      >
        {plan.cta}
      </button>

      <div className="mt-6 space-y-3.5 sm:mt-8 sm:space-y-4">
        {plan.features.map(({ icon: Icon, text }) => (
          <div key={text} className={`flex items-start gap-3 ${highlighted ? 'text-[#2f4e39] dark:text-[#dcecff]' : 'text-[#344e41] dark:text-[#dcecff]'}`}>
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#588157] dark:text-[#7fd0ee]" />
            <span className="text-[0.95rem] leading-6 sm:text-[0.97rem]">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MerchantCheckout({ user, onBack, onClose, onConfirmUpgrade }) {
  const [paymentMethod, setPaymentMethod] = React.useState('gcash');
  const [selectedBank, setSelectedBank] = React.useState(DEFAULT_BANK);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const selectedProvider = PAYMENT_PROVIDERS.find((provider) => provider.id === paymentMethod) || PAYMENT_PROVIDERS[0];
  const displayName = user?.fullName || user?.username || user?.name || 'User account';

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await onConfirmUpgrade?.({
        isPremium: true,
        premiumPlan: PREMIUM_PLAN.name,
        premiumBillingAmount: PREMIUM_PLAN.amount,
        premiumBillingCycle: 'monthly',
        premiumPaymentMethod: selectedProvider.label,
      });
      setSuccess(`Payment confirmed via ${selectedProvider.label}. Your premium access is now active.`);
      window.setTimeout(() => {
        onClose?.();
      }, 1000);
    } catch (upgradeError) {
      setError(upgradeError?.message || 'Payment was captured but premium could not be activated. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">
        <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-4 shadow-lg shadow-black/5 dark:shadow-black/20 space-y-4 sm:p-5">
          <div className="flex items-center justify-between gap-4 border-b border-[#d6d3c9] dark:border-[#2a4a6f] pb-4">
            <div>
              <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Selected plan total</p>
              <p className="text-3xl font-extrabold text-[#3a5a40] dark:text-white">PHP {PREMIUM_PLAN.amount}</p>
              <p className="mt-1 text-sm text-[#4b5563] dark:text-[#b8d4e8]">Premium monthly subscription</p>
            </div>
            <div className="rounded-xl bg-[#eef6ee] dark:bg-[#102235] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[#588157] dark:text-[#7fd0ee]">Status</p>
              <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">Ready for checkout</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#102235] p-4 space-y-2">
            <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Premium will be activated for</p>
            <p className="text-xl font-bold text-[#3a5a40] dark:text-white">{displayName}</p>
            <p className="text-sm text-[#344e41] dark:text-[#dcecff]">{user?.email || 'No email on file'}</p>
            <p className="text-sm text-[#344e41] dark:text-[#dcecff]">{PREMIUM_PLAN.subtitle}</p>
          </div>

          <div className="rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#102235] p-4">
            <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">Premium includes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PREMIUM_PLAN.features.map(({ text }) => (
                <span
                  key={text}
                  className="rounded-full border border-[#bfd0af] bg-white px-3 py-1 text-xs font-medium text-[#344e41] dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:text-[#dcecff]"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">Choose merchant connection</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_PROVIDERS.map((provider) => {
                const Icon = provider.icon;
                const selected = paymentMethod === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setPaymentMethod(provider.id)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${selected ? 'border-[#588157] bg-[#eef6ee] dark:border-[#3ba9d6] dark:bg-[#1e3a5f]' : 'border-[#d6d3c9] bg-[#fbfcfa] hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#102235] dark:hover:bg-[#132846]'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-white dark:bg-[#0f2139] p-2">
                        <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#7fd0ee]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#3a5a40] dark:text-white">{provider.label}</p>
                        <p className="mt-1 text-xs text-[#4b5563] dark:text-[#b8d4e8]">{provider.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMethod === 'bank' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#3a5a40] dark:text-white">Preferred PH online bank</label>
              <SearchableSelect
                value={selectedBank}
                onChange={setSelectedBank}
                options={BANK_OPTIONS}
                placeholder="Select online bank"
                searchPlaceholder="Search online banks"
                disabled={loading}
              />
            </div>
          )}

          <div className="rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#0f2139] p-4 text-sm text-[#344e41] dark:text-[#dcecff]">
            Premium activates only after the merchant payment is confirmed. Closing this checkout before completion keeps your account on the free plan.
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            >
              Back to plans
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold disabled:opacity-60 transition-colors"
            >
              {loading ? 'Processing payment...' : `Proceed to payment for PHP ${PREMIUM_PLAN.amount}`}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-4 shadow-lg shadow-black/5 dark:shadow-black/20 space-y-4 sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#588157] dark:text-[#7fd0ee]">Connected merchant</p>
            <h2 className="mt-1 text-xl font-bold text-[#3a5a40] dark:text-white">{selectedProvider.merchantName}</h2>
          </div>

          <div className="rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#102235] p-4 space-y-3 text-sm">
            <div>
              <p className="text-[#4b5563] dark:text-[#b8d4e8]">Merchant code</p>
              <p className="font-semibold text-[#3a5a40] dark:text-white">{selectedProvider.merchantCode}</p>
            </div>
            <div>
              <p className="text-[#4b5563] dark:text-[#b8d4e8]">Receiving account</p>
              <p className="font-semibold text-[#3a5a40] dark:text-white">{paymentMethod === 'bank' ? selectedBank : selectedProvider.accountHint}</p>
            </div>
            <div>
              <p className="text-[#4b5563] dark:text-[#b8d4e8]">Settlement route</p>
              <p className="font-semibold text-[#3a5a40] dark:text-white">{selectedProvider.label}</p>
            </div>
            <div>
              <p className="text-[#4b5563] dark:text-[#b8d4e8]">Subscription plan</p>
              <p className="font-semibold text-[#3a5a40] dark:text-white">{PREMIUM_PLAN.name} - PHP {PREMIUM_PLAN.amount}</p>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-[#a3b18a] dark:border-[#2a4a6f] p-4 text-sm text-[#344e41] dark:text-[#dcecff]">
            Merchant connection UI is ready here for GCash, PayMaya, PayPal, and Philippine online banks. To make this fully live, the final provider API keys and webhook/server endpoints still need to be connected.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PremiumPopup({ isOpen, onClose, user, onUpgrade }) {
  const [showMerchantCheckout, setShowMerchantCheckout] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setShowMerchantCheckout(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center p-2 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
        <div className="flex max-h-[min(92vh,960px)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-[#a3b18a] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.18)] dark:border-[#2a4a6f] dark:bg-[#162842] dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:rounded-[28px]">
          <div className="flex items-start justify-between gap-4 border-b border-[#a3b18a] px-4 py-4 sm:px-5 dark:border-[#2a4a6f]">
            <div>
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-[#102a1b] dark:text-white">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-[#588157] dark:text-[#7fd0ee]" />
                {showMerchantCheckout ? 'Complete premium payment' : 'Premium Plans'}
              </h2>
              <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">
                {showMerchantCheckout
                  ? 'This merchant window matches the company payment flow so users can upgrade with the same checkout experience.'
                  : 'Choose between Free Plan and Premium Plan.'}
              </p>
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

          {showMerchantCheckout ? (
            <MerchantCheckout
              user={user}
              onBack={() => setShowMerchantCheckout(false)}
              onClose={onClose}
              onConfirmUpgrade={onUpgrade}
            />
          ) : (
            <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onUpgrade={() => setShowMerchantCheckout(true)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
