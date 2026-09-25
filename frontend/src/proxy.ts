import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/admin/login') return NextResponse.next();
  const admin = path === '/admin' || path.startsWith('/admin/');
  const login = new URL(admin ? '/admin/login' : '/auth', request.url);
  const cookie = request.cookies.get('mig_session');
  if (!cookie) return NextResponse.redirect(login);
  // Use the server-only target first, then the public API target as a safe
  // fallback for deployments that configure a separate API host. Without
  // this fallback the middleware silently calls localhost in production and
  // every protected page appears unavailable even though the API is healthy.
  const internal = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api').replace(/\/+$/, '');
  const base = internal.endsWith('/api') ? internal : `${internal}/api`;
  try {
    const response = await fetch(`${base}/auth/session`, {
      headers: { Cookie: `mig_session=${cookie.value}` }, cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const body = await response.json() as { user?: { role?: string } };
      if (body.user && (!admin || body.user.role === 'admin')) {
        const allowed = NextResponse.next();
        allowed.headers.set('Cache-Control', 'private, no-store');
        return allowed;
      }
    }
    if (response.status >= 500) throw new Error('session unavailable');
    return NextResponse.redirect(login);
  } catch {
    return new NextResponse('<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>خطای ارتباط</title><body><h1>بررسی دسترسی انجام نشد</h1><p>لطفاً دوباره تلاش کنید.</p><a href="">تلاش دوباره</a></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
}

export const config = { matcher: ['/admin/:path*', '/account/:path*', '/checkout/:path*'] };
