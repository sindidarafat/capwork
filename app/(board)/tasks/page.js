import Link from 'next/link';
import { getTasks, getTeam, getClients, STATUSES, FLAGS, WORK_TYPES, isOpen } from '@/lib/board';
import { requireUser } from '@/lib/session';
import { fmt } from '@/lib/dates';
import { Flag, Priority, TypeTag, PageHead, Empty } from '@/components/bits';
import StatusSelect from '@/components/StatusSelect';

export default async function TaskLogPage({ searchParams }) {
  const sp = await searchParams;
  const [user, tasks, team, clients] = await Promise.all([requireUser(), getTasks(), getTeam(), getClients()]);

  const show = sp.show || 'open';
  const needle = (sp.q || '').trim().toLowerCase();
  let list = tasks;
  if (show === 'open') list = list.filter(isOpen);
  if (show === 'done') list = list.filter((t) => t.status === 'Done');
  if (sp.client) list = list.filter((t) => String(t.client_id) === sp.client);
  if (sp.owner) list = list.filter((t) => (sp.owner === 'none' ? !t.owner_id : String(t.owner_id) === sp.owner));
  if (sp.status) list = list.filter((t) => t.status === sp.status);
  if (sp.flag) list = list.filter((t) => t.flag === sp.flag);
  if (sp.type) list = list.filter((t) => t.work_type === sp.type);
  if (needle) {
    list = list.filter((t) =>
      [t.code, t.task, t.brief, t.notes, t.client_name, t.owner_name, t.blocked_by].some((v) => v && v.toLowerCase().includes(needle)));
  }
  list = [...list].sort((a, b) => b.id - a.id);

  const exportHref = '/export';

  return (
    <>
      <PageHead title="Task Log" lead="Every task, for every client, pitch and internal job. Nothing is ever deleted.">
        <a href={exportHref} className="btn btn-ghost">Download CSV</a>
        {user.canEdit && <Link href="/tasks/new" className="btn btn-primary">New task</Link>}
      </PageHead>

      <form className="filters filters-wrap" method="get">
        <label className="grow"><span>Search</span><input type="search" name="q" defaultValue={sp.q || ''} placeholder="Task, client, owner, notes…" /></label>
        <label><span>Show</span>
          <select name="show" defaultValue={show}>
            <option value="open">Open tasks</option><option value="all">All tasks</option><option value="done">Done</option>
          </select>
        </label>
        <label><span>Client / Prospect</span>
          <select name="client" defaultValue={sp.client || ''}>
            <option value="">All</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label><span>Owner</span>
          <select name="owner" defaultValue={sp.owner || ''}>
            <option value="">Anyone</option><option value="none">No owner</option>
            {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label><span>Status</span>
          <select name="status" defaultValue={sp.status || ''}>
            <option value="">Any</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label><span>Flag</span>
          <select name="flag" defaultValue={sp.flag || ''}>
            <option value="">Any</option>{FLAGS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label><span>Work type</span>
          <select name="type" defaultValue={sp.type || ''}>
            <option value="">Any</option>{WORK_TYPES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <button className="btn btn-ghost btn-sm" type="submit">Filter</button>
        <Link href="/tasks" className="btn btn-link btn-sm">Clear</Link>
      </form>

      <p className="count">{list.length} {list.length === 1 ? 'task' : 'tasks'}</p>

      {list.length === 0 ? <Empty>No tasks match these filters.</Empty> : (
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>ID</th><th>Added</th><th>Client / Prospect</th><th>Task</th><th>Owner</th><th>Reviewer</th>
                <th>Priority</th><th>Internal deadline</th><th>Client deadline</th><th>Status</th><th>Flag</th><th>On time?</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className={t.work_type === 'Pitch' ? 'row-pitch' : ''}>
                  <td><Link href={`/tasks/${t.id}`} className="code">{t.code}</Link></td>
                  <td className="nowrap">{fmt(t.date_added)}</td>
                  <td>{t.client_name} <TypeTag value={t.work_type} /></td>
                  <td className="task-cell"><Link href={`/tasks/${t.id}`}>{t.task}</Link></td>
                  <td>{t.owner_name || <span className="missing">No owner</span>}</td>
                  <td>{t.reviewer_name}</td>
                  <td><Priority value={t.priority} /></td>
                  <td className="nowrap">{fmt(t.internal_deadline)}</td>
                  <td className="nowrap">{fmt(t.client_deadline)}</td>
                  <td>
                    {user.canEdit
                      ? <StatusSelect key={`${t.id}-${t.status}`} id={t.id} value={t.status} label={`Status of ${t.code}`} />
                      : t.status}
                  </td>
                  <td><Flag value={t.flag} /></td>
                  <td>{t.onTime === 'No' ? <span className="late">No, {t.daysLate}d late</span> : t.onTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
