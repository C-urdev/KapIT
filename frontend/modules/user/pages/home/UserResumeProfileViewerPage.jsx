import React from 'react';
import { ArrowLeft, BadgeCheck, Download, FileText, X } from 'lucide-react';

export default function UserResumeProfileViewerPage({
  onBack,
  resumeUrl = '',
  isAts = false,
  fileLabel = 'Resume',
}) {
  const safeUrl = String(resumeUrl || '').trim();
  const lower = safeUrl.toLowerCase();
  const isPdf = lower.includes('.pdf');
  const [showDownloadPrompt, setShowDownloadPrompt] = React.useState(true);

  React.useEffect(() => {
    setShowDownloadPrompt(true);
  }, [safeUrl]);

  const handleDownload = () => {
    if (!safeUrl) return;
    const anchor = document.createElement('a');
    anchor.href = safeUrl;
    anchor.download = '';
    anchor.rel = 'noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  return (
    <div className="mx-auto w-full max-w-[min(100%,1280px)] space-y-4 px-3 pb-6 pt-2 sm:px-5 lg:px-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg border border-[#a3b18a] bg-[#f8fbf6] px-3.5 py-2 text-sm font-semibold text-[#3a5a40] transition-colors hover:bg-[#eef6ee] dark:border-[#444d57] dark:bg-[#22272b] dark:text-white dark:hover:bg-[#2a2f35]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </button>

      <div className="rounded-xl border border-[#a3b18a] bg-[#f8fbf6] p-4 dark:border-[#353c44] dark:bg-[#22272b]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-[#1c2b1f] dark:text-white">Resume Viewer</h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${isAts ? 'bg-[#d9f2de] text-[#1e5a2e] dark:bg-[#2f4a35] dark:text-[#c6f5cf]' : 'bg-[#e8edf3] text-[#334155] dark:bg-[#303844] dark:text-[#d0d7dd]'}`}>
              {isAts ? <BadgeCheck className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              {isAts ? 'ATS Optimized' : 'Original Resume'}
            </span>
            <span className="text-xs text-[#5f6f52] dark:text-[#a8b1ba]">{fileLabel}</span>
          </div>
        </div>
      </div>

      {showDownloadPrompt ? (
        <div className="pointer-events-none fixed right-3 top-[76px] z-[70] sm:right-5 lg:right-7">
          <div className="pointer-events-auto w-[min(92vw,340px)] rounded-xl border border-[#b9c9aa] bg-[#f8fbf6]/95 p-3 shadow-[0_18px_34px_rgba(5,16,27,0.35)] backdrop-blur-md transition-all duration-300 ease-out dark:border-[#44505c] dark:bg-[#1f252b]/95">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.01em] text-[#2f4e39] dark:text-[#d0d7dd]">
                {`Download this ${fileLabel}?`}
              </p>
              <button
                type="button"
                onClick={() => setShowDownloadPrompt(false)}
                className="rounded-md p-1 text-[#476048] transition-colors hover:bg-[#e6efe3] hover:text-[#2f4e39] dark:text-[#9fb0ba] dark:hover:bg-[#2d343d] dark:hover:text-white"
                aria-label="Dismiss download notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1 rounded-md bg-[#3a5a40] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86]"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
              <button
                type="button"
                onClick={() => setShowDownloadPrompt(false)}
                className="inline-flex items-center gap-1 rounded-md border border-[#a3b18a] px-3 py-1.5 text-xs font-semibold text-[#3a5a40] transition-colors hover:bg-[#e8f1e5] dark:border-[#444d57] dark:text-white dark:hover:bg-[#2d333a]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative h-[calc(100dvh-220px)] min-h-[460px] overflow-hidden rounded-xl border border-[#a3b18a] bg-[#f8fbf6] dark:border-[#353c44] dark:bg-[#121416]">
        {safeUrl ? (
          isPdf ? (
            <iframe
              title="Profile Resume Viewer"
              src={safeUrl}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-[#5f6f52] dark:text-[#a8b1ba]">This file type cannot be auto-previewed safely in all browsers.</p>
              <button
                type="button"
                onClick={() => window.open(safeUrl, '_blank', 'noopener,noreferrer')}
                className="rounded-lg border border-[#a3b18a] px-3 py-2 text-sm font-semibold text-[#3a5a40] dark:border-[#444d57] dark:text-white"
              >
                Open File
              </button>
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-[#5f6f52] dark:text-[#a8b1ba]">
            Resume is unavailable right now.
          </div>
        )}
      </div>
    </div>
  );
}
