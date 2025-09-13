import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/lib/server/auth/tokens';
import { authConfig } from '@/lib/server/auth/config';
import prismadb from '@/lib/prismadb';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(authConfig.refreshTokenCookieName)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Token refresh not provided' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token refresh not valid' },
        { status: 401 }
      );
    }

    const user = await prismadb.admin.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json(
        { success: false, error: 'Token revoked' },
        { status: 401 }
      );
    }

    const newAccessToken = await generateAccessToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    const newRefreshToken = await generateRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json({
      success: true,
      userId: user.id,
    });

    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set(authConfig.accessTokenCookieName, newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: authConfig.accessTokenExpiry / 1000,
      path: '/',
      domain: authConfig.cookieDomain,
    });

    response.cookies.set(authConfig.refreshTokenCookieName, newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: authConfig.refreshTokenExpiry / 1000,
      path: '/',
      domain: authConfig.cookieDomain,
    });

    return response;

  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}