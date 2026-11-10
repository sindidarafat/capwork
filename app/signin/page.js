import { redirect } from 'next/navigation';
import { auth, signIn, microsoftConfigured, devLoginEnabled } from '@/auth';

export const dynamic = 'force-dynamic';

const ERRORS = {
  AccessDenied: "That account can't sign in here. Use your CAP Microsoft 365 work account.",
  Configuration: 'Microsoft sign-in is not set up correctly yet. Check the four AUTH settings in Vercel (setup guide, step 5).',
};

export default async function SignInPage({ searchParams }) {
  const sp = await searchParams;
  const session = await auth();
  if (session?.user?.email) redirect('/');

  async function microsoft() {
    'use server';
    await signIn('microsoft-entra-id', { redirectTo: '/' });
  }
  async function dev(formData) {
    'use server';
    await signIn('dev', { email: formData.get('email'), redirectTo: '/' });
  }

  const error = sp.error ? ERRORS[sp.error] || 'Sign-in did not work. Please try again.' : null;

  return (
    <main className="signin">
      <div className="signin-card">
        <div className="signin-brand">
          <span className="brand-mark big">CAP<span>.</span></span>
          <span className="signin-company">Content Analytics And Production Ltd.</span>
        </div>
        <h1>Task Board</h1>
        <p className="signin-lead">What the team is working on, what's due, and what's stuck. Sign in with your CAP work account.</p>
        {error && <p className="signin-error" role="alert">{error}</p>}

        {microsoftConfigured ? (
          <form action={microsoft}>
            <button type="submit" className="btn btn-microsoft">
              <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" /><rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef" /><rect x="11" y="11" width="9" height="9" fill="#ffb900" />
              </svg>
              Sign in with Microsoft
            </button>
          </form>
        ) : (
          <p className="signin-error">Microsoft sign-in isn't switched on yet. Add the four AUTH settings in Vercel and redeploy (setup guide, step 5).</p>
        )}

        {devLoginEnabled && (
          <form action={dev} className="dev-login">
            <p className="small muted">Test login (only on a developer's computer, never on the live site)</p>
            <input type="email" name="email" placeholder="email" required />
            <button type="submit" className="btn btn-ghost btn-sm">Test sign-in</button>
          </form>
        )}
      </div>
    </main>
  );
}
