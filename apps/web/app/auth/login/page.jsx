import { Suspense } from 'react';
import AuthPageClient from '../../../components/AuthPageClient';

export const metadata = {
  title: 'Login',
  description: 'Sign in to your KapIT account.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-sm text-slate-600">Loading login...</div>}>
      <AuthPageClient initialMode="login" />
    </Suspense>
  );
}
