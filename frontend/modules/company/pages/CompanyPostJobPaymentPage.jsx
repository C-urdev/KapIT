import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { companyAPI } from '@companyFeatures/companyAPI';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import { JOB_POST_PLANS, PAYMENT_PROVIDERS, PLAN_FEATURES } from '@companyFeatures/companyPaymentCatalog';
import { clearCompanyPostJobFormDraft } from '@companyFeatures/postJobDraftStorage';
import { resolveCheckoutUrls } from '@sharedUtils/checkoutUrlResolver';
import { getPaymentErrorMessageForUser } from '@sharedUtils/paymentErrorMessages';

const STORAGE_KEY = 'company-post-job-draft';
const PAYMENT_MESSAGE_TYPE = 'company-post-job-payment-success';
const PAYMENT_CANCEL_MESSAGE_TYPE = 'company-post-job-payment-cancelled';
const createPaymentIdempotencyKey = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return `checkout-${window.crypto.randomUUID()}`;
  }

  const randomPart = Math.random().toString(36).slice(2, 14);
  const timestampPart = Date.now().toString(36);
  return `checkout-${timestampPart}-${randomPart}`;
};

const sanitizeDraft = (draft) => ({
  jobId: draft?.jobId == null ? null : Number(draft.jobId),
  title: String(draft?.title || '').trim(),
  description: String(draft?.description || '').trim(),
  salary: String(draft?.salary || '').trim(),
  location: String(draft?.location || '').trim(),
  type: String(draft?.type || '').trim(),
  applicationDeadline: String(draft?.applicationDeadline || '').trim(),
  ats: String(draft?.ats || '').trim(),
  hiringTimeline: String(draft?.hiringTimeline || '').trim(),
  mustHaves: String(draft?.mustHaves || '').trim(),
  dealbreakers: String(draft?.dealbreakers || '').trim(),
  skills: Array.isArray(draft?.skills) ? draft.skills : [],
  preAssessment: draft?.preAssessment && typeof draft.preAssessment === 'object' ? draft.preAssessment : undefined,
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
  const [paymentMethod, setPaymentMethod] = React.useState('paypal');
  const [providerAvailability, setProviderAvailability] = React.useState({
    paypal: { enabled: true, label: 'PayPal', reason: '' },
  });
  const [currentPaymentId, setCurrentPaymentId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [demoPricing, setDemoPricing] = React.useState(null);
  const [localPaymentBypass, setLocalPaymentBypass] = React.useState({ available: false, reason: '' });
  const [checkoutFallbackUrls, setCheckoutFallbackUrls] = React.useState([]);
  const [completedCheckout, setCompletedCheckout] = React.useState(null);
  const handledReturnRef = React.useRef(false);
  const paymentCompletedRef = React.useRef(false);
  const pendingCheckoutIdempotencyKeyRef = React.useRef('');
  const isLocalhostBypassAvailable = Boolean(localPaymentBypass?.available);

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
          setDemoPricing(providersData?.demoPricing || null);
          setLocalPaymentBypass(providersData?.localPaymentBypass || { available: false, reason: '' });
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
        if (checkout === 'paypal-success') {
          const orderId = params.get('token');
          if (!orderId || !paymentId) {
            throw new Error('Missing PayPal order details. Please try the payment again.');
          }

          const data = await companyAPI.capturePayPalCheckout({ paymentId, orderId });
          paymentCompletedRef.current = true;
          window.localStorage.removeItem(STORAGE_KEY);
          clearCompanyPostJobFormDraft();
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
        setError(
          getPaymentErrorMessageForUser(
            err,
            'Payment verification failed. Your draft is still saved and unpublished.'
          )
        );
        cleanupUrl();
      } finally {
        setVerifying(false);
      }
    };

    handleProviderReturn();
  }, []);

  React.useEffect(() => {
    const handleNestedCheckoutMessage = (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const type = String(event?.data?.type || '').trim();
      if (type !== PAYMENT_MESSAGE_TYPE && type !== PAYMENT_CANCEL_MESSAGE_TYPE) {
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

  React.useEffect(() => {
    pendingCheckoutIdempotencyKeyRef.current = '';
  }, [selectedPlanId, paymentMethod, draft?.jobId, draft?.title, draft?.description]);

  const selectedProvider = PAYMENT_PROVIDERS.find((provider) => provider.id === paymentMethod) || PAYMENT_PROVIDERS[0];
  const selectedProviderState = providerAvailability?.[selectedProvider.id] || { enabled: true, reason: '' };
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
  const stepState = success ? 3 : verifying || loading ? 2 : 1;
  const demoChargeAmountLabel = demoPricing?.active && demoPricing?.demoAmountValue
    ? demoPricing.demoAmountValue
    : selectedPlan
      ? Number(selectedPlan.price || 0).toLocaleString()
      : null;
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
    setCheckoutFallbackUrls([]);

    try {
      if (!selectedProviderState.enabled) {
        throw new Error(`${selectedProvider.label} is not available yet. Configure it in the server environment first.`);
      }

      const idempotencyKey =
        pendingCheckoutIdempotencyKeyRef.current || createPaymentIdempotencyKey();
      pendingCheckoutIdempotencyKeyRef.current = idempotencyKey;

      const data = await companyAPI.createPaymentCheckoutSession({
        provider: paymentMethod,
        planId: selectedPlan.id,
        draft,
        jobId: draft?.jobId || null,
        idempotencyKey,
      }, {
        headers: {
          'X-Idempotency-Key': idempotencyKey,
        },
      });

      const checkoutUrls = resolveCheckoutUrls(data);
      if (!checkoutUrls.length) {
        throw new Error('The payment provider did not return a checkout URL.');
      }

      const primaryCheckoutUrl = checkoutUrls[0];
      setCurrentPaymentId(data.paymentId || '');
      setCheckoutFallbackUrls(checkoutUrls.slice(1));
      pendingCheckoutIdempotencyKeyRef.current = '';

      const checkoutWindow = window.open(primaryCheckoutUrl, 'kapit-paypal-checkout');
      if (checkoutWindow && !checkoutWindow.closed) {
        setLoading(false);
        setSuccess('PayPal checkout opened in a new tab. Complete payment there, then return here.');
        return;
      }

      window.location.assign(primaryCheckoutUrl);
    } catch (err) {
      setLoading(false);
      setError(getPaymentErrorMessageForUser(err, 'Unable to start the payment flow.'));
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
      clearCompanyPostJobFormDraft();
      setCurrentPaymentId(data?.payment?.id || '');
      setCompletedCheckout({
        providerId: paymentMethod,
        payment: data?.payment || null,
        job: data?.job || null,
      });
      setSuccess('Local sample payment completed and your job was published successfully.');
      notifyOpener(PAYMENT_MESSAGE_TYPE, { job: data?.job || null });
    } catch (err) {
      setError(getPaymentErrorMessageForUser(err, 'Unable to complete the local sample payment.'));
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
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#121416] px-3 py-3 text-[#344e41] dark:text-white transition-colors duration-300 sm:px-4 sm:py-4">
      <div className="min-h-[calc(100vh-1.5rem)] flex items-center justify-center sm:min-h-[calc(100vh-2rem)]">
        <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#a3b18a] dark:border-[#444d57] bg-[rgba(255,255,255,0.88)] dark:bg-[rgba(28,31,35,0.9)] backdrop-blur-2xl shadow-[0_30px_90px_rgba(58,90,64,0.14)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div className="border-b border-[#ccd5c0] dark:border-[#444d57] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,240,0.78))] dark:bg-[linear-gradient(180deg,rgba(47,52,59,0.95),rgba(27,31,35,0.84))] px-5 py-4 sm:px-6">
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
                          ? 'border-[#588157] bg-[#588157] text-white dark:border-[#82ad86] dark:bg-[#82ad86] dark:text-[#121416]'
                          : 'border-[#c7d5c0] bg-[#f8fbf6] text-[#7b8a7f] dark:border-[#444d57] dark:bg-[#202428] dark:text-[#b3bcc5]'
                      }`}>
                        {complete ? <CheckCircle2 className="h-4 w-4" /> : step.key}
                      </span>
                      <span className={`text-xs sm:text-sm font-medium ${active ? 'text-[#16324f] dark:text-white' : 'text-[#8194a8] dark:text-[#b3bcc5]'}`}>
                        {step.label}
                      </span>
                    </div>
                    {index < 2 ? <div className={`h-px flex-1 min-w-6 ${stepState > step.key ? 'bg-[#588157] dark:bg-[#82ad86]' : 'bg-[#d8ddd1] dark:bg-[#444d57]'}`} /> : null}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#588157] dark:text-[#e2b94d]">Secure checkout</p>
              <h1 className="mt-1.5 text-2xl sm:text-[2rem] font-semibold tracking-tight text-[#102a1b] dark:text-white">Complete Payment to Publish Job</h1>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#ccd5c0] dark:border-[#4b5560] bg-[#f8fbf6]/80 dark:bg-[#2a2f35] text-[#5f6f52] dark:text-[#d0d7dd] hover:bg-[#f8fbf6] dark:hover:bg-[#31363d] transition-colors"
              aria-label="Close payment popup"
            >
              <X className="h-5 w-5" />
            </button>
            </div>
          </div>

          <div className={`${completedCheckout ? 'flex justify-center' : 'grid gap-4 lg:grid-cols-[1.25fr_0.75fr]'} bg-[linear-gradient(180deg,rgba(255,255,255,0.24),rgba(245,247,240,0.08))] dark:bg-[linear-gradient(180deg,rgba(24,28,33,0.28),rgba(24,28,33,0))] p-4 sm:p-5`}>
            <div className={`${completedCheckout ? 'hidden' : 'space-y-4'} rounded-[24px] border border-[#d6d3c9] dark:border-[#444d57] bg-[#f8fbf6]/90 dark:bg-[#1b1f23] p-4 sm:p-5 shadow-[0_18px_48px_rgba(58,90,64,0.06)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)]`}>
              <div className="flex flex-col gap-3 border-b border-[#d6d3c9] dark:border-[#444d57] pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-[#5f6f52] dark:text-[#b3bcc5]">Selected plan</p>
                  <p className="mt-1 text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-[#102a1b] dark:text-white">PHP {selectedPlan?.price?.toLocaleString() ?? '--'}</p>
                  <p className="mt-1 text-sm text-[#5f6f52] dark:text-[#b3bcc5]">{selectedPlan ? `${selectedPlan.label} posting duration` : 'Choose a plan below'}</p>
                </div>
                <div className="rounded-2xl border border-[#bfd0af] dark:border-[#4b5560] bg-[#f4f8f1] dark:bg-[#2a2f35] px-3 py-2.5 text-right">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#588157] dark:text-[#e2b94d]">Status</p>
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
                            ? 'border-[#588157] bg-[linear-gradient(180deg,#f4f8f1,#eaf2e5)] shadow-[0_16px_40px_rgba(88,129,87,0.16)] dark:border-[#82ad86] dark:bg-[linear-gradient(180deg,#31363d,#202428)]'
                            : plan.highlighted
                              ? 'border-[#bfd0af] bg-[linear-gradient(180deg,#fbfdf8,#f2f7ed)] hover:border-[#588157] dark:border-[#4b5560] dark:bg-[linear-gradient(180deg,#31363d,#202428)]'
                              : 'border-[#d6d3c9] bg-[#fbfcfa] hover:bg-[#f5f5f2] dark:border-[#444d57] dark:bg-[#202428] dark:hover:bg-[#2f343b]'
                        }`}
                      >
                        {plan.badge ? (
                          <span className="absolute right-4 top-4 rounded-full bg-[#3a5a40] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white dark:bg-[#82ad86] dark:text-[#121416]">
                            {plan.badge}
                          </span>
                        ) : null}

                        <div className="pr-16 xl:pr-0">
                          <p className="text-base font-semibold text-[#102a1b] dark:text-white">{plan.label}</p>
                          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-[#102a1b] dark:text-white">PHP {Number(plan.price || 0).toLocaleString()}</p>
                          <p className="mt-1.5 text-xs leading-5 text-[#5f6f52] dark:text-[#c0c8d0]">{plan.description}</p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#e2b94d]">
                            Active for {plan.durationLabel}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            isSelected
                              ? 'bg-[#3a5a40] text-white dark:bg-[#82ad86] dark:text-[#121416]'
                              : 'border border-[#a3b18a] text-[#3a5a40] dark:border-[#4b5560] dark:text-white'
                          }`}>
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#102a1b] dark:text-white">All plans include</p>
                  <ul className="mt-2.5 space-y-1.5 text-sm text-[#344e41] dark:text-[#eceff2]">
                    {PLAN_FEATURES.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#588157] dark:bg-[#82ad86]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              <div className="space-y-2.5">
                <div>
                  <h2 className="text-xl font-semibold text-[#102a1b] dark:text-white">Payment Methods</h2>
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
                            ? 'cursor-not-allowed border-[#e1e7ee] bg-[#f8fafc] opacity-60 dark:border-[#444d57] dark:bg-[#202428]'
                            : selected
                              ? 'border-[#588157] bg-[#eef6ee] shadow-[0_12px_30px_rgba(88,129,87,0.1)] dark:border-[#82ad86] dark:bg-[#2a2f35]'
                              : 'border-[#d6d3c9] bg-[#fbfcfa] hover:bg-[#f5f5f2] dark:border-[#444d57] dark:bg-[#202428] dark:hover:bg-[#2f343b]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-[#d6d3c9] dark:border-[#4b5560] bg-[#f8fbf6] dark:bg-[#1a1d20] p-2">
                              <Icon className="h-5 w-5 text-[#3a5a40] dark:text-[#e2b94d]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#102a1b] dark:text-white">{provider.label}</p>
                              {!providerState.enabled ? (
                                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">Setup needed</p>
                              ) : null}
                            </div>
                          </div>
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                            !providerState.enabled
                              ? 'border-[#d5dee8] dark:border-[#4b5560]'
                              : selected
                                ? 'border-[#588157] bg-[#588157] dark:border-[#82ad86] dark:bg-[#82ad86]'
                                : 'border-[#c8d6e4] dark:border-[#4b5560]'
                          }`}>
                            {selected ? <CheckCircle2 className="h-3.5 w-3.5 text-white dark:text-[#121416]" /> : null}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-sm text-[#344e41] dark:text-[#e2e6e9]">
                The draft stays saved until payment is verified. If checkout fails or is cancelled, the job remains unpublished and you can safely try again.
              </div>

              {demoPricing?.active ? (
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  Demo pricing is active. PayPal will charge PHP {demoPricing.demoAmountValue} for this local checkout while the selected posting plan amount and entitlements stay unchanged in internal records.
                </div>
              ) : null}

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

              <div className="flex flex-col gap-3 border-t border-[#e3ebf3] dark:border-[#444d57] pt-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full rounded-2xl border border-[#a3b18a] px-5 py-3 text-[#344e41] transition-colors hover:bg-[#f5f5f2] dark:border-[#4b5560] dark:text-white dark:hover:bg-[#31363d] sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayAndPost}
                  disabled={loading || verifying || !draft || !selectedPlan || !selectedProviderState.enabled}
                  className="w-full rounded-2xl bg-[#3a5a40] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#344e41] disabled:opacity-60 dark:bg-[#82ad86] dark:text-[#121416] dark:hover:bg-[#9bc49f] sm:w-auto sm:min-w-[240px]"
                >
                  {loading
                    ? 'Opening checkout...'
                    : verifying
                      ? 'Verifying payment...'
                      : selectedPlan
                        ? `Pay PHP ${demoChargeAmountLabel} with ${selectedProvider.label}`
                        : 'Select a plan to continue'}
                </button>
                {isLocalhostBypassAvailable ? (
                  <button
                    type="button"
                    onClick={handleLocalhostBypass}
                    disabled={loading || verifying || !draft || !selectedPlan}
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
                    Payment is complete. Step 3 is now done and your job is published.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#444d57] bg-[#f8fbf6] dark:bg-[#202428] p-4 sm:p-5">
                  <h3 className="text-base font-semibold text-[#102a1b] dark:text-white">Payment details</h3>
                  <div className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Paid plan</p>
                      <p className="font-semibold text-[#102a1b] dark:text-white">{paidPlanLabel}</p>
                    </div>
                    <div>
                      <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Plan amount</p>
                      <p className="font-semibold text-[#102a1b] dark:text-white">PHP {paidAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Active duration</p>
                      <p className="font-semibold text-[#102a1b] dark:text-white">{paidPlanDuration}</p>
                    </div>
                    <div>
                      <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Published job</p>
                      <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout?.job?.title || draft?.title || '--'}</p>
                    </div>
                    <div>
                      <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Payment provider</p>
                      <p className="font-semibold text-[#102a1b] dark:text-white">{completedProvider?.label || completedCheckout?.payment?.provider || '--'}</p>
                    </div>
                    <div>
                      <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Payment status</p>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300">Verified and paid</p>
                    </div>
                    <div>
                      <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Payment record</p>
                      <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout?.payment?.id || currentPaymentId || '--'}</p>
                    </div>
                    <div>
                      <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Provider reference</p>
                      <p className="font-semibold text-[#102a1b] dark:text-white">{completedCheckout?.payment?.provider_payment_id || completedCheckout?.payment?.provider_checkout_id || '--'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[#5f6f52] dark:text-[#c0c8d0]">Paid on</p>
                      <p className="font-semibold text-[#102a1b] dark:text-white">{paidAt || 'Just now'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#d6d3c9] dark:border-[#444d57] bg-[#f8fbf6] dark:bg-[#202428] p-4">
                  <p className="text-sm font-semibold text-[#102a1b] dark:text-white">All plans include</p>
                  <ul className="mt-2.5 space-y-1.5 text-sm text-[#344e41] dark:text-[#eceff2]">
                    {PLAN_FEATURES.map((feature) => (
                      <li key={`receipt-feature-${feature}`} className="flex items-start gap-2">
                        <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#588157] dark:bg-[#82ad86]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
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


