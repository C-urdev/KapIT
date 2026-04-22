import React from 'react';
import CompanyMobileHeader from './layout/mobile/CompanyMobileHeader';
import CompanyDesktopHeader from './layout/desktop/CompanyDesktopHeader';

export default function CompanyHeader({ mobileHidden = false, ...props }) {
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-[#f8fbf6] dark:bg-[#121416] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
      mobileHidden ? '-translate-y-full xl:translate-y-0' : 'translate-y-0'
    }`}>
      <div className="h-1 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#82ad86] dark:to-[#6f9b74]" />
      <CompanyMobileHeader {...props} />
      <CompanyDesktopHeader {...props} />
    </header>
  );
}



