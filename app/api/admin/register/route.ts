import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/server/auth/tokens';
import { authConfig } from '@/lib/server/auth/config';
import prismadb from '@/lib/prismadb';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword } = await request.json();

    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Все поля обязательные' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Пароль должно быть минимум 6 харахтеров' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Пароли не совпадают' },
        { status: 400 }
      );
    }

    const existingUser = await prismadb.admin.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь с этим email уже существует' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prismadb.admin.create({
      data: { email, password: hashedPassword, tokenVersion: 0 },
    });

    const accessToken = await generateAccessToken({ userId: user.id, tokenVersion: user.tokenVersion });
    const refreshToken = await generateRefreshToken({ userId: user.id, tokenVersion: user.tokenVersion });

    const response = NextResponse.json({
      success: true,
      userId: user.id,
      message: 'Регистрация успешна',
    });

    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set(authConfig.accessTokenCookieName, accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: authConfig.accessTokenExpiry / 1000,
      path: '/',
      domain: 'like-svet-admin.vercel.app',
    });
    response.cookies.set(authConfig.refreshTokenCookieName, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: authConfig.refreshTokenExpiry / 1000,
      path: '/',
      domain: 'like-svet-admin.vercel.app',
    });

    return response;

  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}