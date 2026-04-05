import React from 'react';
import { BadgeCheck, CheckCircle2, ChevronDown, CreditCard, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { companyAPI } from '@companyFeatures/companyAPI';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import { JOB_POST_PLANS, PAYMENT_PROVIDERS, PLAN_FEATURES } from '@companyFeatures/companyPaymentCatalog';

const STORAGE_KEY = 'company-post-job-draft';
const PAYMENT_MESSAGE_TYPE = 'company-post-job-payment-success';
const PAYMENT_CANCEL_MESSAGE_TYPE = 'company-post-job-payment-cancelled';

const sanitizeDraft = (draft) => ({
  jobId: draft?.jobId == null ? null : Number(draft.jobId),
  title: String(draft?.title || '').trim(),
  description: String(draft?.description || '').trim(),
  salary: String(draft?.salary || '').trim(),
  location: String(draft?.location || '').trim(),
  type: String(draft?.type || '').trim(),
  skills: Array.isArray(draft?.skills) ? draft.skills : [],
});

const notifyOpener = (type, payload = {}) => {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type, ...payload }, window.location.origin);
  }
};

export default function CompanyPostJobPaymentPage() {
  const [draft, setDraft] = React.useState(null);
  const [plans, setPlans] = React.useState(JOB_POST_PLANS);
  const [selectedPlanId, setSelectedPlanId] = React.useState('1-month');
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
  const paymentCompletedRef = React.useRef(false);
  const isLocalhostBypassAvailable = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setError('No pending job draft was found. Return to the posting form and prepare the job first.');
        return;
      }

      const parsed = sanitizeDraft(JSON.parse(raw));
      if (!parsed.title || !parsed.description) {
        setError('The saved draft is incomplete. Return to the posting form before continuing.');
        return;
      }

      setDraft(parsed);
    } catch {
      setError('Failed to load the saved job draft.');
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const loadPaymentMeta = async () => {
      try {
        const [plansData, providersData] = await Promise.all([
          companyAPI.getPaymentPlans(),
          companyAPI.getPaymentProviders(),
        ]);

        if (!cancelled && Array.isArray(plansData?.plans) && plansData.plans.length) {
          setPlans(plansData.plans);
        }

        if (!cancelled && providersData?.providers) {
          setProviderAvailability(providersData.providers);
          const firstEnabled = PAYMENT_PROVIDERS.find((provider) => providersData.providers?.[provider.id]?.enabled);
          if (firstEnabled) {
            setPaymentMethod((current) => (providersData.providers?.[current]?.enabled ? current : firstEnabled.id));
          }
        }
      } catch {
        // Keep the local fallback catalog if the API is unavailable.
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
      window.history.replaceState({}, document.title, COMPANY_PATHS.postJobPayment);
    };

    const handleProviderReturn = async () => {
      if (checkout === 'cancelled') {
        if (paymentId) {
          try {
            await companyAPI.cancelPaymentCheckout(paymentId);
          } catch {
            // Keep the draft even if cancellation persistence fails.
          }
        }
        setError('Payment was cancelled. Your job draft is still saved and unpublished.');
        notifyOpener(PAYMENT_CANCEL_MESSAGE_TYPE, { keepDraft: true });
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

          const data = await companyAPI.verifyStripeCheckout({ paymentId, sessionId });
          paymentCompletedRef.current = true;
          window.localStorage.removeItem(STORAGE_KEY);
          setCompletedCheckout({
            providerId: 'stripe',
            payment: data?.payment || null,
            job: data?.job || null,
          });
          setSuccess('Stripe payment verified and your job was published successfully.');
          notifyOpener(PAYMENT_MESSAGE_TYPE, { job: data?.job || null });
          cleanupUrl();
          return;
        }

        if (checkout === 'paypal-success') {
          const orderId = params.get('token');
          if (!orderId || !paymentId) {
            throw new Error('Missing PayPal order details. Please try the payment again.');
          }

          const data = await companyAPI.capturePayPalCheckout({ paymentId, orderId });
          paymentCompletedRef.current = true;
          window.localStorage.removeItem(STORAGE_KEY);
          setCompletedCheckout({
            providerId: 'paypal',
            payment: data?.payment || null,
            job: data?.job || null,
          });
          setSuccess('PayPal payment verified and your job was published successfully.');
          notifyOpener(PAYMENT_MESSAGE_TYPE, { job: data?.job || null });
          cleanupUrl();
          return;
        }

        throw new Error('Unknown checkout return state.');
      } catch (err) {
        setError(err?.message || 'Payment verification failed. Your draft is still saved and unpublished.');
        cleanupUrl();
      } finally {
        setVerifying(false);
      }
    };

    handleProviderReturn();
  }, []);

  const selectedProvider = PAYMENT_PROVIDERS.find((provider) => provider.id === paymentMethod) || PAYMENT_PROVIDERS[0];
  const selectedProviderState = providerAvailability?.[selectedProvider.id] || { enabled: true, reason: '' };
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
  const stepState = success ? 3 : verifying || loading ? 2 : 1;
  const completedProvider = PAYMENT_PROVIDERS.find((provider) => provider.id === completedCheckout?.payment?.provider || provider.id === completedCheckout?.providerId) || null;
  const completedPlan = plans.find((plan) => plan.id === completedCheckout?.payment?.plan_id) || JOB_POST_PLANS.find((plan) => plan.id === completedCheckout?.payment?.plan_id) || null;
  const paidPlanLabel = completedCheckout?.payment?.plan_label || completedPlan?.label || '--';
  const paidPlanDuration = completedCheckout?.payment?.plan_duration || completedPlan?.durationLabel || '--';
  const paidAmount = Number(completedCheckout?.payment?.amount || completedPlan?.price || 0);
  const paidAt = completedCheckout?.payment?.paid_at
    ? new Date(completedCheckout.payment.paid_at).toLocaleString()
    : '';

  const handlePayAndPost = async () => {
    if (!draft || !selectedPlan) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedProviderState.enabled) {
        throw new Error(`${selectedProvider.label} is not available yet. Configure it in the server environment first.`);
      }

      const data = await companyAPI.createPaymentCheckoutSession({
        provider: paymentMethod,
        planId: selectedPlan.id,
        draft,
        jobId: draft?.jobId || null,
      });

      if (!data?.checkoutUrl) {
        throw new Error('The payment provider did not return a checkout URL.');
      }

      setCurrentPaymentId(data.paymentId || '');
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Unable to start the payment flow.');
    }
  };

  const handleLocalhostBypass = async () => {
    if (!draft || !selectedPlan || !isLocalhostBypassAvailable) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await companyAPI.completeLocalBypassCheckout({
        provider: paymentMethod,
        planId: selectedPlan.id,
        draft,
        jobId: draft?.jobId || null,
      });

      paymentCompletedRef.current = true;
      window.localStorage.removeItem(STORAGE_KEY);
      setCurrentPaymentId(data?.payment?.id || '');
      setCompletedCheckout({
        providerId: paymentMethod,
        payment: data?.payment || null,
        job: data?.job || null,
      });
      setSuccess('Local sample payment completed and your job was published successfully.');
      notifyOpener(PAYMENT_MESSAGE_TYPE, { job: data?.job || null });
    } catch (err) {
      setError(err?.message || 'Unable to complete the local sample payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (currentPaymentId) {
      try {
        await companyAPI.cancelPaymentCheckout(currentPaymentId);
      } catch {
        // The local draft remains available even if the server cancellation cannot be saved.
      }
    }

    notifyOpener(PAYMENT_CANCEL_MESSAGE_TYPE, { keepDraft: true });

    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    navigate(COMPANY_PATHS.postJob);
  };

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628] px-3 py-3 text-[#344e41] dark:text-white transition-colors duration-300 sm:px-4 sm:py-4">
      <div className="min-h-[calc(100vh-1.5rem)] flex items-center justify-center sm:min-h-[calc(100vh-2rem)]">
        <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#a3b18a] dark:border-[#1e3657] bg-[rgba(255,255,255,0.88)] dark:bg-[rgba(12,24,40,0.9)] backdrop-blur-2xl shadow-[0_30px_90px_rgba(58,90,64,0.14)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-[#ccd5c0] dark:border-[#1f3857] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,240,0.78))] dark:bg-[linear-gradient(180deg,rgba(18,35,58,0.95),rgba(10,21,35,0.82))] px-5 py-4 sm:px-6">
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
                          : 'border-[#c7d5c0] bg-white text-[#7b8a7f] dark:border-[#35506f] dark:bg-[#102139] dark:text-[#8fa8c4]'
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

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#588157] dark:text-[#7dc4ff]">Secure checkout</p>
              <h1 className="mt-1.5 text-2xl sm:text-[2rem] font-semibold tracking-tight text-[#102a1b] dark:text-white">Complete Payment to Publish Job</h1>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#ccd5c0] dark:border-[#294664] bg-white/80 dark:bg-[#11233a] text-[#5f6f52] dark:text-[#d3e3f4] hover:bg-white dark:hover:bg-[#17304d] transition-colors"
              aria-label="Close payment popup"
            >
              <X className="h-5 w-5" />
            </button>
            </div>
          </div>

          <div className={`${completedCheckout ? 'flex justify-center' : 'grid gap-4 lg:grid-cols-[1.25fr_0.75fr]'} bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(245,247,240,0.08))] dark:bg-[linear-gradient(180deg,rgba(9,18,31,0.2),rgba(9,18,31,0))] p-4 sm:p-5`}>
            <div className={`${completedCheckout ? 'hidden' : 'space-y-4'} rounded-[24px] border border-[#d6d3c9] dark:border-[#1e3657] bg-white/90 dark:bg-[#0f1d30] p-4 sm:p-5 shadow-[0_18px_48px_rgba(58,90,64,0.06)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)]`}>
              <div className="flex flex-col gap-3 border-b border-[#d6d3c9] dark:border-[#1e3657] pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#5f6f52] dark:text-[#9db6d0]">Selected plan</p>
                  <p className="mt-1 text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-[#102a1b] dark:text-white">PHP {selectedPlan?.price?.toLocaleString() ?? '--'}</p>
                  <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#9db6d0]">{selectedPlan ? `${selectedPlan.label} posting duration` : 'Choose a plan below'}</p>
                </div>
                <div className="rounded-2xl border border-[#bfd0af] dark:border-[#284463] bg-[#f4f8f1] dark:bg-[#12233b] px-3 py-2.5 text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#588157] dark:text-[#7dc4ff]">Status</p>
                  <p className="text-sm font-semibold text-[#102a1b] dark:text-white">{verifying ? 'Verifying payment' : selectedPlan ? 'Selected' : 'Waiting'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#102a1b] dark:text-white">Plan Summary</h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`relative rounded-[20px] border p-3.5 text-left transition-all ${
                          isSelected
                            ? 'border-[#588157] bg-[linear-gradient(180deg,#f4f8f1,#eaf2e5)] shadow-[0_16px_40px_rgba(88,129,87,0.16)] dark:border-[#63b3ff] dark:bg-[linear-gradient(180deg,#16304b,#102138)]'
                            : plan.highlighted
                              ? 'border-[#bfd0af] bg-[linear-gradient(180deg,#fbfdf8,#f2f7ed)] hover:border-[#588157] dark:border-[#31506f] dark:bg-[linear-gradient(180deg,#132439,#102138)]'
                              : 'border-[#d6d3c9] bg-[#fbfcfa] hover:bg-[#f5f5f2] dark:border-[#26415f] dark:bg-[#102138] dark:hover:bg-[#132844]'
                        }`}
                      >
                        {plan.badge ? (
                          <span className="absolute right-4 top-4 rounded-full bg-[#3a5a40] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white dark:bg-[#63b3ff] dark:text-[#0c1728]">
                            {plan.badge}
                          </span>
                        ) : null}

                        <div className="pr-16 xl:pr-0">
                          <p className="text-base font-semibold text-[#102a1b] dark:text-white">{plan.label}</p>
                          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#102a1b] dark:text-white">PHP {Number(plan.price || 0).toLocaleString()}</p>
                          <p className="mt-1.5 text-xs leading-5 text-[#5f6f52] dark:text-[#b0c8e0]">{plan.description}</p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#7dc4ff]">
                            Active for {plan.durationLabel}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isSelected
                              ? 'bg-[#3a5a40] text-white dark:bg-[#63b3ff] dark:text-[#0c1728]'
                              : 'border border-[#a3b18a] text-[#3a5a40] dark:border-[#2a4968] dark:text-white'
                          }`}>
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#24415f] bg-[#f8fbf6] dark:bg-[#102138] p-3.5">
                  <p className="text-sm font-semibold text-[#102a1b] dark:text-white">All plans include</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {PLAN_FEATURES.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full border border-[#bfd0af] bg-white px-2.5 py-1 text-[11px] font-medium text-[#344e41] dark:border-[#274463] dark:bg-[#0f2137] dark:text-[#dcecff]"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
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
                    const providerState = providerAvailability?.[provider.id] || { enabled: true, reason: '' };
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => {
                          if (!providerState.enabled) return;
                          setPaymentMethod(provider.id);
                        }}
                        disabled={!providerState.enabled}
                        className={`rounded-[20px] border p-3.5 text-left transition-colors ${
                          !providerState.enabled
                            ? 'cursor-not-allowed border-[#e1e7ee] bg-[#f8fafc] opacity-60 dark:border-[#243d5a] dark:bg-[#102138]'
                            : selected
                              ? 'border-[#588157] bg-[#eef6ee] shadow-[0_12px_30px_rgba(88,129,87,0.1)] dark:border-[#63b3ff] dark:bg-[#14304d]'
                              : 'border-[#d6d3c9] bg-[#fbfcfa] hover:bg-[#f5f5f2] dark:border-[#24415f] dark:bg-[#102138] dark:hover:bg-[#132844]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="rounded-xl border border-[#d6d3c9] dark:border-[#294664] bg-white dark:bg-[#0f2139] p-2">
                              <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#7dc4ff]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#102a1b] dark:text-white">{provider.id === 'stripe' ? 'Stripe (Card)' : 'PayPal'}</p>
                              <p className="mt-1 text-xs leading-5 text-[#5f6f52] dark:text-[#a6bfd8]">{provider.description}</p>
                              {!providerState.enabled ? (
                                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">Setup needed</p>
                              ) : null}
                            </div>
                          </div>
                          <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                            !providerState.enabled
                              ? 'border-[#d5dee8] dark:border-[#35506f]'
                              : selected
                                ? 'border-[#588157] bg-[#588157] text-white dark:border-[#63b3ff] dark:bg-[#63b3ff] dark:text-[#0c1728]'
                                : 'border-[#c8d6e4] dark:border-[#345170]'
                          }`}>
                            {providerState.enabled && selected ? <BadgeCheck className="h-3.5 w-3.5" /> : null}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#24415f] bg-[#f5f5f2] dark:bg-[#0f2137] p-3.5 text-sm text-[#344e41] dark:text-[#d5e6f5]">
                The draft stays saved until payment is verified. If checkout fails or is cancelled, the job remains unpublished and you can safely try again.
              </div>

              {!selectedProviderState.enabled ? (
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  {selectedProviderState.reason || `${selectedProvider.label} is not configured yet.`} Add the required server env keys, then refresh this popup.
                </div>
              ) : null}

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
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayAndPost}
                  disabled={loading || verifying || !draft || !selectedPlan || !selectedProviderState.enabled}
                  className="w-full rounded-2xl bg-[#3a5a40] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#344e41] disabled:opacity-60 dark:bg-[#63b3ff] dark:text-[#0c1728] dark:hover:bg-[#83c5ff] sm:w-auto sm:min-w-[240px]"
                >
                  {loading
                    ? 'Opening checkout...'
                    : verifying
                      ? 'Verifying payment...'
                      : selectedPlan
                        ? `Pay PHP ${Number(selectedPlan.price || 0).toLocaleString()} with ${selectedProvider.label}`
                        : 'Select a plan to continue'}
                </button>
                {isLocalhostBypassAvailable ? (
                  <button
                    type="button"
                    onClick={handleLocalhostBypass}
                    disabled={loading || verifying || !draft || !selectedPlan}
                    className="w-full rounded-2xl border border-dashed border-[#588157] bg-[#f4f8f1] px-5 py-3 font-semibold text-[#3a5a40] transition-colors hover:bg-[#ecf4e7] disabled:opacity-60 dark:border-[#63b3ff] dark:bg-[#102138] dark:text-[#9ed3ff] dark:hover:bg-[#16304b] sm:w-auto"
                  >
                    Sample success
                  </button>
                ) : null}
              </div>
            </div>

            {completedCheckout ? (
              <div className="w-full max-w-2xl space-y-3 rounded-[24px] border border-[#d6d3c9] dark:border-[#1e3657] bg-white/92 dark:bg-[#0f1d30] p-4 sm:p-5 shadow-[0_18px_48px_rgba(58,90,64,0.06)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#588157] dark:text-[#7dc4ff]">Merchant summary</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#102a1b] dark:text-white">
                    {completedProvider?.merchantName || 'KapIT Payment Receipt'}
                  </h2>
                  <p className="mt-2 text-sm text-[#5f6f52] dark:text-[#a6bfd8]">
                    Your payment is verified and this job is now published under the paid plan below.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#24415f] bg-[#f8fbf6] dark:bg-[#102138] p-4 space-y-3 text-sm">
                  <div>
                    <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Paid plan</p>
                    <p className="font-semibold text-[#102a1b] dark:text-white">{paidPlanLabel}</p>
                  </div>
                  <div>
                    <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Plan amount</p>
                    <p className="font-semibold text-[#102a1b] dark:text-white">PHP {paidAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Active duration</p>
                    <p className="font-semibold text-[#102a1b] dark:text-white">{paidPlanDuration}</p>
                  </div>
                  <div>
                    <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Payment provider</p>
                    <p className="font-semibold text-[#102a1b] dark:text-white">{completedProvider?.label || completedCheckout?.payment?.provider || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Payment status</p>
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">Verified and paid</p>
                  </div>
                  <div>
                    <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Payment record</p>
                    <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout?.payment?.id || currentPaymentId || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Provider reference</p>
                    <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout?.payment?.provider_payment_id || completedCheckout?.payment?.provider_checkout_id || '--'}</p>
                  </div>
                  <div>
                    <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Paid on</p>
                    <p className="font-semibold text-[#102a1b] dark:text-white">{paidAt || 'Just now'}</p>
                  </div>
                  <div>
                    <p className="text-[#5f6f52] dark:text-[#a6bfd8]">Published job</p>
                    <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout?.job?.title || draft?.title || '--'}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export { PAYMENT_MESSAGE_TYPE, PAYMENT_CANCEL_MESSAGE_TYPE, STORAGE_KEY };


