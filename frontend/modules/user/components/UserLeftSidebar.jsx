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
    <div className="space-y-6">
      <div className="bg-white/70 dark:bg-[#22272b]/70 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)]">
        <div className="h-20 bg-gradient-to-r from-[#588157]/90 to-[#3a5a40]/90 dark:from-[#82ad86]/80 dark:to-[#6f9b74]/80 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 dark:bg-black/10 mix-blend-overlay"></div>
        </div>
        <div className="px-5 pb-5">
          <div className="relative -mt-10 mb-4 flex justify-between items-end">
            <div className="w-20 h-20 bg-[#588157] dark:bg-[#6f9b74] rounded-2xl border-4 border-white/90 dark:border-[#22272b]/90 shadow-lg flex items-center justify-center overflow-hidden rotate-[-2deg] transition-transform duration-500 hover:rotate-0">
              {profileImage ? (
                <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">{userInitial}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-0.5 mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#2d4632] dark:text-white text-xl tracking-tight">{displayName}</h3>
              {isPremium && (
                 <PremiumBadge compact />
              )}
            </div>
          </div>
          {userType === 'employee' ? (
            <>
              <p className="text-[13px] font-medium text-[#4a6b57] dark:text-[#a8b1ba] mb-1.5">{desiredJob}</p>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#3a5a40]/70 dark:text-[#82ad86]/70 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {address}
              </p>
              {user?.bio && (
                <p className="mt-3 text-[13px] leading-relaxed text-[#344e41] dark:text-[#d0d7dd] line-clamp-2">
                  {user.bio}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-[13px] font-medium text-[#4a6b57] dark:text-[#a8b1ba] mb-1.5">Tech Startup</p>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#3a5a40]/70 dark:text-[#82ad86]/70 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                IT & Software Development
              </p>
            </>
          )}

          <div className="mt-5 pt-5 border-t border-black/5 dark:border-white/5 space-y-1">
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
        <div className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a2e1d] to-[#0a140c] p-[1px] shadow-[0_12px_32px_rgba(26,46,29,0.2)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f2c84b]/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative rounded-[23px] bg-[#1a2e1d] p-5 h-full flex flex-col justify-between">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2c84b]/10 to-[#f2c84b]/5 border border-[#f2c84b]/20 text-[#f2c84b] shadow-[0_0_15px_rgba(242,200,75,0.1)]">
                <Zap className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h4 className="font-semibold text-white tracking-tight mb-1">Upgrade to Premium</h4>
                <p className="text-[13px] text-white/60 leading-relaxed">
                  {userType === 'employee' ? 'Job match percentages, ATS-style resume analysis, premium badge' : 'Verified posting flow and applicant management tools'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenPremium?.()}
              className="w-full relative overflow-hidden rounded-xl bg-[#f2c84b] px-4 py-2.5 text-sm font-semibold text-[#1a2e1d] transition-all duration-300 hover:bg-[#ffe58a] hover:shadow-[0_0_20px_rgba(242,200,75,0.4)]"
            >
              <span className="relative z-10">Upgrade Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#f2c84b]/20 bg-gradient-to-br from-[#2f2405] to-[#1a1403] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f2c84b]/10 to-[#f2c84b]/5 border border-[#f2c84b]/20 text-[#f2c84b]">
              <PremiumBadge compact className="border-0 bg-transparent px-0 py-0" iconClassName="h-5 w-5" label="" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-[#ffe08a] text-sm">You're in the Premium plan</h4>
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
