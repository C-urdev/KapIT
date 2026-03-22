import React from 'react';
import { BadgeDollarSign, Landmark, QrCode, WalletCards, X } from 'lucide-react';
import { companyAPI } from '@companyFeatures/companyAPI';
import SearchableSelect from '@sharedComponents/forms/SearchableSelect';
import { COMPANY_PATHS, navigate } from '@companyFeatures/companyUtils';

const STORAGE_KEY = 'company-post-job-draft';
const PAYMENT_MESSAGE_TYPE = 'company-post-job-payment-success';
const PAYMENT_CANCEL_MESSAGE_TYPE = 'company-post-job-payment-cancelled';
const DEFAULT_BANK = 'BDO Online Banking';
const PLAN_FEATURES = ['AI Candidate Matching', 'Smart Filtering', 'Resume Insights', 'Priority Visibility'];
const JOB_POST_PLANS = [
  {
    id: '1-week',
    label: '1 Week',
    price: 699,
    description: 'Best for urgent hiring',
    durationLabel: '1 week',
    durationDays: 7,
  },
  {
    id: '1-month',
    label: '1 Month',
    price: 1699,
    description: 'Perfect for consistent hiring',
    durationLabel: '1 month',
    durationDays: 30,
    badge: 'Most Popular',
    highlighted: true,
  },
  {
    id: '3-months',
    label: '3 Months',
    price: 4499,
    description: 'Great for ongoing recruitment',
    durationLabel: '3 months',
    durationDays: 90,
  },
  {
    id: '6-months',
    label: '6 Months',
    price: 7999,
    description: 'Best value for long-term hiring',
    durationLabel: '6 months',
    durationDays: 180,
  },
];

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
    description: 'Collect posting fees through a verified GCash merchant wallet.',
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
    description: 'Use PayPal checkout for local or international company payers.',
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

