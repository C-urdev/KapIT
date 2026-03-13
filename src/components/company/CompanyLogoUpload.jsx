import React from 'react';
import { Image, X } from 'lucide-react';

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export default function CompanyLogoUpload({ value, onChange }) {
  const hasValue = Boolean(value);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Please upload an image file.');
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      onChange?.(dataUrl);
    } catch {
      window.alert('Failed to read image. Please try again.');
    }
  };

  return (
    <div className="rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-white dark:bg-[#162842] p-4 transition-colors duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#344e41] dark:text-white">
          <Image className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
          <span className="font-semibold">Company Logo</span>
        </div>
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange?.('')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] px-3 py-2 text-sm text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors"
          >
            <X className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>

      {hasValue && (
        <div className="mt-3 w-20 h-20 rounded-2xl bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] overflow-hidden transition-colors duration-300">
          <img src={value} alt="Company logo" className="w-full h-full object-cover" />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
        className="mt-3 block w-full text-sm text-[#344e41] dark:text-[#b8d4e8] file:mr-4 file:rounded-lg file:border-0 file:bg-[#f5f5f2] file:px-4 file:py-2 file:font-semibold file:text-[#344e41] hover:file:bg-[#dad7cd] dark:file:bg-[#1e3a5f] dark:file:text-white dark:hover:file:bg-[#2a4a6f] transition-colors"
      />
      <p className="mt-2 text-xs text-[#4b5563] dark:text-[#b8d4e8]">Stored as a base64 data URL.</p>
    </div>
  );
}
