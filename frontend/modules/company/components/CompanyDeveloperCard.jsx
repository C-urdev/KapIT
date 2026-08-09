import React from 'react';
import { ChevronRight, MapPin, MessageCircle } from 'lucide-react';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';

export default function CompanyDeveloperCard({
  developer,
  onViewProfile,
  onMessage,
  onSelect,
  selected = false,
}) {
  const name = developer?.username || developer?.email || 'Developer';
  const initial = name.charAt(0).toUpperCase();
  const match = Number.isFinite(Number(developer?.ai?.matchPercentage)) ? Number(developer.ai.matchPercentage) : null;

  return (
    <div
      className={`company-workspace-panel-subtle p-4 transition-[border-color,background-color] duration-150 ${
        selected ? 'border-[var(--workspace-primary)] bg-[var(--workspace-primary-soft)]' : ''
      }`}
    >
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
        <button type="button" onClick={() => onSelect?.(developer)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-surface)] font-bold text-[var(--workspace-text-strong)]">
            {developer?.profileImage ? (
              <img src={developer.profileImage} alt={`${name} profile`} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-[var(--workspace-text-strong)]">{name}</p>
              {developer?.isPremium ? <PremiumBadge /> : null}
            </div>
            <p className="mt-1 truncate text-sm text-[var(--workspace-text)]">{developer?.desiredJob || developer?.education || 'IT Professional'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--workspace-text-muted)]">
              {developer?.address ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {developer.address}
                </span>
              ) : null}
              {match != null ? <span className="font-semibold text-[var(--workspace-primary)]">Match {match}%</span> : null}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMessage?.(developer)}
            className="company-workspace-primary-button inline-flex items-center gap-2 px-3"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Message</span>
          </button>
          <button
            type="button"
            onClick={() => onViewProfile?.(developer)}
            className="company-workspace-secondary-button inline-flex items-center gap-2 px-3"
          >
            <span>View</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
