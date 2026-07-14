import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const authCookie = request.cookies.get('uwu_auth');
  const roleCookie = request.cookies.get('uwu_role');
  const isAuthenticated = authCookie?.value === 'true';
  const role = roleCookie?.value ?? '';
  const pathname = request.nextUrl.pathname;

  // Protect admin routes — only superadmin and clubadmin
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated || !['superadmin', 'clubadmin'].includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protect all module routes — must be logged in
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/?auth=login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/events/:path*',
    '/tickets/:path*',
    '/marketplace/:path*',
    '/lost-and-found/:path*',
    '/gpa-calculator/:path*',
    '/info-hub/:path*',
    '/admin/:path*',
  ],
};
