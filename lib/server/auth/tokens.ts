import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { authConfig } from './config';

export interface TokenPayload {
  userId: string;
  tokenVersion: number;
}

const toSeconds = (ms: number) => Math.floor(ms / 1000);

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + toSeconds(authConfig.accessTokenExpiry);

  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(authConfig.jwtSecret));
}

export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + toSeconds(authConfig.refreshTokenExpiry);

  return await new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(authConfig.jwtSecret));
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(authConfig.jwtSecret));
    return {
      userId: payload.userId as string,
      tokenVersion: payload.tokenVersion as number,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('JWT verification failed:', err?.message ?? err);
    return null;
  }
}