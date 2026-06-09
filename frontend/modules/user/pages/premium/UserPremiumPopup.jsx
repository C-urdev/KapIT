import React from 'react';
import { BadgeCheck, Brain, Check, CheckCircle2, CreditCard, Crown, Image as ImageIcon, MessageCircle, Sparkles, X } from 'lucide-react';
import {
  getUserPremiumPaymentProviders,
  createUserPremiumCheckoutSession,
  captureUserPremiumPayPalCheckout,
  cancelUserPremiumCheckout,
  completeUserPremiumLocalBypass,
} from '@sharedServices/authService';
import { resolveCheckoutUrls } from '@sharedUtils/checkoutUrlResolver';
import { getPaymentErrorMessageForUser } from '@sharedUtils/paymentErrorMessages';

const USER_PREMIUM_PAYMENT_PATH = '/premium/payment';
const USER_PREMIUM_PAYMENT_SUCCESS = 'user-premium-payment-success';
const USER_PREMIUM_PAYMENT_STORAGE_KEY = 'kapit:user-premium-payment-success';

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
    id: 'paypal',
    label: 'PayPal',
    merchantName: 'KapIT PayPal Merchant',
    merchantCode: 'KAPIT-PAYPAL-314',
    accountHint: 'merchant checkout via PayPal',
    description: 'Accept PayPal wallet and supported guest checkout payments.',
    icon: CreditCard,
  },
];

const localPaymentBypassEnabled = import.meta.env.VITE_ENABLE_LOCAL_PAYMENT_BYPASS === 'true';

