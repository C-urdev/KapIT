import { Suspense } from 'react';
import ResetPasswordPageClient from '../../components/ResetPasswordPageClient';

export const metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your KapIT account.',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-sm text-slate-600">Loading password reset...</div>}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
