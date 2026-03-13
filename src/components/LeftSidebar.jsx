// LeftSidebar 

import React from 'react';
import { MapPin, Award, Zap } from 'lucide-react';

export default function LeftSidebar({ user, userType, onOpenPremium, onOpenMyProfile }) {
  const displayName = user?.username || user?.name || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';
  const isPremium = !!user?.isPremium;
  const desiredJob = user?.desiredJob || 'IT Professional';
  const address = user?.address || 'Manila, Philippines';

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#162842] border border-[#a3b18a] dark:border-[#1e3a5f] rounded-xl overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6]" />
        <div className="px-4 pb-4">
          <div className="relative -mt-8 mb-3">
            <div className="w-16 h-16 bg-[#588157] dark:bg-[#3ba9d6] rounded-full border-4 border-white dark:border-[#162842] flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{userInitial}</span>
              )}
            </div>
            {isPremium && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-500 dark:bg-yellow-400 rounded-full p-1">
                <Award className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <h3 className="font-bold text-[#3a5a40] dark:text-white text-lg">{displayName}</h3>
          {userType === 'employee' ? (
            <>
              <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mb-1">{desiredJob}</p>
              <p className="text-xs text-[#3a5a40] dark:text-[#7d9ab8] flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {address}
              </p>
              {user?.bio && (
                <p className="mt-2 text-xs leading-relaxed text-[#344e41] dark:text-[#b8d4e8] line-clamp-2">
                  {user.bio}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-[#344e41] dark:text-[#b8d4e8] mb-1">Tech Startup</p>
              <p className="text-xs text-[#3a5a40] dark:text-[#7d9ab8]">IT & Software Development</p>
            </>
          )}

          <div className="mt-4 pt-4 border-t border-[#a3b18a] dark:border-[#2a4a6f] space-y-2">
            {userType === 'employee' ? (
              <>
                <SidebarLink text="My Profile" onClick={onOpenMyProfile} />
                <SidebarLink text="My Projects" />
                <SidebarLink text="Saved Jobs" />
                <SidebarLink text="Applications" />
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

      {!isPremium && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-[#3a5a40] dark:text-white text-sm mb-1">Upgrade to Premium</h4>
              <p className="text-xs text-[#344e41] dark:text-[#b8d4e8] mb-3">
                {userType === 'employee' ? 'Top search rankings, unlimited projects, premium badge' : 'Priority candidate access, advanced filters, unlimited views'}
              </p>
              <button
                onClick={() => onOpenPremium?.()}
                className="w-full bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                Upgrade Now
              </button>
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
      className="w-full text-left text-sm text-[#344e41] dark:text-white hover:text-[#588157] dark:hover:text-[#3ba9d6] py-1 transition-colors"
    >
      {text}
    </button>
  );
}
