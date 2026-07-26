import React from 'react';
import CompanyMobileHeader from './layout/mobile/CompanyMobileHeader';
import CompanyDesktopHeader from './layout/desktop/CompanyDesktopHeader';

export default function CompanyHeader({ mobileHidden = false, ...props }) {
  return (
    <header className={`fixed left-0 right-0 top-0 z-50 bg-[#f8fbf6] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-[#121416] xl:sticky xl:left-auto xl:right-auto xl:bg-[var(--workspace-appbar)] xl:transition-none xl:dark:bg-[var(--workspace-appbar)] ${
      mobileHidden ? '-translate-y-full xl:translate-y-0' : 'translate-y-0'
    }`}>
      <CompanyMobileHeader {...props} />
      <CompanyDesktopHeader {...props} />
    </header>
  );
}



