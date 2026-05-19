import { NextResponse } from 'next/server';
import { initSchema } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

// Protected init endpoint - run once after first deploy to create DB tables.
// Visit /api/init while logged in as admin.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: 'Sign in to /admin first, then visit this URL' },
      { status: 401 }
    );
  }

  try {
    await initSchema();
    return NextResponse.json({
      ok: true,
      message: 'Schema initialized. You can delete this endpoint or leave it.'
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown error' },
      { status: 500 }
    );
  }
}