export default function CompanyPostJobPayment() {
  const [draft, setDraft] = React.useState(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState('');
  const [paymentMethod, setPaymentMethod] = React.useState('gcash');
  const [selectedBank, setSelectedBank] = React.useState(DEFAULT_BANK);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const paymentCompletedRef = React.useRef(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setError('No pending job draft found. Please go back and prepare the job post again.');
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed?.title || !parsed?.description) {
        setError('The saved draft is incomplete. Please return to the posting form.');
        return;
      }
      setDraft(parsed);
    } catch {
      setError('Failed to load the pending job draft.');
    }
  }, []);

  React.useEffect(() => {
    const cancelPendingDraft = () => {
      if (paymentCompletedRef.current) {
        return;
      }
      window.localStorage.removeItem(STORAGE_KEY);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: PAYMENT_CANCEL_MESSAGE_TYPE,
          },
          window.location.origin
        );
      }
    };

    window.addEventListener('beforeunload', cancelPendingDraft);
    return () => window.removeEventListener('beforeunload', cancelPendingDraft);
  }, []);

  const selectedProvider = PAYMENT_PROVIDERS.find((provider) => provider.id === paymentMethod) || PAYMENT_PROVIDERS[0];
  const selectedPlan = JOB_POST_PLANS.find((plan) => plan.id === selectedPlanId) || null;

  const handlePayAndPost = async () => {
    if (!draft || !selectedPlan) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await companyAPI.createJob({
        ...draft,
        planId: selectedPlan.id,
        planDuration: selectedPlan.durationLabel,
        planDurationDays: selectedPlan.durationDays,
        planPrice: selectedPlan.price,
      });
      paymentCompletedRef.current = true;
      window.localStorage.removeItem(STORAGE_KEY);
      setSuccess(`Payment confirmed via ${selectedProvider.label} and job posted successfully for the ${selectedPlan.label} plan.`);

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: PAYMENT_MESSAGE_TYPE,
            job: data?.job || null,
          },
          window.location.origin
        );
      }

      window.setTimeout(() => {
        window.close();
      }, 1200);
    } catch (err) {
      setError(err?.message || 'Payment was captured but the job could not be posted. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        {
          type: PAYMENT_CANCEL_MESSAGE_TYPE,
        },
        window.location.origin
      );
      window.close();
      return;
    }
    navigate(COMPANY_PATHS.postJob);
  };

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628] px-4 py-8 text-[#344e41] dark:text-white transition-colors duration-300">
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-5xl rounded-[2rem] border border-[#a3b18a] dark:border-[#1e3a5f] bg-[rgba(255,255,255,0.82)] dark:bg-[rgba(22,40,66,0.88)] backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
          <div className="flex items-start justify-between gap-4 border-b border-[#d6d3c9] dark:border-[#2a4a6f] px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#588157] dark:text-[#7fd0ee]">Secure posting</p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#3a5a40] dark:text-white">Complete payment before publishing</h1>
              <p className="mt-2 text-sm text-[#344e41] dark:text-[#b8d4e8]">This merchant popup lets you choose a posting plan before continuing through the existing payment flow.</p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
              aria-label="Close payment popup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-6 shadow-lg shadow-black/5 dark:shadow-black/20 space-y-5">
              <div className="flex items-center justify-between gap-4 border-b border-[#d6d3c9] dark:border-[#2a4a6f] pb-4">
                <div>
                  <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Selected plan total</p>
                  <p className="text-3xl font-extrabold text-[#3a5a40] dark:text-white">PHP {selectedPlan?.price ?? '--'}</p>
                  <p className="mt-1 text-sm text-[#4b5563] dark:text-[#b8d4e8]">{selectedPlan ? `${selectedPlan.label} posting duration` : 'Choose a plan below'}</p>
                </div>
                <div className="rounded-xl bg-[#eef6ee] dark:bg-[#102235] px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#588157] dark:text-[#7fd0ee]">Status</p>
                  <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">{selectedPlan ? 'Plan selected' : 'Select a plan'}</p>
                </div>
              </div>

              {draft ? (
                <div className="rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#102235] p-4 space-y-2">
                  <p className="text-sm text-[#4b5563] dark:text-[#b8d4e8]">Job to be published</p>
                  <p className="text-xl font-bold text-[#3a5a40] dark:text-white">{draft.title}</p>
                  <p className="text-sm text-[#344e41] dark:text-[#dcecff]">{draft.location || 'Location not specified'} ? {draft.type || 'Employment type not specified'}</p>
                  <p className="text-sm text-[#344e41] dark:text-[#dcecff] line-clamp-4">{draft.description}</p>
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-[#3a5a40] dark:text-white">Choose Your Job Post Plan</h2>
                  <p className="mt-1 text-sm text-[#344e41] dark:text-[#b8d4e8]">Select how long you want your job listing to stay active. All plans include the same premium features.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {JOB_POST_PLANS.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`relative rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? 'border-[#588157] bg-[linear-gradient(180deg,#f4f8f1,#eaf2e5)] shadow-[0_16px_40px_rgba(88,129,87,0.16)] dark:border-[#3ba9d6] dark:bg-[linear-gradient(180deg,#17314a,#102235)]'
                            : plan.highlighted
                              ? 'border-[#bfd0af] bg-[linear-gradient(180deg,#fbfdf8,#f2f7ed)] hover:border-[#588157] dark:border-[#31597b] dark:bg-[linear-gradient(180deg,#162842,#11263c)]'
                              : 'border-[#d6d3c9] bg-[#fbfcfa] hover:bg-[#f5f5f2] dark:border-[#2a4a6f] dark:bg-[#102235] dark:hover:bg-[#132846]'
                        }`}
                      >
                        {plan.badge ? (
                          <span className="absolute right-4 top-4 rounded-full bg-[#3a5a40] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white dark:bg-[#3ba9d6] dark:text-[#0a1628]">
                            {plan.badge}
                          </span>
                        ) : null}

                        <div className="pr-28">
                          <p className="text-lg font-bold text-[#3a5a40] dark:text-white">{plan.label}</p>
                          <p className="mt-2 text-3xl font-extrabold text-[#102a1b] dark:text-white">PHP {plan.price.toLocaleString()}</p>
                          <p className="mt-2 text-sm text-[#344e41] dark:text-[#dcecff]">{plan.description}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#588157] dark:text-[#7fd0ee]">
                            Active for {plan.durationLabel}
                          </span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isSelected
                              ? 'bg-[#3a5a40] text-white dark:bg-[#3ba9d6] dark:text-[#0a1628]'
                              : 'border border-[#a3b18a] text-[#3a5a40] dark:border-[#2a4a6f] dark:text-white'
                          }`}>
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-[#d6d3c9] dark:border-[#2a4a6f] bg-[#f8fbf6] dark:bg-[#102235] p-4">
                  <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">All plans include the same features</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PLAN_FEATURES.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full border border-[#bfd0af] bg-white px-3 py-1 text-xs font-medium text-[#344e41] dark:border-[#2a4a6f] dark:bg-[#0f2139] dark:text-[#dcecff]"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
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
                The job will only be created after this payment is confirmed. If you close this popup now, the unpaid draft is canceled automatically.
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              {success && <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayAndPost}
                  disabled={loading || !draft || !selectedPlan}
                  className="px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold disabled:opacity-60 transition-colors"
                >
                  {loading ? 'Processing payment...' : selectedPlan ? `Proceed to payment for PHP ${selectedPlan.price.toLocaleString()}` : 'Select a plan to continue'}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] p-6 shadow-lg shadow-black/5 dark:shadow-black/20 space-y-4">
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
                  <p className="text-[#4b5563] dark:text-[#b8d4e8]">Posting plan</p>
                  <p className="font-semibold text-[#3a5a40] dark:text-white">{selectedPlan ? `${selectedPlan.label} - PHP ${selectedPlan.price.toLocaleString()}` : 'Not selected'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-[#a3b18a] dark:border-[#2a4a6f] p-4 text-sm text-[#344e41] dark:text-[#dcecff]">
                Merchant connection UI is ready here for GCash, PayMaya, PayPal, and Philippine online banks. To make this fully live, the final provider API keys and webhook/server endpoints still need to be connected.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PAYMENT_MESSAGE_TYPE, PAYMENT_CANCEL_MESSAGE_TYPE, STORAGE_KEY };



