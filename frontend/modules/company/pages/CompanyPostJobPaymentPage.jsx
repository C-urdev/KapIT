import React from 'react';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { companyAPI } from '@companyFeatures/companyAPI';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';
import { JOB_POST_PLANS, PAYMENT_PROVIDERS, PLAN_FEATURES } from '@companyFeatures/companyPaymentCatalog';
import { clearCompanyPostJobFormDraft } from '@companyFeatures/postJobDraftStorage';
import { resolveCheckoutUrls } from '@sharedUtils/checkoutUrlResolver';
import { getPaymentErrorMessageForUser } from '@sharedUtils/paymentErrorMessages';
import './CompanyPostJobPaymentPage.css';

const STORAGE_KEY = 'company-post-job-draft';
const PAYMENT_MESSAGE_TYPE = 'company-post-job-payment-success';
const PAYMENT_CANCEL_MESSAGE_TYPE = 'company-post-job-payment-cancelled';
const PAYMENT_FINISH_MESSAGE_TYPE = 'company-post-job-payment-finished';
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
      if (type !== PAYMENT_MESSAGE_TYPE && type !== PAYMENT_CANCEL_MESSAGE_TYPE && type !== PAYMENT_FINISH_MESSAGE_TYPE) {
        return;
      }

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(event.data, window.location.origin);
      }

      if (type === PAYMENT_FINISH_MESSAGE_TYPE) {
        if (window.opener && !window.opener.closed) {
          window.opener.focus();
          window.close();
          return;
        }

        navigate(event.data?.navigateTo || COMPANY_PATHS.jobs);
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
  const stepState = completedCheckout ? 3 : verifying || loading || success ? 2 : 1;
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
  const selectedPlanPriceLabel = selectedPlan ? Number(selectedPlan.price || 0).toLocaleString() : '--';
  const completedJobTitle = completedCheckout?.job?.title || draft?.title || 'Your job post';
  const transactionReference =
    completedCheckout?.payment?.provider_payment_id
    || completedCheckout?.payment?.provider_checkout_id
    || completedCheckout?.payment?.id
    || currentPaymentId
    || '--';

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

  const handleFinishSuccess = () => {
    notifyOpener(PAYMENT_FINISH_MESSAGE_TYPE, {
      job: completedCheckout?.job || null,
      navigateTo: COMPANY_PATHS.jobs,
    });

    if (window.opener && !window.opener.closed) {
      window.opener.focus();
      window.close();
      return;
    }

    navigate(COMPANY_PATHS.jobs);
  };

  return (
    <div className="company-dashboard-shell company-merchant-window">
      <main className="company-merchant-stage" aria-label="Job checkout">
        <section className="company-merchant-shell">
          <header className="company-merchant-header">
            <div className="company-merchant-stepper" aria-label="Checkout progress">
              {[
                { key: 1, label: 'Plan' },
                { key: 2, label: 'Payment' },
                { key: 3, label: 'Done' },
              ].map((step, index) => {
                const active = stepState >= step.key;
                const complete = stepState > step.key;
                return (
                  <React.Fragment key={step.key}>
                    <span className={`company-merchant-step ${active ? 'company-merchant-step-active' : ''}`}>
                      <span className="company-merchant-step-dot">
                        {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.key}
                      </span>
                      <span>{step.label}</span>
                    </span>
                    {index < 2 ? (
                      <span
                        className={`company-merchant-step-line ${stepState > step.key ? 'company-merchant-step-line-active' : ''}`}
                        aria-hidden="true"
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="company-merchant-title-row">
              <div>
                <h1>{completedCheckout ? 'Payment verified' : 'Choose posting plan'}</h1>
                <p>
                  {completedCheckout
                    ? 'Your job is published and the payment record is saved.'
                    : 'Select the visibility length before opening PayPal checkout.'}
                </p>
              </div>
              <button
                type="button"
                onClick={completedCheckout ? handleFinishSuccess : handleCancel}
                className="company-merchant-close-button"
                aria-label="Close payment popup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          {completedCheckout ? (
            <div className="company-merchant-receipt">
              <section className="company-merchant-success-card" aria-label="Completed transaction">
                <span className="company-merchant-success-mark" aria-hidden="true">
                  <CheckCircle2 className="h-12 w-12" />
                </span>

                <div className="company-merchant-success-copy">
                  <h2>Your job post is live</h2>
                  <p>Payment is complete and the listing is now visible to developers.</p>
                </div>

                <dl className="company-merchant-success-ledger">
                  <div>
                    <dt>Transaction ID</dt>
                    <dd>{transactionReference}</dd>
                  </div>
                  <div>
                    <dt>Payment method</dt>
                    <dd>{completedProvider?.label || completedCheckout?.payment?.provider || '--'}</dd>
                  </div>
                  <div>
                    <dt>Date and time</dt>
                    <dd>{paidAt || 'Just now'}</dd>
                  </div>
                  <div>
                    <dt>Listing</dt>
                    <dd>{completedJobTitle}</dd>
                  </div>
                  <div className="company-merchant-success-total">
                    <dt>Total</dt>
                    <dd>PHP {paidAmount.toLocaleString()}</dd>
                  </div>
                </dl>

                <p className="company-merchant-success-note">
                  {paidPlanLabel} selected. This post stays active for {paidPlanDuration}.
                </p>

                <button
                  type="button"
                  onClick={handleFinishSuccess}
                  className="company-merchant-primary-button company-merchant-success-action"
                >
                  Go to company jobs
                </button>
              </section>
            </div>
          ) : (
            <>
              <div className="company-merchant-body">
                <section className="company-merchant-plan-area" aria-labelledby="posting-plan-heading">
                  <h2 id="posting-plan-heading">Posting plans</h2>

                  <div className="company-merchant-plan-list">
                    {plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          aria-label={`Select ${plan.label} posting plan`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`company-merchant-plan-option ${isSelected ? 'company-merchant-plan-option-selected' : ''}`}
                        >
                          <span className="company-merchant-radio" aria-hidden="true">
                            {isSelected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                          </span>
                          <span className="company-merchant-plan-main">
                            <span className="company-merchant-plan-name">
                              {plan.label}
                              {plan.badge ? <span>{plan.badge}</span> : null}
                            </span>
                            <span className="company-merchant-plan-description">{plan.description}</span>
                          </span>
                          <span className="company-merchant-plan-price">
                            PHP {Number(plan.price || 0).toLocaleString()}
                            <span>{plan.durationLabel}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="company-merchant-included">
                    <h3>Every plan includes</h3>
                    <ul>
                      {PLAN_FEATURES.map((feature) => (
                        <li key={feature}>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section className="company-merchant-summary" aria-label="Selected payment summary">
                  <div className="company-merchant-selected-summary">
                    <span>{selectedPlan ? `${selectedPlan.label} selected` : 'Choose a plan'}</span>
                    <strong>PHP {selectedPlanPriceLabel}</strong>
                  </div>

                  <div className="company-merchant-payment-block">
                    <h2>Payment method</h2>
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
                          className={`company-merchant-provider-option ${selected ? 'company-merchant-provider-option-selected' : ''}`}
                        >
                          <span className="company-merchant-provider-icon">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="company-merchant-provider-copy">
                            <span>{provider.label}</span>
                            {!providerState.enabled ? <em>Setup needed</em> : null}
                          </span>
                          <span className="company-merchant-radio" aria-hidden="true">
                            {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {demoPricing?.active ? (
                    <p className="company-merchant-alert">
                      Demo pricing is active. PayPal will charge PHP {demoPricing.demoAmountValue}; internal plan records stay unchanged.
                    </p>
                  ) : null}

                  {!selectedProviderState.enabled ? (
                    <p className="company-merchant-alert">
                      {selectedProviderState.reason || `${selectedProvider.label} is not configured yet.`} Add the required server env keys, then refresh this popup.
                    </p>
                  ) : null}

                  {error ? <p className="company-merchant-error">{error}</p> : null}
                  {success ? <p className="company-merchant-success">{success}</p> : null}
                  {checkoutFallbackUrls.length ? (
                    <div className="company-merchant-fallback">
                      <p>If PayPal does not load, use the alternate checkout link.</p>
                      <a href={checkoutFallbackUrls[0]} target="_blank" rel="noreferrer">
                        Open alternate PayPal checkout
                      </a>
                    </div>
                  ) : null}
                </section>
              </div>

              <footer className="company-merchant-footer">
                {isLocalhostBypassAvailable ? (
                  <button
                    type="button"
                    onClick={handleLocalhostBypass}
                    disabled={loading || verifying || !draft || !selectedPlan}
                    className="company-merchant-bypass-button"
                  >
                    Sample success (local only)
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handlePayAndPost}
                  disabled={loading || verifying || !draft || !selectedPlan || !selectedProviderState.enabled}
                  className="company-merchant-primary-button"
                >
                  <span>
                    {loading
                      ? 'Opening checkout...'
                      : verifying
                        ? 'Verifying payment...'
                        : selectedPlan
                          ? `Pay PHP ${demoChargeAmountLabel}`
                          : 'Select a plan'}
                  </span>
                  {!loading && !verifying ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="company-merchant-secondary-button"
                >
                  Cancel
                </button>
              </footer>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export { PAYMENT_MESSAGE_TYPE, PAYMENT_CANCEL_MESSAGE_TYPE, PAYMENT_FINISH_MESSAGE_TYPE, STORAGE_KEY };


