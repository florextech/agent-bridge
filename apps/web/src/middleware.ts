import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/setup', '/accept-invite'];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  // Auth check
  if (!isPublic) {
    const token =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Pass locale cookie as header for next-intl
  const response = NextResponse.next();
  const locale = request.cookies.get('locale')?.value || 'en';
  response.headers.set('x-locale', locale);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
