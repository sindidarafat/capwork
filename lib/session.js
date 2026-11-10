import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { q } from './db';

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '').toLowerCase().split(/[,;\s]+/).filter(Boolean);
}

// Who is signed in, and what they are allowed to do.
// Admins (ADMIN_EMAILS setting) can always edit and decide who else can edit.
// Anyone marked "Can edit" on the Team page can add and change tasks, clients and team details.
// Everyone else at CAP can see everything but change nothing.
export async function getUser() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  const rows = await q('select id, name, can_edit, active from team where lower(email) = $1', [email]);
  const member = rows[0] || null;
  const isAdmin = adminEmails().includes(email);
  return {
    email,
    name: member?.name || session.user.name || email,
    memberId: member?.id || null,
    isAdmin,
    canEdit: isAdmin || Boolean(member?.can_edit && member?.active),
  };
}

export async function requireEditor() {
  const user = await getUser();
  if (!user) throw new Error('Please sign in again.');
  if (!user.canEdit) throw new Error('Only editors can make changes.');
  return user;
}

// For pages: send anyone who isn't signed in to the sign-in page.
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect('/signin');
  return user;
}
