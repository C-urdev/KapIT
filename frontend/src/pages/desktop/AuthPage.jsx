import { Suspense } from 'react';
import AuthPageClient from '../../../components/AuthPageClient';

export default function AuthPage({ mode = 'login' }) {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-sm text-slate-600">Loading...</div>}>
      <AuthPageClient initialMode={mode} />
    </Suspense>
  );
}
