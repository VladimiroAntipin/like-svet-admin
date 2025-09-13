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
  'http://109.205.58.129:3000',
  'https://like-svet-site.vercel.app',
  'http://like-svet-site.vercel.app',
  'https://likesvet.com',
  'http://likesvet.com',
  'https://www.likesvet.com',
  'http://www.likesvet.com',
  'https://admin.likesvet.com',
  'http://admin.likesvet.com'
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get('origin') || '';

  if (PUBLIC_ROUTES.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  if (req.method === 'POST' && ['/api/admin/login', '/api/admin/register'].includes(pathname)) {
    return NextResponse.next();
  }

  if (req.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      preflight.headers.set('Access-Control-Allow-Origin', origin);
      preflight.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
      preflight.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Accept'
      );
      preflight.headers.set('Access-Control-Allow-Credentials', 'true');
      preflight.headers.set('Vary', 'Origin');
    }

    preflight.headers.set('Cache-Control', 'no-store');
    return preflight;
  }

  const accessToken = req.cookies.get(authConfig.accessTokenCookieName)?.value;

  if (!accessToken) {
    const loginUrl = new URL('/sign-in', req.url);
    loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);

    const redirectRes = NextResponse.redirect(loginUrl);
    redirectRes.headers.set('Cache-Control', 'no-store');
    return redirectRes;
  }

  const res = NextResponse.next();

  // CORS headers (solo se origin valido)
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept'
    );
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
  }

  // Blocca cache per route private
  res.headers.set('Cache-Control', 'no-store');

  return res;
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};