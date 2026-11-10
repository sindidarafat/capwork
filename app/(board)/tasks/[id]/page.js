import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTask, getHistory, getClients, getTeam } from '@/lib/board';
import { requireUser } from '@/lib/session';
import { fmt, fmtStamp } from '@/lib/dates';
import { Flag, Priority, TypeTag, Saved, hrs } from '@/components/bits';
import TaskForm from '@/components/TaskForm';
import { updateTask } from '../../actions';

function show(v) {
  if (v === null || v === undefined || v === '') return '(empty)';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return fmt(v);
  return String(v);
}

function Row({ label, children }) {
  return (<div className="kv"><dt>{label}</dt><dd>{children || <span className="muted">Not set</span>}</dd></div>);
}

export default async function TaskPage({ params, searchParams }) {
  const { id: raw } = await params;
  const sp = await searchParams;
  const id = parseInt(raw, 10);
  if (!Number.isFinite(id)) notFound();
  const [user, task, history] = await Promise.all([requireUser(), getTask(id), getHistory(id)]);
  if (!task) notFound();

  const [clients, team] = user.canEdit ? await Promise.all([getClients(), getTeam()]) : [[], []];

  return (
    <>
      <Saved show={sp.saved === '1'}>Saved.</Saved>
      <div className="page-head">
        <div>
          <p className="crumb"><Link href="/tasks">Task Log</Link> / {task.code}</p>
          <h1>{task.task}</h1>
          <p className="lead tags">
            {task.client_name} <TypeTag value={task.work_type} /> <Priority value={task.priority} /> <Flag value={task.flag} />
          </p>
        </div>
      </div>

      <div className="detail">
        <div className="detail-main">
          {user.canEdit ? (
            <TaskForm action={updateTask.bind(null, task.id)} task={task} clients={clients} team={team} submitLabel="Save changes" />
          ) : (
            <dl className="kvs">
              <Row label="Brief">{task.brief}</Row>
              <Row label="Owner">{task.owner_name}</Row>
              <Row label="Reviewer">{task.reviewer_name}</Row>
              <Row label="Status">{task.status}</Row>
              <Row label="Start date">{fmt(task.start_date)}</Row>
              <Row label="Internal deadline">{fmt(task.internal_deadline)}</Row>
              <Row label="Client deadline">{fmt(task.client_deadline)}</Row>
              <Row label="Est. hours">{hrs(task.est_hours)}</Row>
              <Row label="Blocked by">{task.blocked_by && `${task.blocked_by}${task.blocked_since ? `, since ${fmt(task.blocked_since)}` : ''}`}</Row>
              <Row label="Delivered on">{fmt(task.delivered_on)}</Row>
              <Row label="Completed on">{fmt(task.completed_on)}</Row>
              <Row label="Actual hours">{hrs(task.actual_hours)}</Row>
              <Row label="Revisions">{String(task.revisions ?? 0)}</Row>
              <Row label="First-round approved?">{task.first_round}</Row>
              <Row label="On time?">{task.onTime === 'No' ? `No, ${task.daysLate} days late` : task.onTime}</Row>
              <Row label="Notes">{task.notes}</Row>
            </dl>
          )}
        </div>

        <aside className="detail-side">
          <h2>History</h2>
          <p className="muted small">Added {fmt(task.date_added)}. Every change is recorded here with who made it.</p>
          <ol className="history">
            {history.map((h) => (
              <li key={h.id}>
                <div className="history-head"><strong>{h.changed_by || 'Someone'}</strong> <span className="muted">{fmtStamp(h.changed_at)}</span></div>
                {h.action === 'created' ? <div className="small">Created the task</div> : (
                  <ul className="changes">
                    {Object.entries(h.changes || {}).map(([field, v]) => (
                      <li key={field}><span className="field-name">{field}</span>: {show(v.from)} → <strong>{show(v.to)}</strong></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
