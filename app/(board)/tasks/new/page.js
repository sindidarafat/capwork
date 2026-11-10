import Link from 'next/link';
import { getClients, getTeam } from '@/lib/board';
import { requireUser } from '@/lib/session';
import { PageHead } from '@/components/bits';
import TaskForm from '@/components/TaskForm';
import { createTask } from '../../actions';

export default async function NewTaskPage() {
  const user = await requireUser();
  if (!user.canEdit) {
    return (
      <>
        <PageHead title="New task" />
        <p className="notice">Only editors can add tasks. Send the brief to Muntasir and he will log it.</p>
        <Link href="/" className="btn btn-ghost">Back to Today</Link>
      </>
    );
  }
  const [clients, team] = await Promise.all([getClients(), getTeam({ activeOnly: true })]);
  return (
    <>
      <PageHead title="New task" lead="Fields marked * are required. Owner, internal deadline and estimated hours should follow by 11:00." />
      <p className="hint-line">Client not in the list? <Link href="/clients">Add it on Clients &amp; Pitches</Link> first.</p>
      <TaskForm action={createTask} clients={clients} team={team} submitLabel="Add task" />
    </>
  );
}
