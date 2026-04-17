import React from 'react';
import { BadgeCheck, Brain, Check, CheckCircle2, CreditCard, Crown, Image as ImageIcon, MessageCircle, Sparkles, X } from 'lucide-react';
import {
  getUserPremiumPaymentProviders,
  createUserPremiumCheckoutSession,
  verifyUserPremiumStripeCheckout,
  captureUserPremiumPayPalCheckout,
  cancelUserPremiumCheckout,
  completeUserPremiumLocalBypass,
} from '@sharedServices/authService';

const USER_PREMIUM_PAYMENT_PATH = '/premium/payment';
const USER_PREMIUM_PAYMENT_SUCCESS = 'user-premium-payment-success';

const PREMIUM_PLAN = {
  id: 'premium',
  name: 'Premium',
  amount: 449,
  unit: '/\nmonth',
  subtitle: 'For faster, smarter job matching and better visibility. Everything in Free, plus:',
  cta: 'Upgrade to Premium',
  highlighted: true,
  features: [
    { icon: Sparkles, text: 'Priority access to new job postings' },
    { icon: Brain, text: 'Advanced job matching and filter' },
    { icon: Check, text: 'ATS-optimized resume formatting' },
    { icon: Crown, text: 'Access to pre-assessment tools' },
    { icon: BadgeCheck, text: 'Skill match percentage' },
    { icon: CheckCircle2, text: 'Application tracking updates via email' },
    { icon: MessageCircle, text: 'Ghost job prevention features to detect inactive or outdated job posts' },
  ],
};

const plans = [
  {
    id: 'free',
    name: 'Free',
    amount: '0',
    unit: '/\nmonth',
    subtitle: 'For getting started with your job search.',
    cta: 'Your current plan',
    features: [
      { icon: Sparkles, text: 'Access to IT job listings' },
      { icon: Brain, text: 'Basic search and filtering tools' },
      { icon: Check, text: 'Create and manage your profile' },
      { icon: ImageIcon, text: 'Upload your resume' },
      { icon: MessageCircle, text: 'View company profiles' },
      { icon: CheckCircle2, text: 'Email job alerts' },
    ],
  },
  PREMIUM_PLAN,
];

const PAYMENT_PROVIDERS = [
  {
    id: 'stripe',
    label: 'Stripe',
    merchantName: 'KapIT Stripe Checkout',
    merchantCode: 'KAPIT-STRIPE-201',
    accountHint: 'Card checkout handled by Stripe',
    description: 'Accept secure card payments through hosted Stripe Checkout.',
    icon: CreditCard,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    merchantName: 'KapIT PayPal Merchant',
    merchantCode: 'KAPIT-PAYPAL-314',
    accountHint: 'merchant checkout via PayPal',
    description: 'Accept PayPal wallet and supported guest checkout payments.',
    icon: CreditCard,
  },
];

function PlanCard({ plan, onUpgrade, buttonLabel, disabled = false }) {
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
        onClick={highlighted && !disabled ? onUpgrade : undefined}
        disabled={disabled}
        className={`mt-6 w-full rounded-full border px-5 py-3 text-sm font-medium transition-colors sm:mt-8 sm:px-6 ${
          highlighted
            ? disabled
              ? 'border-[#8ea786] bg-[#8ea786] text-white cursor-default dark:border-[#4d7296] dark:bg-[#4d7296] dark:text-white'
              : 'border-[#3a5a40] bg-[#3a5a40] text-white hover:bg-[#344e41] dark:border-[#3ba9d6] dark:bg-[#3ba9d6] dark:text-[#0a1628] dark:hover:bg-[#5bc0de]'
            : 'border-[#a3b18a] bg-transparent text-[#344e41] hover:bg-[#eef6ee] hover:text-[#102a1b] dark:border-[#2a4a6f] dark:text-[#dcecff] dark:hover:bg-[#1e3a5f] dark:hover:text-white'
        }`}
      >
        {buttonLabel || plan.cta}
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

const notifyOpener = (payload) => {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: USER_PREMIUM_PAYMENT_SUCCESS, ...payload }, window.location.origin);
  }
};

