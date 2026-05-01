/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM || 'Agent Bridge <noreply@resend.dev>';

const nextAuth = NextAuth({
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
          return { id: '1', name: user, email: process.env.AUTH_EMAIL };
        }
        return null;
      },
    }),
  ],
  pages: { signIn: '/login' },
  events: {
    async signIn({ user }) {
      if (resendApiKey && user.email) {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: resendFrom,
          to: [user.email],
          subject: '🔐 Agent Bridge — Login notification',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#111;color:#eee;border-radius:12px">
            <h2 style="margin:0 0 8px">🔐 Login detected</h2>
            <p style="color:#b8c4ba">Someone signed in to Agent Bridge as <strong>${user.name || 'admin'}</strong>.</p>
            <p style="font-size:12px;color:#76b73d;margin-top:16px">${new Date().toLocaleString()}</p>
          </div>`,
        }).catch(() => {});
      }
    },
  },
});

// next-auth v5 beta types not compatible with TS 6 strict inference
const typed = nextAuth as Record<string, any>;
export const handlers = typed['handlers'];
export const signIn = typed['signIn'];
export const signOut = typed['signOut'];
export const auth = typed['auth'];
