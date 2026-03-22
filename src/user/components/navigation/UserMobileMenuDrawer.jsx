import React from 'react';
import { X, LogOut, HelpCircle, Settings } from 'lucide-react';

export default function UserMobileMenuDrawer({ open, active, setMobileMenuOpen, onOpenSettings, onHelp, onLogout }) {
  if (!open) return null;

  return (
    <div className={`xl:hidden fixed inset-0 z-[70] transition-all duration-300 ease-out ${active ? 'bg-black/35 backdrop-blur-sm opacity-100' : 'bg-black/0 backdrop-blur-none opacity-0'}`}>
      <button type="button" className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" />
      <div className={`absolute right-0 top-0 h-full w-full max-w-[280px] border-l border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#0a1628] shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${active ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
        <div className="flex items-center justify-between border-b border-[#a3b18a] dark:border-[#1e3a5f] px-4 py-4">
          <p className="text-base font-semibold text-[#3a5a40] dark:text-white">Quick menu</p>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 py-4 space-y-2">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenSettings?.();
            }}
            className="w-full text-left px-4 py-3 rounded-lg text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors flex items-center gap-2"
          >
            <Settings className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
            Settings
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onHelp?.();
            }}
            className="w-full text-left px-4 py-3 rounded-lg text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
            Help
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLogout?.();
            }}
            className="w-full text-left px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}



