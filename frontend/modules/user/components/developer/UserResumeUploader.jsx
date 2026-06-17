import React, { useId, useMemo, useEffect } from 'react';
import { FileText, Loader2, X } from 'lucide-react';
import { useR2Upload } from '../../../shared/hooks/useR2Upload';

const MAX_UPLOAD_MB = 5;
const ALLOWED_RESUME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const RESUME_ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export default function ResumeUploader({
  value,
  onChange,
  onUpload,
  onUploadComplete,
}) {
  const fileInputId = useId();
  const hasValue = Boolean(value);

  // Initialize the R2 upload state machine
  const { status, error: r2Error, isProcessing, startUpload, reset } = useR2Upload({
    presignEndpoint: '/api/uploads/presign',
    confirmEndpoint: '/api/uploads/confirm',
    onSuccess: (resume) => {
      const nextResumeUrl = String(resume?.pdf_url || resume?.docx_url || '').trim();
      if (nextResumeUrl) {
        onChange?.(nextResumeUrl);
        onUploadComplete?.({
          resumeUrl: nextResumeUrl,
          fileName: String(resume?.original_filename || uploadedLabel || 'resume'),
          contentType: 'application/pdf',
          extractedTextPreview: String(resume?.extracted_text || '').trim().slice(0, 200),
        });
      }
    }
  });

  // Keep a local error for validation before we hit the hook
  const [localError, setLocalError] = React.useState('');
  const activeError = localError || r2Error;
  const uploading = isProcessing;

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

  const handleFile = (file) => {
    if (!file || uploading) return;
    setLocalError('');

    if (!ALLOWED_RESUME_TYPES.has(String(file.type || '').toLowerCase())) {
      setLocalError('Please upload a PDF, DOC, or DOCX file.');
      return;
    }

    if (file.size <= 0) {
      setLocalError('The selected file is empty.');
      return;
    }

    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setLocalError(`Resume must be ${MAX_UPLOAD_MB}MB or smaller.`);
      return;
    }

    // Trigger the R2 State Machine
    startUpload(file);
  };

  return (
    <div className="rounded-xl border border-[#a3b18a] bg-[#f5f5f2] p-4 dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#344e41] dark:text-slate-200">
          <FileText className="h-5 w-5 text-[#588157] dark:text-[#f0c766]" />
          <span className="font-semibold">Resume (PDF, DOC, DOCX)</span>
        </div>
        {hasValue ? (
          <button
            type="button"
            onClick={() => {
              setLocalError('');
              reset();
              onChange?.('');
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] px-3 py-2 text-sm text-[#344e41] hover:bg-[#f8fbf6] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
            Remove
          </button>
        ) : null}
      </div>

      {activeError ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{activeError}</p> : null}

      {hasValue ? (
        <p className="mt-3 text-sm text-[#344e41] dark:text-slate-300">
          Uploaded resume ready: <span className="font-semibold">{uploadedLabel}</span>
        </p>
      ) : null}

      <input
        id={fileInputId}
        type="file"
        accept={RESUME_ACCEPT}
        onChange={(e) => {
          void handleFile(e.target.files?.[0] || null);
          e.target.value = '';
        }}
        disabled={uploading}
        className="sr-only"
      />
      <label
        htmlFor={fileInputId}
        className={`mt-3 inline-flex cursor-pointer items-center rounded-lg border border-[#a3b18a] bg-[#eef6ee] px-4 py-2 text-sm font-semibold text-[#3a5a40] hover:bg-[#e3eee3] dark:border-[#444d57] dark:bg-[#353c44] dark:text-[#d0d7dd] dark:hover:bg-[#4a535d] ${
          uploading ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        Upload Resume
      </label>

      {uploading ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#344e41] dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          {status === 'REQUESTING_URL' && 'Securing upload link...'}
          {status === 'UPLOADING' && 'Uploading securely to Cloudflare R2...'}
          {status === 'CONFIRMING' && 'Scanning for malware...'}
        </p>
      ) : null}
    </div>
  );
}
