import React, { useState } from 'react';
import UserNavbar from '@userComponents/UserNavbar';
import UserMobileBottomNav from '@userComponents/navigation/mobile/UserMobileBottomNav';

export default function MainLayout({ children, user, userType, onHelp, onLogout, onOpenSettings, onOpenPremium, onOpenPublicProfile, unreadNotificationCount = 0 }) {
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628]">
      <UserNavbar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onHelp={onHelp}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onOpenPremium={onOpenPremium}
        onOpenPublicProfile={onOpenPublicProfile}
        unreadNotificationCount={unreadNotificationCount}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>

      <UserMobileBottomNav
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        unreadNotificationCount={unreadNotificationCount}
      />
    </div>
  );
}
