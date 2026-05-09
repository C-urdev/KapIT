import { Suspense } from 'react';
import AuthPageClient from '../../../components/AuthPageClient';

export const metadata = {
  title: 'Register',
  description: 'Create a KapIT account as a developer or company.',
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-sm text-slate-600">Loading registration...</div>}>
      <AuthPageClient initialMode="signup" />
    </Suspense>
  );
}
