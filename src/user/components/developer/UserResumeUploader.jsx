import React from 'react';
import { FileText, X } from 'lucide-react';

export default function ResumeUploader({ value, onChange, helperText = 'PDF only (stored as a base64 data URL)' }) {
  const hasValue = Boolean(value);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      window.alert('Please upload a PDF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChange?.(String(reader.result || ''));
    reader.onerror = () => window.alert('Failed to read file. Please try again.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border border-[#a3b18a] bg-[#f5f5f2] p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#344e41] dark:text-slate-200">
          <FileText className="h-5 w-5 text-[#588157] dark:text-blue-400" />
          <span className="font-semibold">Resume (PDF)</span>
        </div>
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange?.('')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] px-3 py-2 text-sm text-[#344e41] hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
            Remove
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-[#5f6f52] dark:text-slate-400">{helperText}</p>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
        className="mt-3 block w-full text-sm text-[#344e41] dark:text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef6ee] file:px-4 file:py-2 file:font-semibold file:text-[#3a5a40] hover:file:bg-[#e3eee3] dark:file:bg-[#1e3a5f] dark:file:text-[#b8d4e8] dark:hover:file:bg-[#24496d]"
      />
    </div>
  );
}



