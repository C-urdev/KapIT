import Link from 'next/link';

export default function Custom500() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#588157]">500</p>
      <h1 className="mt-4 text-4xl font-bold text-[#102a1b] sm:text-5xl">Something went wrong</h1>
      <p className="mt-4 max-w-xl text-base text-[#344e41]">
        An unexpected error occurred while loading this page.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-[#3a5a40] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2f4e39]"
      >
        Go back home
      </Link>
    </main>
  );
}
