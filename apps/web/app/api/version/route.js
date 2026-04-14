import { NextResponse } from 'next/server';

const resolveVersion = () =>
  process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_BUILD_VERSION || 'local-dev';

export async function GET() {
  const response = NextResponse.json(
    { version: resolveVersion() },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );

  return response;
}
