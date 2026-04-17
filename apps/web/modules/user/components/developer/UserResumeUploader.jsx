import React, { useMemo, useState } from 'react';
import { FileText, Loader2, X } from 'lucide-react';

const MAX_UPLOAD_MB = 5;

export default function ResumeUploader({
  value,
  onChange,
  onUpload,
  helperText = 'PDF only. Resumes are uploaded securely and stored behind authenticated access.',
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const hasValue = Boolean(value);

  const uploadedLabel = useMemo(() => {
    if (!value) {
      return '';
    }

    try {
      const segments = String(value).split('/');
      const rawName = decodeURIComponent(segments[segments.length - 1] || 'resume.pdf');
      return rawName.replace(/^\d+-[0-9a-f-]+-/i, '') || 'resume.pdf';
    } catch {
      return 'resume.pdf';
    }
  }, [value]);

  const handleFile = async (file) => {
    if (!file || uploading) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    if (file.size <= 0) {
      setError('The selected file is empty.');
      return;
    }

    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`Resume must be ${MAX_UPLOAD_MB}MB or smaller.`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const result = await onUpload?.(file);
      const nextResumeUrl = String(result?.resumeUrl || '').trim();
      if (!nextResumeUrl) {
        throw new Error('Resume upload did not return a file link.');
      }

      onChange?.(nextResumeUrl);
    } catch (uploadError) {
      setError(uploadError?.message || 'Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#a3b18a] bg-[#f5f5f2] p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#344e41] dark:text-slate-200">
          <FileText className="h-5 w-5 text-[#588157] dark:text-blue-400" />
          <span className="font-semibold">Resume (PDF)</span>
        </div>
        {hasValue ? (
          <button
            type="button"
            onClick={() => {
              setError('');
              onChange?.('');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] px-3 py-2 text-sm text-[#344e41] hover:bg-[#f8fbf6] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
            Remove
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-xs text-[#5f6f52] dark:text-slate-400">{helperText}</p>
      {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}

      {hasValue ? (
        <p className="mt-3 text-sm text-[#344e41] dark:text-slate-300">
          Uploaded resume ready: <span className="font-semibold">{uploadedLabel}</span>
        </p>
      ) : null}

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          void handleFile(e.target.files?.[0] || null);
          e.target.value = '';
        }}
        disabled={uploading}
        className="mt-3 block w-full text-sm text-[#344e41] dark:text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#eef6ee] file:px-4 file:py-2 file:font-semibold file:text-[#3a5a40] hover:file:bg-[#e3eee3] dark:file:bg-[#1e3a5f] dark:file:text-[#b8d4e8] dark:hover:file:bg-[#24496d] disabled:cursor-not-allowed disabled:opacity-60"
      />

      {uploading ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#344e41] dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading securely...
        </p>
      ) : null}
    </div>
  );
}
