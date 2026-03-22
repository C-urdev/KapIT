import React from 'react';
import CompanyMobileHeader from './layout/CompanyMobileHeader';
import CompanyDesktopHeader from './layout/CompanyDesktopHeader';

export default function CompanyHeader(props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#0a1628] transition-colors duration-300">
      <div className="h-1 bg-gradient-to-r from-[#588157] to-[#3a5a40] dark:from-[#2d8bb8] dark:to-[#3ba9d6]" />
      <CompanyMobileHeader {...props} />
      <CompanyDesktopHeader {...props} />
    </header>
  );
}



