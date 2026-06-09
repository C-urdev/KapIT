import React from 'react';
import { Download, Eye, X } from 'lucide-react';

export default function ResumeOpenChoiceModal({ isOpen, title = 'Open Resume', onClose, onView, onDownload }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[#a3b18a] bg-[#f8fbf6] p-4 dark:border-[#444d57] dark:bg-[#22272b]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#3a5a40] dark:text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[#5f6f52] hover:bg-[#eef6ee] dark:text-[#d0d7dd] dark:hover:bg-[#353c44]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-[#5f6f52] dark:text-[#d0d7dd]">Do you want to view the resume first, or download it?</p>
        <div className="grid grid-cols-1 gap-2">
          <button type="button" onClick={onView} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3a5a40] px-3 py-2 text-sm font-semibold text-white dark:bg-[#6f9b74]">
            <Eye className="h-4 w-4" />
            View Resume
          </button>
          <button type="button" onClick={onDownload} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#a3b18a] px-3 py-2 text-sm font-semibold text-[#3a5a40] dark:border-[#444d57] dark:text-white">
            <Download className="h-4 w-4" />
            Download Resume
          </button>
        </div>
      </div>
    </div>
  );
}

