import React from 'react';
import { Image, X } from 'lucide-react';

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export default function CompanyLogoUpload({ value, onChange, compact = false }) {
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
    <div className="rounded-xl border border-[#a3b18a] dark:border-[#444d57] bg-[#f8fbf6] dark:bg-[#22272b] p-4 transition-colors duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#344e41] dark:text-white">
          <Image className="w-5 h-5 text-[#588157] dark:text-[#6f9b74]" />
          <span className="font-semibold">Company Logo</span>
        </div>
        {hasValue && (
          <button
            type="button"
            onClick={() => onChange?.('')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] dark:border-[#444d57] px-3 py-2 text-sm text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors"
          >
            <X className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>

      {hasValue && (
        <div className={`mt-3 overflow-hidden border border-[#a3b18a] bg-[#f5f5f2] transition-colors duration-300 dark:border-[#444d57] dark:bg-[#353c44] ${compact ? 'h-16 w-16 rounded-xl' : 'h-20 w-20 rounded-2xl'}`}><img src={value} alt="Company logo" className="h-full w-full object-cover" /></div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
        className="mt-3 block w-full text-sm text-[#344e41] dark:text-[#d0d7dd] file:mr-4 file:rounded-lg file:border-0 file:bg-[#f5f5f2] file:px-4 file:py-2 file:font-semibold file:text-[#344e41] hover:file:bg-[#dad7cd] dark:file:bg-[#353c44] dark:file:text-white dark:hover:file:bg-[#444d57] transition-colors"
      />
    </div>
  );
}



