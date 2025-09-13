import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/server/auth/tokens';
import { authConfig } from '@/lib/server/auth/config';
import prismadb from '@/lib/prismadb';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email и пароль обязательные' },
        { status: 400 }
      );
    }

    const user = await prismadb.admin.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Неверный email/пароль' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Неправильный пароль' },
        { status: 401 }
      );
    }

    const accessToken = await generateAccessToken({ userId: user.id, tokenVersion: user.tokenVersion });
    const refreshToken = await generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });

    const response = NextResponse.json({ success: true, userId: user.id });

    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set(authConfig.accessTokenCookieName, accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: authConfig.accessTokenExpiry / 1000,
      path: '/',
      domain: authConfig.cookieDomain,
    });

    response.cookies.set(authConfig.refreshTokenCookieName, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: authConfig.refreshTokenExpiry / 1000,
      path: '/',
      domain: authConfig.cookieDomain,
    });

    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}