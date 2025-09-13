import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/server/auth/tokens';
import prismadb from '@/lib/prismadb';
import { authConfig } from '@/lib/server/auth/config';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(authConfig.accessTokenCookieName)?.value;

    if (!accessToken) {
      return NextResponse.json({ success: false, userId: null, email: null });
    }

    const payload = await verifyToken(accessToken);

    if (!payload) {
      return NextResponse.json({ success: false, userId: null, email: null });
    }

    const user = await prismadb.admin.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, tokenVersion: true },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return NextResponse.json({ success: false, userId: null, email: null });
    }

    return NextResponse.json({ success: true, userId: user.id, email: user.email });
  } catch {
    return NextResponse.json({ success: false, userId: null, email: null });
  }
}