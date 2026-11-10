import { redirect } from 'next/navigation';
import { getUser } from '@/lib/session';
import { databaseUrl } from '@/lib/db';
import Nav from '@/components/Nav';
import { doSignOut } from './actions';

export const dynamic = 'force-dynamic';

export default async function BoardLayout({ children }) {
  if (!databaseUrl()) {
    return (
      <main className="setup-note">
        <h1>Almost there</h1>
        <p>The app is running, but it is not connected to a database yet.</p>
        <p>In Vercel, open this project, go to <strong>Storage</strong>, create a Neon Postgres database and connect it to the project, then redeploy. The setup guide covers this in step 3.</p>
      </main>
    );
  }
  const user = await getUser();
  if (!user) redirect('/signin');

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a href="/" className="brand" aria-label="CAP Task Board home">
            <span className="brand-mark">CAP<span>.</span></span>
            <span className="brand-name">Task Board</span>
          </a>
          <Nav />
          <div className="me">
            <div className="me-text">
              <span className="me-name">{user.name}</span>
              <span className={user.canEdit ? 'role role-edit' : 'role'}>{user.isAdmin ? 'Admin' : user.canEdit ? 'Editor' : 'Viewer'}</span>
            </div>
            <form action={doSignOut}>
              <button className="btn btn-ghost btn-sm" type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      {!user.memberId && (
        <div className="banner">
          Your email ({user.email}) isn't linked to anyone on the Team page yet, so "My tasks" can't find you. An editor can add it on the Team page.
        </div>
      )}
      <main className="page">{children}</main>
    </div>
  );
}
