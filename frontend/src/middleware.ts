import { NextResponse, NextRequest } from 'next/server';

/**
 * Middleware защиты маршрутов.
 * - /profile и /bookings требуют авторизации (наличие токена)
 * - /admin требует роль ADMIN
 */
const ADMIN_ROLE_KEY = 'gk_user_role';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('gk_access_token')?.value;
  const role = request.cookies.get(ADMIN_ROLE_KEY)?.value;

  const isProtectedRoute = pathname.startsWith('/profile');
  const isAdminRoute = pathname.startsWith('/admin');

  // Доступ к профилю без токена → редирект на логин
  if (isProtectedRoute && !accessToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Доступ к админке не-админу → редирект на главную
  if (isAdminRoute && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};