function PlanCard({ plan, onUpgrade, buttonLabel, disabled = false }) {
  const highlighted = Boolean(plan.highlighted);

  return (
    <div
      className={`flex min-h-0 flex-col rounded-[20px] border p-4 sm:min-h-[520px] sm:p-5 transition-colors ${
        highlighted
          ? 'border-[#588157] bg-[linear-gradient(180deg,#f4f8f1,#eaf2e5)] shadow-[0_20px_60px_rgba(88,129,87,0.16)] dark:border-[#6f9b74]/45 dark:bg-[linear-gradient(180deg,#17314a,#202428)] dark:shadow-[0_20px_60px_rgba(11,26,45,0.42)]'
          : 'border-[#d6d3c9] bg-[linear-gradient(180deg,#ffffff,#f5f5f2)] shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-[#444d57] dark:bg-[linear-gradient(180deg,#22272b,#202428)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)]'
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          {highlighted ? <Crown className="h-5 w-5 text-[#588157] dark:text-[#f0c766]" /> : null}
          <h3 className="text-[1.85rem] sm:text-[2rem] font-medium tracking-tight text-[#102a1b] dark:text-white">{plan.name}</h3>
        </div>
        <div className="mt-5 flex items-start gap-2 sm:mt-6 sm:gap-3 text-[#102a1b] dark:text-white">
          <span className={`pt-1.5 text-lg sm:pt-2 sm:text-xl ${highlighted ? 'text-[#3a5a40]/80 dark:text-[#d7eef9]' : 'text-[#344e41]/70 dark:text-[#d0d7dd]'}`}>PHP</span>
          <span className="text-[3.3rem] sm:text-5xl font-semibold leading-none">{plan.amount}</span>
          <span className={`whitespace-pre-line pt-1.5 text-sm leading-4 sm:pt-2 ${highlighted ? 'text-[#3a5a40]/90 dark:text-[#d7eef9]' : 'text-[#344e41]/85 dark:text-[#d0d7dd]'}`}>{plan.unit}</span>
        </div>
        <p className={`mt-5 text-[0.98rem] sm:mt-6 sm:text-base ${highlighted ? 'text-[#2f4e39] dark:text-[#eceff2]' : 'text-[#344e41] dark:text-[#d0d7dd]'}`}>{plan.subtitle}</p>
      </div>

      <button
        type="button"
        onClick={highlighted && !disabled ? onUpgrade : undefined}
        disabled={disabled}
        className={`mt-6 w-full rounded-full border px-5 py-3 text-sm font-medium transition-colors sm:mt-8 sm:px-6 ${
          highlighted
            ? disabled
              ? 'border-[#8ea786] bg-[#8ea786] text-white cursor-default dark:border-[#4d7296] dark:bg-[#4d7296] dark:text-white'
              : 'border-[#3a5a40] bg-[#3a5a40] text-white hover:bg-[#344e41] dark:border-[#6f9b74] dark:bg-[#6f9b74] dark:text-[#121416] dark:hover:bg-[#82ad86]'
            : 'border-[#a3b18a] bg-transparent text-[#344e41] hover:bg-[#eef6ee] hover:text-[#102a1b] dark:border-[#444d57] dark:text-[#eceff2] dark:hover:bg-[#353c44] dark:hover:text-white'
        }`}
      >
        {buttonLabel || plan.cta}
      </button>

      <div className="mt-6 space-y-3.5 sm:mt-8 sm:space-y-4">
        {plan.features.map(({ icon: Icon, text }) => (
          <div key={text} className={`flex items-start gap-3 ${highlighted ? 'text-[#2f4e39] dark:text-[#eceff2]' : 'text-[#344e41] dark:text-[#eceff2]'}`}>
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#588157] dark:text-[#f0c766]" />
            <span className="text-[0.95rem] leading-6 sm:text-[0.97rem]">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const notifyOpener = (payload) => {
  try {
    const snapshot = {
      type: USER_PREMIUM_PAYMENT_SUCCESS,
      ...payload,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(USER_PREMIUM_PAYMENT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Best effort only; postMessage remains the primary sync channel.
  }

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: USER_PREMIUM_PAYMENT_SUCCESS, ...payload }, window.location.origin);
  }
};

function MerchantCheckout({ user, onBack, onClose, onConfirmUpgrade, standalone = false }) {
  const [paymentMethod, setPaymentMethod] = React.useState('paypal');
  const [providerAvailability, setProviderAvailability] = React.useState({
    paypal: { enabled: true, label: 'PayPal', reason: '' },
  });
  const [currentPaymentId, setCurrentPaymentId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [checkoutFallbackUrls, setCheckoutFallbackUrls] = React.useState([]);
  const [completedCheckout, setCompletedCheckout] = React.useState(null);
  const handledReturnRef = React.useRef(false);

  const selectedProvider = PAYMENT_PROVIDERS.find((provider) => provider.id === paymentMethod) || PAYMENT_PROVIDERS[0];
  const selectedProviderState = providerAvailability?.[selectedProvider.id] || { enabled: true, reason: '' };
  const displayName = user?.fullName || user?.name || user?.username || 'User account';
  const isLocalhostBypassAvailable =
    localPaymentBypassEnabled && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const stepState = success ? 3 : loading || verifying ? 2 : 1;
  const completedProvider = PAYMENT_PROVIDERS.find((provider) => provider.id === completedCheckout?.providerId) || null;
  const paidAt = completedCheckout?.paidAt ? new Date(completedCheckout.paidAt).toLocaleString() : '';
  const completedAmount = Number(completedCheckout?.amount || 0);
  const completedPlanName = completedCheckout?.planName || PREMIUM_PLAN.name;
  const completedBillingCycle = completedCheckout?.billingCycle || 'monthly';

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
        if (checkout === 'paypal-success') {
          const orderId = params.get('token');
          if (!orderId || !paymentId) {
            throw new Error('Missing PayPal order details. Please try the payment again.');
          }

          const data = await captureUserPremiumPayPalCheckout({ paymentId, orderId });
          if (data?.user) {
            await onConfirmUpgrade?.(data.user);
            notifyOpener({ updates: { isPremium: Boolean(data.user?.isPremium) } });
          }
          setCompletedCheckout({
            providerId: 'paypal',
            amount: Number(data?.payment?.amount || PREMIUM_PLAN.amount),
            planName: data?.payment?.plan_label || PREMIUM_PLAN.name,
            billingCycle: data?.payment?.plan_duration || 'monthly',
            paymentMethod: 'PayPal',
            reference: data?.payment?.provider_payment_id || data?.payment?.provider_checkout_id || paymentId,
            accountHint: PAYMENT_PROVIDERS.find((provider) => provider.id === 'paypal')?.accountHint || '',
            paymentId: data?.payment?.id || paymentId,
            providerReference: data?.payment?.provider_payment_id || data?.payment?.provider_checkout_id || paymentId,
            paidAt: data?.payment?.paid_at || '',
          });
          setSuccess('PayPal payment verified. Your premium access is now active.');
          cleanupUrl();
          return;
        }

        throw new Error('Unknown checkout return state.');
      } catch (verificationError) {
        setError(getPaymentErrorMessageForUser(verificationError, 'Payment verification failed. Please try again.'));
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
    setCheckoutFallbackUrls([]);

    try {
      if (!selectedProviderState.enabled) {
        throw new Error(`${selectedProvider.label} is not available yet. Configure it in the server environment first.`);
      }

      const data = await createUserPremiumCheckoutSession({
        provider: paymentMethod,
      });

      const checkoutUrls = resolveCheckoutUrls(data);
      if (!checkoutUrls.length) {
        throw new Error('The payment provider did not return a checkout URL.');
      }

      const primaryCheckoutUrl = checkoutUrls[0];
      setCurrentPaymentId(data.paymentId || '');
      setCheckoutFallbackUrls(checkoutUrls.slice(1));

      const checkoutWindow = window.open(primaryCheckoutUrl, 'kapit-paypal-checkout');
      if (checkoutWindow && !checkoutWindow.closed) {
        setLoading(false);
        setSuccess('PayPal checkout opened in a new tab. Complete payment there, then return here.');
        return;
      }

      window.location.assign(primaryCheckoutUrl);
    } catch (checkoutError) {
      setLoading(false);
      setError(getPaymentErrorMessageForUser(checkoutError, 'Unable to start the payment flow.'));
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
        notifyOpener({ updates: { isPremium: Boolean(data.user?.isPremium) } });
      }
      setCurrentPaymentId(data?.payment?.id || '');
      setCompletedCheckout({
        providerId: paymentMethod,
        amount: Number(data?.payment?.amount || PREMIUM_PLAN.amount),
        planName: PREMIUM_PLAN.name,
        billingCycle: 'monthly',
        paymentMethod: selectedProvider.label,
        reference: data?.payment?.provider_payment_id || data?.payment?.provider_checkout_id || `sample-${Date.now()}`,
        accountHint: selectedProvider.accountHint,
        paymentId: data?.payment?.id || '',
        providerReference: data?.payment?.provider_payment_id || data?.payment?.provider_checkout_id || `sample-${Date.now()}`,
        paidAt: data?.payment?.paid_at || '',
      });
      setSuccess('Local sample payment completed and your premium access is now active.');
    } catch (upgradeError) {
      setError(getPaymentErrorMessageForUser(upgradeError, 'Unable to complete the local sample payment.'));
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
    <div className="overflow-y-auto bg-[linear-gradient(180deg,#f7faf5_0%,#f3f7ef_100%)] dark:bg-[linear-gradient(180deg,#11161c_0%,#161d24_100%)] px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-5 flex flex-wrap items-center gap-2 sm:flex-nowrap rounded-2xl border border-[#d6e1cf] bg-white/80 px-3 py-3 shadow-[0_10px_28px_rgba(16,42,27,0.06)] dark:border-[#304356] dark:bg-[#1b2128]">
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
                    ? 'border-[#2f6b4f] bg-[#2f6b4f] text-white dark:border-[#82ad86] dark:bg-[#82ad86] dark:text-[#121416]'
                    : 'border-[#c7d5c0] bg-[#f8fbf6] text-[#7b8a7f] dark:border-[#35506f] dark:bg-[#102139] dark:text-[#8fa8c4]'
                }`}>
                  {complete ? <CheckCircle2 className="h-4 w-4" /> : step.key}
                </span>
                <span className={`text-xs sm:text-sm font-medium ${active ? 'text-[#16324f] dark:text-white' : 'text-[#8194a8] dark:text-[#88a3bf]'}`}>
                  {step.label}
                </span>
              </div>
              {index < 2 ? <div className={`h-px flex-1 min-w-6 ${stepState > step.key ? 'bg-[#2f6b4f] dark:bg-[#82ad86]' : 'bg-[#d8ddd1] dark:bg-[#444d57]'}`} /> : null}
            </React.Fragment>
          );
        })}
      </div>

      <div className={completedCheckout ? 'flex justify-center' : 'grid gap-4'}>
        <div className={`${completedCheckout ? 'hidden' : 'space-y-5'} rounded-[24px] border border-[#d6e1cf] dark:border-[#3a4b5e] bg-white/92 dark:bg-[#1a1f26] p-4 sm:p-6 shadow-[0_18px_48px_rgba(16,42,27,0.08)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]`}>
          <div className="flex flex-col gap-3 border-b border-[#d6d3c9] dark:border-[#444d57] pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-[#5f6f52] dark:text-[#b3bcc5]">Selected plan</p>
              <p className="mt-1 text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-[#102a1b] dark:text-white">PHP {PREMIUM_PLAN.amount.toLocaleString()}</p>
              <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#b3bcc5]">Premium monthly subscription</p>
            </div>
            <div className="rounded-2xl border border-[#bfd0af] dark:border-[#284463] bg-[#f4f8f1] dark:bg-[#12233b] px-3 py-2.5 text-right">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#588157] dark:text-[#e2b94d]">Status</p>
              <p className="text-sm font-semibold text-[#102a1b] dark:text-white">{verifying ? 'Verifying payment' : loading ? 'Processing payment' : success ? 'Activated' : 'Ready'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#102a1b] dark:text-white">Plan Summary</h2>
            </div>

            <div className="rounded-[20px] border border-[#76a07b] bg-[linear-gradient(165deg,#f6fbf4,#e9f2e6)] p-4 text-left shadow-[0_16px_40px_rgba(58,90,64,0.14)] dark:border-[#82ad86] dark:bg-[linear-gradient(180deg,#31363d,#202428)]">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#588157] dark:text-[#e2b94d]" />
                <p className="text-base font-semibold text-[#102a1b] dark:text-white">{PREMIUM_PLAN.name}</p>
              </div>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#102a1b] dark:text-white">PHP {PREMIUM_PLAN.amount.toLocaleString()}</p>
              <p className="mt-1.5 text-xs leading-5 text-[#5f6f52] dark:text-[#b0c8e0]">{PREMIUM_PLAN.subtitle}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#e2b94d]">Billed monthly</span>
                <span className="rounded-full bg-[#3a5a40] px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-[#82ad86] dark:text-[#121416]">Selected</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#102a1b] dark:text-white">Premium includes</p>
              <div className="mt-3 space-y-2">
                {PREMIUM_PLAN.features.map(({ text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2 rounded-xl border border-[#bfd0af] bg-[#f8fbf6] px-3 py-2.5 text-xs font-medium text-[#344e41] dark:border-[#4b5560] dark:bg-[#1f2328] dark:text-[#eceff2]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#588157] dark:text-[#82ad86]" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="space-y-2.5">
            <div>
              <h2 className="text-xl font-semibold text-[#102a1b] dark:text-white">Payment Methods</h2>
              <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#c0c8d0]">Choose the payment method you trust and complete the secure checkout.</p>
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
                    className={`rounded-[20px] border p-4 text-left transition-all duration-200 ${
                      selected
                        ? 'border-[#588157] bg-[#eef6ee] shadow-[0_12px_30px_rgba(88,129,87,0.14)] dark:border-[#82ad86] dark:bg-[#2a2f35]'
                        : 'border-[#d6d3c9] bg-[#fbfcfa] hover:bg-[#f5f5f2] hover:-translate-y-[1px] dark:border-[#444d57] dark:bg-[#202428] dark:hover:bg-[#132844]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl border border-[#d6d3c9] dark:border-[#4b5560] bg-[#f8fbf6] dark:bg-[#1a1d20] p-2">
                          <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#e2b94d]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#102a1b] dark:text-white">PayPal</p>
                          <p className="mt-1 text-xs leading-5 text-[#5f6f52] dark:text-[#c0c8d0]">{provider.description}</p>
                        </div>
                      </div>
                      <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                        selected
                          ? 'border-[#588157] bg-[#588157] text-white dark:border-[#82ad86] dark:bg-[#82ad86] dark:text-[#121416]'
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

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {success}
            </div>
          )}
          {checkoutFallbackUrls.length ? (
            <div className="rounded-[22px] border border-[#bfd0af] dark:border-[#4b5560] bg-[#f8fbf6] dark:bg-[#202428] p-4 text-sm text-[#344e41] dark:text-[#eceff2]">
              <p>If PayPal does not load, open this alternate secure checkout link:</p>
              <a
                href={checkoutFallbackUrls[0]}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 font-semibold text-[#2f6b4f] dark:text-[#9fd7a6] underline underline-offset-2"
              >
                Open alternate PayPal checkout
              </a>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-[#e3ebf3] dark:border-[#444d57] pt-4 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-2xl border border-[#a3b18a] px-5 py-3 text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#4b5560] dark:text-white dark:hover:bg-[#31363d] sm:w-auto"
            >
              {standalone ? 'Cancel' : 'Back to plans'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || verifying}
              className="w-full rounded-2xl bg-[linear-gradient(180deg,#3f6c46,#2f5a36)] px-6 py-3 font-semibold text-white transition-all hover:brightness-105 disabled:opacity-60 dark:bg-[#82ad86] dark:text-[#121416] dark:hover:bg-[#9bc49f] sm:w-auto sm:min-w-[260px]"
            >
              {loading ? 'Processing payment...' : `Pay PHP ${PREMIUM_PLAN.amount.toLocaleString()} with ${selectedProvider.label}`}
            </button>
            {isLocalhostBypassAvailable ? (
              <button
                type="button"
                onClick={handleSampleSuccess}
                disabled={loading}
                className="w-full rounded-2xl border border-dashed border-[#588157] bg-[#f4f8f1] px-5 py-3 font-semibold text-[#3a5a40] transition-colors hover:bg-[#ecf4e7] disabled:opacity-60 dark:border-[#82ad86] dark:bg-[#202428] dark:text-[#d0d7dd] dark:hover:bg-[#31363d] sm:w-auto"
              >
                Sample success
              </button>
            ) : null}
          </div>
        </div>

        {completedCheckout ? (
          <div className="w-full max-w-4xl space-y-4 rounded-[24px] border border-[#d6d3c9] dark:border-[#444d57] bg-[#f8fbf6]/92 dark:bg-[#1b1f23] p-4 sm:p-5 shadow-[0_18px_48px_rgba(58,90,64,0.06)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#588157] dark:text-[#e2b94d]">Post payment information</p>
              <h2 className="mt-1 text-xl font-semibold text-[#102a1b] dark:text-white">
                {completedProvider?.merchantName || 'KapIT Payment Receipt'}
              </h2>
              <p className="mt-2 text-sm text-[#5f6f52] dark:text-[#c0c8d0]">
                Payment is complete. Step 3 is now done and premium access is active.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#444d57] bg-[#f8fbf6] dark:bg-[#202428] p-4 space-y-3 text-sm">
                <h3 className="text-base font-semibold text-[#102a1b] dark:text-white">What You Paid For</h3>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Paid plan</p>
                  <p className="font-semibold text-[#102a1b] dark:text-white">{completedPlanName}</p>
                </div>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Plan amount</p>
                  <p className="font-semibold text-[#102a1b] dark:text-white">PHP {completedAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Billing cycle</p>
                  <p className="font-semibold text-[#102a1b] dark:text-white">{completedBillingCycle}</p>
                </div>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Activated for</p>
                  <p className="font-semibold text-[#102a1b] dark:text-white">{displayName}</p>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#444d57] bg-[#f8fbf6] dark:bg-[#202428] p-4 space-y-3 text-sm">
                <h3 className="text-base font-semibold text-[#102a1b] dark:text-white">Billing Information</h3>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Payment provider</p>
                  <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Payment status</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">Verified and paid</p>
                </div>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Payment record</p>
                  <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout.paymentId || completedCheckout.reference || '--'}</p>
                </div>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Provider reference</p>
                  <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout.providerReference || completedCheckout.reference || '--'}</p>
                </div>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Receiving account</p>
                  <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout.accountHint}</p>
                </div>
                <div>
                  <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Paid on</p>
                  <p className="font-semibold text-[#102a1b] dark:text-white">{paidAt || 'Just now'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#444d57] bg-[#f8fbf6] dark:bg-[#202428] p-4">
              <p className="text-sm font-semibold text-[#102a1b] dark:text-white">Premium includes</p>
              <ul className="mt-2.5 space-y-1.5 text-sm text-[#344e41] dark:text-[#eceff2]">
                {PREMIUM_PLAN.features.map(({ text }) => (
                  <li key={`premium-done-feature-${text}`} className="flex items-start gap-2">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#588157] dark:bg-[#82ad86]" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
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
        <div className="flex max-h-[min(92vh,960px)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-[#a3b18a] bg-[#f8fbf6] shadow-[0_30px_80px_rgba(0,0,0,0.18)] dark:border-[#444d57] dark:bg-[#22272b] dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:rounded-[28px]">
          <div className="flex items-start justify-between gap-4 border-b border-[#a3b18a] px-4 py-4 sm:px-5 dark:border-[#444d57]">
            <div>
              <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-semibold text-[#102a1b] dark:text-white">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-[#588157] dark:text-[#f0c766]" />
                Premium Plans
              </h2>
              <p className="mt-1 text-sm text-[#344e41] dark:text-[#d0d7dd]">Choose the plan that fits your job application needs.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#344e41] transition-colors hover:bg-[#f5f5f2] hover:text-[#102a1b] dark:text-[#d0d7dd] dark:hover:bg-[#353c44] dark:hover:text-white"
              aria-label="Close premium popup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {isPremium ? (
              <div className="mb-4 rounded-[20px] border border-[#bfd0af] bg-[linear-gradient(180deg,#f4f8f1,#ebf4e7)] px-4 py-3 text-sm text-[#2f4e39] dark:border-[#2f5a78] dark:bg-[linear-gradient(180deg,#2a2f35,#202428)] dark:text-[#eceff2]">
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
  React.useEffect(() => {
    const handleNestedCheckoutMessage = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event?.data?.type !== USER_PREMIUM_PAYMENT_SUCCESS) {
        return;
      }

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(event.data, window.location.origin);
      }
    };

    window.addEventListener('message', handleNestedCheckoutMessage);
    return () => {
      window.removeEventListener('message', handleNestedCheckoutMessage);
    };
  }, []);

  const handleClose = () => {
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#121416] px-3 py-3 text-[#344e41] dark:text-white transition-colors duration-300 sm:px-4 sm:py-4">
      <div className="min-h-[calc(100vh-1.5rem)] flex items-center justify-center sm:min-h-[calc(100vh-2rem)]">
        <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#a3b18a] dark:border-[#444d57] bg-[rgba(255,255,255,0.88)] dark:bg-[rgba(12,24,40,0.9)] backdrop-blur-2xl shadow-[0_30px_90px_rgba(58,90,64,0.14)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-[#ccd5c0] dark:border-[#1f3857] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,240,0.78))] dark:bg-[linear-gradient(180deg,rgba(18,35,58,0.95),rgba(10,21,35,0.82))] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#588157] dark:text-[#e2b94d]">Secure checkout</p>
                <h1 className="mt-1.5 text-2xl sm:text-[2rem] font-semibold tracking-tight text-[#102a1b] dark:text-white">Complete Premium Payment</h1>
                <p className="mt-1.5 max-w-2xl text-sm text-[#5f6f52] dark:text-[#c0c8d0]">Choose a payment method and we'll activate premium only after payment is successfully confirmed.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#ccd5c0] dark:border-[#4b5560] bg-[#f8fbf6]/80 dark:bg-[#2a2f35] text-[#5f6f52] dark:text-[#d3e3f4] hover:bg-[#f8fbf6] dark:hover:bg-[#31363d] transition-colors"
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

export { USER_PREMIUM_PAYMENT_PATH, USER_PREMIUM_PAYMENT_SUCCESS, USER_PREMIUM_PAYMENT_STORAGE_KEY };