function MerchantCheckout({ user, onBack, onClose, onConfirmUpgrade, standalone = false }) {
  const [paymentMethod, setPaymentMethod] = React.useState('stripe');
  const [providerAvailability, setProviderAvailability] = React.useState({
    stripe: { enabled: true, label: 'Stripe', reason: '' },
    paypal: { enabled: true, label: 'PayPal', reason: '' },
  });
  const [currentPaymentId, setCurrentPaymentId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [completedCheckout, setCompletedCheckout] = React.useState(null);
  const handledReturnRef = React.useRef(false);

  const selectedProvider = PAYMENT_PROVIDERS.find((provider) => provider.id === paymentMethod) || PAYMENT_PROVIDERS[0];
  const selectedProviderState = providerAvailability?.[selectedProvider.id] || { enabled: true, reason: '' };
  const displayName = user?.fullName || user?.username || user?.name || 'User account';
  const isLocalhostBypassAvailable = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const stepState = success ? 3 : loading || verifying ? 2 : 1;
  const completedProvider = PAYMENT_PROVIDERS.find((provider) => provider.id === completedCheckout?.providerId) || null;

  React.useEffect(() => {
    let cancelled = false;

    const loadPaymentMeta = async () => {
      try {
        const data = await getUserPremiumPaymentProviders();
        if (!cancelled && data?.providers) {
          setProviderAvailability(data.providers);
          const firstEnabled = PAYMENT_PROVIDERS.find((provider) => data.providers?.[provider.id]?.enabled);
          if (firstEnabled) {
            setPaymentMethod((current) => (data.providers?.[current]?.enabled ? current : firstEnabled.id));
          }
        }
      } catch {
        // Keep local fallback provider list if payment provider metadata is unavailable.
      }
    };

    loadPaymentMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (handledReturnRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const paymentId = params.get('payment_id') || '';

    if (!checkout) {
      return;
    }

    handledReturnRef.current = true;
    setCurrentPaymentId(paymentId);

    const cleanupUrl = () => {
      window.history.replaceState({}, document.title, USER_PREMIUM_PAYMENT_PATH);
    };

    const handleProviderReturn = async () => {
      if (checkout === 'cancelled') {
        if (paymentId) {
          try {
            await cancelUserPremiumCheckout(paymentId);
          } catch {
            // Ignore cancellation persistence failures while keeping the user on free plan.
          }
        }
        setError('Payment was cancelled. Your account stays on the free plan.');
        cleanupUrl();
        return;
      }

      setVerifying(true);
      setError('');

      try {
        if (checkout === 'stripe-success') {
          const sessionId = params.get('session_id');
          if (!sessionId || !paymentId) {
            throw new Error('Missing Stripe session details. Please try the payment again.');
          }

          const data = await verifyUserPremiumStripeCheckout({ paymentId, sessionId });
          if (data?.user) {
            await onConfirmUpgrade?.(data.user);
            notifyOpener({ updates: data.user });
          }
          setCompletedCheckout({
            providerId: 'stripe',
            amount: PREMIUM_PLAN.amount,
            planName: PREMIUM_PLAN.name,
            billingCycle: 'monthly',
            paymentMethod: 'Stripe',
            reference: data?.payment?.provider_payment_id || data?.payment?.provider_checkout_id || paymentId,
            accountHint: PAYMENT_PROVIDERS.find((provider) => provider.id === 'stripe')?.accountHint || '',
          });
          setSuccess('Stripe payment verified. Your premium access is now active.');
          cleanupUrl();
          return;
        }

        if (checkout === 'paypal-success') {
          const orderId = params.get('token');
          if (!orderId || !paymentId) {
            throw new Error('Missing PayPal order details. Please try the payment again.');
          }

          const data = await captureUserPremiumPayPalCheckout({ paymentId, orderId });
          if (data?.user) {
            await onConfirmUpgrade?.(data.user);
            notifyOpener({ updates: data.user });
          }
          setCompletedCheckout({
            providerId: 'paypal',
            amount: PREMIUM_PLAN.amount,
            planName: PREMIUM_PLAN.name,
            billingCycle: 'monthly',
            paymentMethod: 'PayPal',
            reference: data?.payment?.provider_payment_id || data?.payment?.provider_checkout_id || paymentId,
            accountHint: PAYMENT_PROVIDERS.find((provider) => provider.id === 'paypal')?.accountHint || '',
          });
          setSuccess('PayPal payment verified. Your premium access is now active.');
          cleanupUrl();
          return;
        }

        throw new Error('Unknown checkout return state.');
      } catch (verificationError) {
        setError(verificationError?.message || 'Payment verification failed. Please try again.');
        cleanupUrl();
      } finally {
        setVerifying(false);
      }
    };

    handleProviderReturn();
  }, [onConfirmUpgrade]);

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedProviderState.enabled) {
        throw new Error(`${selectedProvider.label} is not available yet. Configure it in the server environment first.`);
      }

      const data = await createUserPremiumCheckoutSession({
        provider: paymentMethod,
      });

      if (!data?.checkoutUrl) {
        throw new Error('The payment provider did not return a checkout URL.');
      }

      setCurrentPaymentId(data.paymentId || '');
      window.location.assign(data.checkoutUrl);
    } catch (checkoutError) {
      setLoading(false);
      setError(checkoutError?.message || 'Unable to start the payment flow.');
    }
  };

  const handleSampleSuccess = async () => {
    if (!isLocalhostBypassAvailable) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await completeUserPremiumLocalBypass({
        provider: paymentMethod,
      });
      if (data?.user) {
        await onConfirmUpgrade?.(data.user);
        notifyOpener({ updates: data.user });
      }
      setCurrentPaymentId(data?.payment?.id || '');
      setCompletedCheckout({
        providerId: paymentMethod,
        amount: PREMIUM_PLAN.amount,
        planName: PREMIUM_PLAN.name,
        billingCycle: 'monthly',
        paymentMethod: selectedProvider.label,
        reference: data?.payment?.provider_payment_id || data?.payment?.provider_checkout_id || `sample-${Date.now()}`,
        accountHint: selectedProvider.accountHint,
      });
      setSuccess('Local sample payment completed and your premium access is now active.');
    } catch (upgradeError) {
      setError(upgradeError?.message || 'Unable to complete the local sample payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (currentPaymentId) {
      try {
        await cancelUserPremiumCheckout(currentPaymentId);
      } catch {
        // Keep closing behavior even if cancellation persistence fails.
      }
    }

    if (standalone) {
      onClose?.();
      return;
    }

    onBack?.();
  };

  return (
    <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:flex-nowrap">
        {[
          { key: 1, label: 'Plan' },
          { key: 2, label: 'Payment' },
          { key: 3, label: 'Done' },
        ].map((step, index) => {
          const active = stepState >= step.key;
          const complete = stepState > step.key;
          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  active
                    ? 'border-[#588157] bg-[#588157] text-white dark:border-[#63b3ff] dark:bg-[#63b3ff] dark:text-[#0c1728]'
                    : 'border-[#c7d5c0] bg-[#f8fbf6] text-[#7b8a7f] dark:border-[#35506f] dark:bg-[#102139] dark:text-[#8fa8c4]'
                }`}>
                  {complete ? <CheckCircle2 className="h-4 w-4" /> : step.key}
                </span>
                <span className={`text-xs sm:text-sm font-medium ${active ? 'text-[#16324f] dark:text-white' : 'text-[#8194a8] dark:text-[#88a3bf]'}`}>
                  {step.label}
                </span>
              </div>
              {index < 2 ? <div className={`h-px flex-1 min-w-6 ${stepState > step.key ? 'bg-[#588157] dark:bg-[#63b3ff]' : 'bg-[#d8ddd1] dark:bg-[#24415f]'}`} /> : null}
            </React.Fragment>
          );
        })}
      </div>

      <div className={completedCheckout ? 'flex justify-center' : 'grid gap-4 lg:grid-cols-[1.25fr_0.75fr] lg:gap-5'}>
        <div className={`${completedCheckout ? 'hidden' : 'space-y-4'} rounded-[24px] border border-[#d6d3c9] dark:border-[#1e3657] bg-[#f8fbf6]/90 dark:bg-[#0f1d30] p-4 sm:p-5 shadow-[0_18px_48px_rgba(58,90,64,0.06)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)]`}>
          <div className="flex flex-col gap-3 border-b border-[#d6d3c9] dark:border-[#1e3657] pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#5f6f52] dark:text-[#9db6d0]">Selected plan</p>
              <p className="mt-1 text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-[#102a1b] dark:text-white">PHP {PREMIUM_PLAN.amount.toLocaleString()}</p>
              <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#9db6d0]">Premium monthly subscription</p>
            </div>
            <div className="rounded-2xl border border-[#bfd0af] dark:border-[#284463] bg-[#f4f8f1] dark:bg-[#12233b] px-3 py-2.5 text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#588157] dark:text-[#7dc4ff]">Status</p>
              <p className="text-sm font-semibold text-[#102a1b] dark:text-white">{verifying ? 'Verifying payment' : loading ? 'Processing payment' : success ? 'Activated' : 'Ready'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-[#102a1b] dark:text-white">Plan Summary</h2>
              <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#a6bfd8]">One clear subscription flow: premium access turns on only after payment is completed.</p>
            </div>

            <div className="rounded-[20px] border border-[#588157] bg-[linear-gradient(180deg,#f4f8f1,#eaf2e5)] p-3.5 text-left shadow-[0_16px_40px_rgba(88,129,87,0.16)] dark:border-[#63b3ff] dark:bg-[linear-gradient(180deg,#16304b,#102138)]">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#588157] dark:text-[#7dc4ff]" />
                <p className="text-base font-semibold text-[#102a1b] dark:text-white">{PREMIUM_PLAN.name}</p>
              </div>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#102a1b] dark:text-white">PHP {PREMIUM_PLAN.amount.toLocaleString()}</p>
              <p className="mt-1.5 text-xs leading-5 text-[#5f6f52] dark:text-[#b0c8e0]">{PREMIUM_PLAN.subtitle}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#7dc4ff]">Billed monthly</span>
                <span className="rounded-full bg-[#3a5a40] px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-[#63b3ff] dark:text-[#0c1728]">Selected</span>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#24415f] bg-[#f8fbf6] dark:bg-[#102138] p-3.5">
              <p className="text-sm font-semibold text-[#102a1b] dark:text-white">Premium includes</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {PREMIUM_PLAN.features.map(({ text }) => (
                  <span
                    key={text}
                    className="rounded-full border border-[#bfd0af] bg-[#f8fbf6] px-2.5 py-1 text-[11px] font-medium text-[#344e41] dark:border-[#274463] dark:bg-[#0f2137] dark:text-[#dcecff]"
                  >
                    {text}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#24415f] bg-[#f8fbf6] dark:bg-[#102138] p-3.5 space-y-1">
              <p className="text-sm text-[#5f6f52] dark:text-[#a6bfd8]">Premium will be activated for</p>
              <p className="text-lg font-semibold text-[#102a1b] dark:text-white">{displayName}</p>
              <p className="text-sm text-[#344e41] dark:text-[#dcecff]">{user?.email || 'No email on file'}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <h2 className="text-xl font-semibold text-[#102a1b] dark:text-white">Payment Methods</h2>
              <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#a6bfd8]">Choose the payment method you trust and complete the secure checkout.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_PROVIDERS.map((provider) => {
                const Icon = provider.icon;
                const selected = paymentMethod === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setPaymentMethod(provider.id)}
                    className={`rounded-[20px] border p-3.5 text-left transition-colors ${
                      selected
                        ? 'border-[#588157] bg-[#eef6ee] shadow-[0_12px_30px_rgba(88,129,87,0.1)] dark:border-[#63b3ff] dark:bg-[#14304d]'
                        : 'border-[#d6d3c9] bg-[#fbfcfa] hover:bg-[#f5f5f2] dark:border-[#24415f] dark:bg-[#102138] dark:hover:bg-[#132844]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl border border-[#d6d3c9] dark:border-[#294664] bg-[#f8fbf6] dark:bg-[#0f2139] p-2">
                          <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#7dc4ff]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#102a1b] dark:text-white">{provider.id === 'stripe' ? 'Stripe (Card)' : 'PayPal'}</p>
                          <p className="mt-1 text-xs leading-5 text-[#5f6f52] dark:text-[#a6bfd8]">{provider.description}</p>
                        </div>
                      </div>
                      <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                        selected
                          ? 'border-[#588157] bg-[#588157] text-white dark:border-[#63b3ff] dark:bg-[#63b3ff] dark:text-[#0c1728]'
                          : 'border-[#c8d6e4] dark:border-[#345170]'
                      }`}>
                        {selected ? <BadgeCheck className="h-3.5 w-3.5" /> : null}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#24415f] bg-[#f5f5f2] dark:bg-[#0f2137] p-3.5 text-sm text-[#344e41] dark:text-[#d5e6f5]">
            Premium activates only after payment is confirmed. If checkout is cancelled, your account stays on the free plan.
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-[#e3ebf3] dark:border-[#1e3657] pt-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-2xl border border-[#a3b18a] px-5 py-3 text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#294664] dark:text-white dark:hover:bg-[#17304d] sm:w-auto"
            >
              {standalone ? 'Cancel' : 'Back to plans'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || verifying}
              className="w-full rounded-2xl bg-[#3a5a40] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#344e41] disabled:opacity-60 dark:bg-[#63b3ff] dark:text-[#0c1728] dark:hover:bg-[#83c5ff] sm:w-auto sm:min-w-[240px]"
            >
              {loading ? 'Processing payment...' : `Pay PHP ${PREMIUM_PLAN.amount.toLocaleString()} with ${selectedProvider.label}`}
            </button>
            {isLocalhostBypassAvailable ? (
              <button
                type="button"
                onClick={handleSampleSuccess}
                disabled={loading}
                className="w-full rounded-2xl border border-dashed border-[#588157] bg-[#f4f8f1] px-5 py-3 font-semibold text-[#3a5a40] transition-colors hover:bg-[#ecf4e7] disabled:opacity-60 dark:border-[#63b3ff] dark:bg-[#102138] dark:text-[#9ed3ff] dark:hover:bg-[#16304b] sm:w-auto"
              >
                Sample success
              </button>
            ) : null}
          </div>
        </div>

        {completedCheckout ? (
          <div className="w-full max-w-2xl space-y-3 rounded-[24px] border border-[#d6d3c9] dark:border-[#1e3657] bg-[#f8fbf6]/92 dark:bg-[#0f1d30] p-4 sm:p-5 shadow-[0_18px_48px_rgba(58,90,64,0.06)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#588157] dark:text-[#7dc4ff]">Merchant summary</p>
              <h2 className="mt-1 text-xl font-semibold text-[#102a1b] dark:text-white">
                {completedProvider?.merchantName || 'KapIT Payment Receipt'}
              </h2>
              <p className="mt-2 text-sm text-[#5f6f52] dark:text-[#a6bfd8]">
                Your payment is verified and premium access is now active under the paid plan below.
              </p>
            </div>

            <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#24415f] bg-[#f8fbf6] dark:bg-[#102138] p-4 space-y-3 text-sm">
              <div>
                <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Paid plan</p>
                <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout.planName}</p>
              </div>
              <div>
                <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Plan amount</p>
                <p className="font-semibold text-[#102a1b] dark:text-white">PHP {Number(completedCheckout.amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Billing cycle</p>
                <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout.billingCycle}</p>
              </div>
              <div>
                <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Payment provider</p>
                <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout.paymentMethod}</p>
              </div>
              <div>
                <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Payment status</p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">Verified and paid</p>
              </div>
              <div>
                <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Payment record</p>
                <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout.reference}</p>
              </div>
              <div>
                <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Receiving account</p>
                <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout.accountHint}</p>
              </div>
              <div>
                <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Activated for</p>
                <p className="font-semibold text-[#102a1b] dark:text-white">{displayName}</p>
              </div>
            </div>

            <div className="flex border-t border-[#e3ebf3] pt-3 dark:border-[#1e3657]">
              <button
                type="button"
                onClick={standalone ? onClose : onBack}
                className="w-full rounded-2xl bg-[#3a5a40] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#63b3ff] dark:text-[#0c1728] dark:hover:bg-[#83c5ff] sm:ml-auto sm:w-auto sm:min-w-[150px]"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function UserPremiumPopup({ isOpen, onClose, user, onOpenMerchantWindow }) {
  if (!isOpen) return null;

  const isPremium = !!user?.isPremium;

  return (
    <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center p-2 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
        <div className="flex max-h-[min(92vh,960px)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-[#a3b18a] bg-[#f8fbf6] shadow-[0_30px_80px_rgba(0,0,0,0.18)] dark:border-[#2a4a6f] dark:bg-[#162842] dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:rounded-[28px]">
          <div className="flex items-start justify-between gap-4 border-b border-[#a3b18a] px-4 py-4 sm:px-5 dark:border-[#2a4a6f]">
            <div>
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-[#102a1b] dark:text-white">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-[#588157] dark:text-[#7fd0ee]" />
                Premium Plans
              </h2>
              <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">Choose the plan that fits your job application needs.</p>
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

          <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {isPremium ? (
              <div className="mb-4 rounded-[20px] border border-[#bfd0af] bg-[linear-gradient(180deg,#f4f8f1,#ebf4e7)] px-4 py-3 text-sm text-[#2f4e39] dark:border-[#2f5a78] dark:bg-[linear-gradient(180deg,#14304d,#102138)] dark:text-[#dcecff]">
                You're already on the Premium plan.
              </div>
            ) : null}
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onUpgrade={onOpenMerchantWindow}
                  disabled={Boolean(isPremium && plan.highlighted)}
                  buttonLabel={isPremium && plan.highlighted ? "You're on this plan" : plan.cta}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UserPremiumPaymentWindow({ user, onUpgrade }) {
  const handleClose = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628] px-3 py-3 text-[#344e41] dark:text-white transition-colors duration-300 sm:px-4 sm:py-4">
      <div className="min-h-[calc(100vh-1.5rem)] flex items-center justify-center sm:min-h-[calc(100vh-2rem)]">
        <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#a3b18a] dark:border-[#1e3657] bg-[rgba(255,255,255,0.88)] dark:bg-[rgba(12,24,40,0.9)] backdrop-blur-2xl shadow-[0_30px_90px_rgba(58,90,64,0.14)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-[#ccd5c0] dark:border-[#1f3857] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,240,0.78))] dark:bg-[linear-gradient(180deg,rgba(18,35,58,0.95),rgba(10,21,35,0.82))] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#588157] dark:text-[#7dc4ff]">Secure checkout</p>
                <h1 className="mt-1.5 text-2xl sm:text-[2rem] font-semibold tracking-tight text-[#102a1b] dark:text-white">Complete Premium Payment</h1>
                <p className="mt-1.5 max-w-2xl text-sm text-[#5f6f52] dark:text-[#a6bfd8]">Choose a payment method and we'll activate premium only after payment is successfully confirmed.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#ccd5c0] dark:border-[#294664] bg-[#f8fbf6]/80 dark:bg-[#11233a] text-[#5f6f52] dark:text-[#d3e3f4] hover:bg-[#f8fbf6] dark:hover:bg-[#17304d] transition-colors"
                aria-label="Close premium payment popup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <MerchantCheckout
            user={user}
            onBack={handleClose}
            onClose={handleClose}
            onConfirmUpgrade={onUpgrade}
            standalone
          />
        </div>
      </div>
    </div>
  );
}

export { USER_PREMIUM_PAYMENT_PATH, USER_PREMIUM_PAYMENT_SUCCESS };
