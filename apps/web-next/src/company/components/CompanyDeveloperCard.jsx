import React from 'react';
import { MapPin, MessageCircle } from 'lucide-react';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';

export default function DeveloperCard({ developer, onViewProfile, onMessage }) {
  const name = developer?.username || developer?.email || 'Developer';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="rounded-xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-5 transition-colors duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] text-[#3a5a40] dark:text-white overflow-hidden flex items-center justify-center font-bold shrink-0 transition-colors duration-300">
            {developer?.profileImage ? (
              <img src={developer.profileImage} alt={`${name} profile`} className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#3a5a40] dark:text-white truncate">{name}</p>
            <p className="text-xs text-[#4b5563] dark:text-[#b8d4e8] truncate">{developer?.desiredJob || developer?.education || 'IT Professional'}</p>
            {developer?.address && (
              <p className="mt-1 text-xs text-[#344e41] dark:text-[#b8d4e8] inline-flex items-center gap-1 truncate">
                <MapPin className="w-4 h-4 text-[#588157] dark:text-[#3ba9d6]" />
                {developer.address}
              </p>
            )}
            {developer?.isPremium && <PremiumBadge className="mt-1" />}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onMessage?.(developer)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white text-sm font-semibold transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onViewProfile?.(developer)}
          className="w-full px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] text-sm font-semibold transition-colors"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
