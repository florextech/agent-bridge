/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const na = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const user = process.env.AUTH_USERNAME || 'admin';
        const pass = process.env.AUTH_PASSWORD || 'admin';
        if (credentials?.username === user && credentials?.password === pass) {
          return { id: '1', name: user };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: '/login' },
});

// next-auth v5 beta types are not compatible with TS 6 strict inference
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typed = na as Record<string, any>;
export const handlers = typed['handlers'];
export const signIn = typed['signIn'];
export const signOut = typed['signOut'];
export const auth = typed['auth'];
