import React from 'react';
import { Menu, X } from 'lucide-react';

export default function UserMobileTopbar({ setActiveNav, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <>
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            className="text-xl font-bold text-[#3a5a40] dark:text-white"
            aria-label="Go to home"
          >
            kapIT
          </button>
        </div>
      </div>

      <button className="xl:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <X className="w-6 h-6 text-[#344e41] dark:text-white" /> : <Menu className="w-6 h-6 text-[#344e41] dark:text-white" />}
      </button>
    </>
  );
}



