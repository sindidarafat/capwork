import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import Credentials from 'next-auth/providers/credentials';

export const microsoftConfigured = Boolean(
  process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
  process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER
);

// A test-only login for running the app on a developer's own computer.
// It can never switch on when the app runs on Vercel.
export const devLoginEnabled = process.env.DEV_LOGIN === '1' && !process.env.VERCEL;

const providers = [];
if (microsoftConfigured) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      // https://login.microsoftonline.com/<CAP tenant id>/v2.0 : only CAP accounts can sign in.
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    })
  );
}
if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: 'dev',
      name: 'Test login',
      credentials: { email: { label: 'Email' } },
      authorize: async (c) => {
        const email = String(c?.email || '').trim().toLowerCase();
        return email ? { id: email, email, name: email.split('@')[0] } : null;
      },
    })
  );
}

function emailFrom(profile, user) {
  return String(profile?.email || profile?.preferred_username || profile?.upn || user?.email || '').trim().toLowerCase();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/signin', error: '/signin' },
  callbacks: {
    async signIn({ user, profile }) {
      const email = emailFrom(profile, user);
      if (!email) return false;
      const domains = (process.env.ALLOWED_EMAIL_DOMAINS || '')
        .toLowerCase().split(/[,;\s]+/).map((d) => d.replace(/^@/, '')).filter(Boolean);
      if (domains.length && !domains.some((d) => email.endsWith('@' + d))) return false;
      return true;
    },
    async jwt({ token, user, profile }) {
      if (user || profile) {
        token.email = emailFrom(profile, user) || token.email;
        token.name = profile?.name || user?.name || token.name;
      }
      // Microsoft sends a profile photo; it isn't used, so keep the sign-in cookie small.
      delete token.picture;
      return token;
    },
    async session({ session, token }) {
      if (token?.email) session.user.email = token.email;
      if (token?.name) session.user.name = token.name;
      return session;
    },
  },
});
