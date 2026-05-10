export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7f6f1] px-4 py-10 text-[#102a1b] dark:bg-[#121416] dark:text-white">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#a3b18a] bg-white/90 p-6 shadow-sm dark:border-[#3b434b] dark:bg-[#1f242a]">
        <h1 className="text-2xl font-bold">KapIT Privacy Policy</h1>
        <p className="mt-4 text-sm leading-7 text-[#344e41] dark:text-white/85">
          KapIT collects and processes account and usage information to provide core platform features,
          support hiring workflows, improve service reliability, and maintain security. We only use data
          for legitimate platform operations and user-requested actions.
        </p>
        <p className="mt-4 text-sm leading-7 text-[#344e41] dark:text-white/85">
          You may request access, correction, or deletion of your personal data through KapIT support.
          We apply reasonable safeguards to protect stored information and limit access to authorized
          personnel and systems.
        </p>
        <p className="mt-4 text-sm leading-7 text-[#344e41] dark:text-white/85">
          By using KapIT, you acknowledge this privacy policy and agree to the handling of data as
          described above.
        </p>
      </div>
    </main>
  );
}
