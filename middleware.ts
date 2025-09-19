import { NextResponse, NextRequest } from 'next/server';
import { authConfig } from '@/lib/server/auth/config';

const PUBLIC_ROUTES = [
  /^\/api\/.*/,
  /^\/sign-in(\?.*)?$/,
  /^\/sign-up(\?.*)?$/,
];

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://like-svet-admin.vercel.app',
  'https://like-svet-site.vercel.app',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin') || '';
  
  const accessTokenCookie = req.cookies.get(authConfig.accessTokenCookieName)?.value;
  const authHeader = req.headers.get('authorization') || '';
  const hasBearer = authHeader.startsWith('Bearer ');

  if (req.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      preflight.headers.set('Access-Control-Allow-Origin', origin);
      preflight.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
      preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      preflight.headers.set('Access-Control-Allow-Credentials', 'true');
      preflight.headers.set('Vary', 'Origin');
    }

    preflight.headers.set('Cache-Control', 'no-store');
    return preflight;
  }

  if (PUBLIC_ROUTES.some((pattern) => pattern.test(pathname))) {
    if ((accessTokenCookie || hasBearer) && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  if (!accessTokenCookie && !hasBearer) {
    const loginUrl = new URL('/sign-in', req.url);
    loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.headers.set('Cache-Control', 'no-store');
    return redirectRes;
  }

  const res = NextResponse.next();
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
  }

  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};