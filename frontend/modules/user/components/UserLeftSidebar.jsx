// LeftSidebar 

import React from 'react';
import { MapPin, Zap } from 'lucide-react';
import PremiumBadge from '@sharedComponents/ui/PremiumBadge';

export default function UserLeftSidebar({ user, userType, onOpenPremium, onOpenMyProfile, onOpenProjects, onOpenSavedJobs, onOpenApplications }) {
  const displayName = user?.fullName || user?.name || user?.username || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';
  const isPremium = !!user?.isPremium;
  const desiredJob = user?.desiredJob || 'IT Professional';
  const address = user?.address || 'Manila, Philippines';

  return (
    <div className="space-y-4">
      <div className="bg-[#f8fbf6] dark:bg-[#22272b] border border-[#a3b18a] dark:border-[#353c44] rounded-xl overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#82ad86] dark:to-[#6f9b74]" />
        <div className="px-4 pb-4">
          <div className="relative -mt-8 mb-3">
            <div className="w-16 h-16 bg-[#588157] dark:bg-[#6f9b74] rounded-full border-4 border-white dark:border-[#22272b] flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{userInitial}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-[#3a5a40] dark:text-white text-lg">{displayName}</h3>
            {isPremium ? <PremiumBadge compact /> : null}
          </div>
          {userType === 'employee' ? (
            <>
              <p className="text-sm text-[#344e41] dark:text-[#d0d7dd] mb-1">{desiredJob}</p>
              <p className="text-xs text-[#3a5a40] dark:text-[#adb5be] flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {address}
              </p>
              {user?.bio && (
                <p className="mt-2 text-xs leading-relaxed text-[#344e41] dark:text-[#d0d7dd] line-clamp-2">
                  {user.bio}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-[#344e41] dark:text-[#d0d7dd] mb-1">Tech Startup</p>
              <p className="text-xs text-[#3a5a40] dark:text-[#adb5be]">IT & Software Development</p>
            </>
          )}

          <div className="mt-4 pt-4 border-t border-[#a3b18a] dark:border-[#444d57] space-y-2">
            {userType === 'employee' ? (
              <>
                <SidebarLink text="My Profile" onClick={onOpenMyProfile} />
                <SidebarLink text="My Projects" onClick={onOpenProjects} />
                <SidebarLink text="Saved Jobs" onClick={onOpenSavedJobs} />
                <SidebarLink text="Applications" onClick={onOpenApplications} />
              </>
            ) : (
              <>
                <SidebarLink text="Company Profile" />
                <SidebarLink text="Posted Jobs" />
                <SidebarLink text="Saved Candidates" />
                <SidebarLink text="Analytics" />
              </>
            )}
          </div>
        </div>
      </div>

      {!isPremium ? (
        <div className="rounded-2xl border border-[#f2c84b] bg-[#fffdf5] p-4 shadow-[0_8px_24px_rgba(242,200,75,0.12)] dark:border-[#8a6a15] dark:bg-[#2b2206]">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#d69100] dark:bg-[#3a2f0d] dark:text-[#f5c84c]">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-[#3a5a40] dark:text-white text-sm mb-1">Upgrade to Premium</h4>
              <p className="text-xs text-[#344e41] dark:text-[#e7d9a5] mb-3">
                {userType === 'employee' ? 'Job match percentages, ATS-style resume analysis, premium badge' : 'Verified posting flow and applicant management tools'}
              </p>
              <button
                onClick={() => onOpenPremium?.()}
                className="w-full rounded-xl bg-[#f2b500] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#dfaa00] dark:bg-[#d9a300] dark:hover:bg-[#c39200]"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#f2c84b] bg-[linear-gradient(180deg,#fff9df,#fff1b8)] p-4 shadow-[0_8px_24px_rgba(242,200,75,0.16)] dark:border-[#8a6a15] dark:bg-[linear-gradient(180deg,#4a3908,#2f2405)]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fff4cc] text-[#d69100] dark:bg-[#3a2f0d] dark:text-[#f5c84c]">
              <PremiumBadge compact className="border-0 bg-transparent px-0 py-0" iconClassName="h-4 w-4" label="" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-[#7a5200] dark:text-[#ffe08a] text-sm mb-1">You're in the Premium plan</h4>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarLink({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left text-sm text-[#344e41] dark:text-white hover:text-[#588157] dark:hover:text-[#6f9b74] py-1 transition-colors"
    >
      {text}
    </button>
  );
}
