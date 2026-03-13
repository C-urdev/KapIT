// Sidebar 

import React from 'react';
import { MapPin, Award, Zap } from 'lucide-react';

export default function Sidebar({ user, userType }) {
  const displayName = user?.username || user?.name || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();
  const profileImage = user?.profileImage || '';

  return (
    <div className="w-10 h-10 bg-[#588157] dark:bg-[#3ba9d6] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
      {profileImage ? (
        <img src={profileImage} alt={`${displayName} profile`} className="w-full h-full object-cover" />
      ) : (
        <span className="text-white font-semibold">{userInitial}</span>
      )}
    </div>
  );
}

export function SidebarLink({ text }) {
  return (
    <button className="text-sm text-[#344e41] dark:text-white hover:text-[#588157] dark:hover:text-[#3ba9d6] transition-colors w-full text-left">
      {text}
    </button>
  );
}
