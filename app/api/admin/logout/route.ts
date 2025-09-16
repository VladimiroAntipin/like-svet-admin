import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/server/auth/config';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ success: true });

  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set(authConfig.accessTokenCookieName, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 0,
    path: '/',
    domain: 'like-svet-admin.vercel.app',
  });

  response.cookies.set(authConfig.refreshTokenCookieName, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 0,
    path: '/',
    domain: 'like-svet-admin.vercel.app',
  });

  return response;
}