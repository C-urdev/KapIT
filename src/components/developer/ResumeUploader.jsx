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
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-200">
          <FileText className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">Resume (PDF)</span>
        </div>
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange?.('')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400">{helperText}</p>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
        className="mt-3 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-500/15 file:px-4 file:py-2 file:font-semibold file:text-blue-200 hover:file:bg-blue-500/25"
      />
    </div>
  );
}

