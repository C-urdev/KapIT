import Link from '../../../components/shared/Link';

export default function NotFoundPageContent() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#588157]">404</p>
      <h1 className="mt-4 text-4xl font-bold text-[#102a1b] dark:text-white sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-xl text-base text-[#344e41] dark:text-white/80">
        The page you are looking for does not exist or may have been moved.
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
