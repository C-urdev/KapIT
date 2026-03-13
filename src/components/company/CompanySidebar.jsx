import React from 'react';
import { LayoutDashboard, PlusCircle, Briefcase, Users, Search, BarChart3, Building2, Check, Crown, Zap } from 'lucide-react';
import { COMPANY_PATHS, navigate } from '@features/company/companyUtils';

const LINKS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: COMPANY_PATHS.dashboard },
  { key: 'post', label: 'Post Job', icon: PlusCircle, path: COMPANY_PATHS.postJob },
  { key: 'jobs', label: 'Manage Jobs', icon: Briefcase, path: COMPANY_PATHS.jobs },
  { key: 'applicants', label: 'Applicants', icon: Users, path: COMPANY_PATHS.applicants },
  { key: 'search', label: 'Search Developers', icon: Search, path: COMPANY_PATHS.search },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, path: COMPANY_PATHS.analytics },
  { key: 'profile', label: 'Company Profile', icon: Building2, path: COMPANY_PATHS.profile },
];

const PLAN_SUMMARIES = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 'PHP 0',
    features: ['Post jobs', 'Review applicants', 'Basic analytics'],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 'PHP 599 / month',
    features: ['Priority placement', 'Unlimited messaging', 'Advanced filters'],
  },
];

export default function CompanySidebar({ activePath, user, onOpenPremium }) {
  const isPremium = Boolean(user?.isPremium);

  return (
    <aside className="hidden lg:flex fixed top-20 bottom-0 left-0 w-72 flex-col bg-white dark:bg-[#162842] transition-colors duration-300 z-40">
      <div className="h-1 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6]" />
      <nav className="px-5 py-5 space-y-2">
        {LINKS.map((link) => {
          const isActive = activePath === link.path;
          const Icon = link.icon;
          return (
            <button
              key={link.key}
              type="button"
              onClick={() => {
                navigate(link.path);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                isActive
                  ? 'bg-[#eef6ee] dark:bg-[#1e3a5f] border-[#588157] dark:border-[#3ba9d6] text-[#3a5a40] dark:text-white'
                  : 'bg-transparent border-transparent text-[#344e41] dark:text-[#b8d4e8] hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] hover:border-[#a3b18a] dark:hover:border-[#2a4a6f]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#4b5563] dark:text-[#7d9ab8]'}`} />
              <span className="text-sm font-semibold">{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-5 pb-5">
        <div className="space-y-3">
          <div className="rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#1e3a5f] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-white dark:bg-[#162842] p-2 border border-[#a3b18a] dark:border-[#2a4a6f]">
                <Check className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#3a5a40] dark:text-white text-sm mb-1">Free Plan</h3>
                <p className="text-xs text-[#344e41] dark:text-[#b8d4e8] mb-2">Post jobs, review applicants, and view basic analytics.</p>
                <div className="text-xs font-semibold text-[#3a5a40] dark:text-[#b8d4e8]">Current plan</div>
              </div>
            </div>
          </div>

          {PLAN_SUMMARIES.map((plan) => {
            const highlighted = plan.id === 'premium';
            if (!highlighted) return null;

            return (
              <div
                key={plan.id}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-[#3a5a40] dark:text-white text-sm">{plan.name}</h4>
                      {isPremium && (
                        <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-[#344e41] dark:text-[#b8d4e8]">{plan.price}</p>
                    <p className="mt-2 text-xs text-[#344e41] dark:text-[#b8d4e8]">
                      Priority visibility, advanced filters, unlimited messaging, and a featured badge.
                    </p>
                    <div className="mt-3 space-y-1">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 text-xs text-[#344e41] dark:text-[#b8d4e8]">
                          <Crown className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPremium?.()}
                      className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                    >
                      {isPremium ? 'Manage Premium' : 'Upgrade Now'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
