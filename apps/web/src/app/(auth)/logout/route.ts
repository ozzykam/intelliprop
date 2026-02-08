import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = '__session';
const ACTIVE_ROLE_COOKIE = '__active_role';

/**
 * GET /logout
 * Clears the session and active role cookies and redirects to login
 */
export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(ACTIVE_ROLE_COOKIE);

  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}
