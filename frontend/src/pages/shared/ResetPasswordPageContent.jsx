import { Suspense } from 'react';
import ResetPasswordPageClient from '../../../components/ResetPasswordPageClient';

export default function ResetPasswordPageContent() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-sm text-slate-600">Loading password reset...</div>}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
