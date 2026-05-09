'use client';

import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  // Prevent missing error objects from breaking the component
  const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred while loading this page.';

  return (
    <html lang="en">
      <body className="bg-[#f7f6f1] text-slate-900 dark:bg-[#121416] dark:text-white">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          <div className="rounded-2xl bg-white/40 p-10 shadow-xl backdrop-blur-md border border-white/60">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#588157]">Error 500</p>
            <h1 className="mt-4 text-4xl font-extrabold text-[#102a1b] sm:text-5xl tracking-tight">Something went wrong</h1>
            <p className="mt-5 max-w-xl text-lg text-[#344e41] opacity-90 leading-relaxed font-medium">
              {errorMessage}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  if (typeof reset === 'function') reset();
                  else window.location.reload();
                }}
                className="rounded-full bg-gradient-to-tr from-[#3a5a40] to-[#4c7554] px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:from-[#2f4e39] hover:to-[#3a5a40] active:scale-95"
              >
                Try again
              </button>
              <Link
                href="/"
                className="rounded-full bg-white/60 border border-[#a3b18a] px-8 py-3.5 text-sm font-semibold text-[#344e41] shadow-sm transition-all hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
              >
                Go home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
