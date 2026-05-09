import React from 'react';
import { WalletCards, X } from 'lucide-react';
import { JOB_POST_PLANS, PAYMENT_PROVIDERS, PLAN_FEATURES } from '@companyFeatures/companyPaymentCatalog';

function PlanCard({ plan }) {
  return (
    <div className={`rounded-[22px] border p-5 transition-colors ${
      plan.highlighted
        ? 'border-[#588157] bg-[linear-gradient(180deg,#f4f8f1,#eaf2e5)] shadow-[0_20px_60px_rgba(88,129,87,0.16)] dark:border-[#6f9b74]/45 dark:bg-[linear-gradient(180deg,#17314a,#202428)] dark:shadow-[0_20px_60px_rgba(11,26,45,0.42)]'
        : 'border-[#d6d3c9] bg-[linear-gradient(180deg,#ffffff,#f5f5f2)] shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:border-[#444d57] dark:bg-[linear-gradient(180deg,#22272b,#202428)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.25)]'
    }`}>
      <p className="text-lg font-semibold text-[#102a1b] dark:text-white">{plan.label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-[#102a1b] dark:text-white">
        PHP {Number(plan.price || 0).toLocaleString()}
      </p>
      <p className="mt-2 text-sm text-[#344e41] dark:text-[#d0d7dd]">Active for {plan.durationLabel}</p>
    </div>
  );
}

export default function CompanyPremiumPopup({ isOpen, onClose }) {
  if (!isOpen) return null;

  const provider = PAYMENT_PROVIDERS[0];

  return (
    <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm">
      <div className="flex min-h-full items-end justify-center p-2 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
        <div className="flex max-h-[min(92vh,960px)] w-full max-w-5xl flex-col overflow-hidden rounded-[24px] border border-[#a3b18a] bg-[#f8fbf6] shadow-[0_30px_80px_rgba(0,0,0,0.18)] dark:border-[#444d57] dark:bg-[#22272b] dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:rounded-[28px]">
          <div className="flex items-start justify-between gap-4 border-b border-[#a3b18a] px-4 py-4 sm:px-6 sm:py-5 dark:border-[#444d57]">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#102a1b] dark:text-white">Pricing</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#344e41] transition-colors hover:bg-[#f5f5f2] hover:text-[#102a1b] dark:text-[#d0d7dd] dark:hover:bg-[#353c44] dark:hover:text-white"
              aria-label="Close premium popup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="mb-4 rounded-[18px] border border-[#d6d3c9] bg-[#f8fbf6] p-3.5 dark:border-[#444d57] dark:bg-[#202428]">
              <p className="text-sm font-semibold text-[#102a1b] dark:text-white">Payment Method</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm text-[#344e41] dark:text-[#eceff2]">
                <WalletCards className="h-4 w-4 text-[#588157] dark:text-[#f0c766]" />
                {provider?.label || 'PayPal'}
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              {JOB_POST_PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>

            <div className="mt-6 rounded-[20px] border border-[#d6d3c9] bg-[#f8fbf6] p-4 dark:border-[#444d57] dark:bg-[#202428]">
              <p className="text-sm font-semibold text-[#102a1b] dark:text-white">All plans include</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {PLAN_FEATURES.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-[#bfd0af] bg-[#f8fbf6] px-2.5 py-1 text-[11px] font-medium text-[#344e41] dark:border-[#4b5560] dark:bg-[#1f2328] dark:text-[#eceff2]"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
