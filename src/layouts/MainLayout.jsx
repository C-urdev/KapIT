// MainLayout 

import React, { useState } from 'react';
import Navbar from '@components/Navbar';

export default function MainLayout({ children, user, userType }) {
  const [activeNav, setActiveNav] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#dad7cd] dark:bg-[#0a1628]">
      <Navbar 
        activeNav={activeNav} 
        setActiveNav={setActiveNav} 
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeNav={activeNav} setActiveNav={setActiveNav} />
    </div>
  );
}

function MobileBottomNav({ activeNav, setActiveNav }) {
  const { Home, Briefcase, MessageCircle, Bell } = require('lucide-react');
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#162842] border-t border-[#a3b18a] dark:border-[#2a4a6f] z-50">
      <div className="flex justify-around items-center h-16">
        <MobileBottomNavButton icon={Home} active={activeNav === 'home'} onClick={() => setActiveNav('home')} />
        <MobileBottomNavButton icon={Briefcase} active={activeNav === 'jobs'} onClick={() => setActiveNav('jobs')} />
        <MobileBottomNavButton icon={Briefcase} active={activeNav === 'projects'} onClick={() => setActiveNav('projects')} />
        <MobileBottomNavButton icon={MessageCircle} active={activeNav === 'messages'} onClick={() => setActiveNav('messages')} />
        <MobileBottomNavButton icon={Bell} active={activeNav === 'notifications'} onClick={() => setActiveNav('notifications')} />
      </div>
    </div>
  );
}

function MobileBottomNavButton({ icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 transition-colors ${
        active ? 'text-[#588157] dark:text-[#3ba9d6]' : 'text-[#344e41] dark:text-white'
      }`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}
