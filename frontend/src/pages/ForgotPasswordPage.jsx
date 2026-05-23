import { Suspense } from 'react';
import ForgotPasswordClient from '../../components/ForgotPasswordClient';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-sm text-slate-600">Loading…</div>}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
