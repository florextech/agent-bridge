export { auth as default } from '@/auth';

export const config = {
  matcher: ['/((?!login|setup|accept-invite|api/auth|_next/static|_next/image|favicon.ico).*)'],
};
