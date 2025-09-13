import { cookies } from 'next/headers';
import { authConfig } from '../server/auth/config';

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(authConfig.accessTokenCookieName, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: authConfig.accessTokenExpiry / 1000,
    path: '/',
    domain: authConfig.cookieDomain
  });

  cookieStore.set(authConfig.refreshTokenCookieName, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: authConfig.refreshTokenExpiry / 1000,
    path: '/',
    domain: authConfig.cookieDomain
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(authConfig.accessTokenCookieName);
  cookieStore.delete(authConfig.refreshTokenCookieName);
}

export async function getAuthCookies() {
  const cookieStore = await cookies();
  
  const accessToken = cookieStore.get(authConfig.accessTokenCookieName)?.value;
  const refreshToken = cookieStore.get(authConfig.refreshTokenCookieName)?.value;

  return { accessToken, refreshToken };
}