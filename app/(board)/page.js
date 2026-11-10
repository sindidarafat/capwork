import Link from 'next/link';
import { getTasks, getTeam, todayList, boardStats } from '@/lib/board';
import { requireUser } from '@/lib/session';
import { today, fmtLong, fmt } from '@/lib/dates';
import { Flag, Priority, TypeTag, PageHead, Empty, hrs } from '@/components/bits';
import StatusSelect from '@/components/StatusSelect';

export default async function TodayPage({ searchParams }) {
  const sp = await searchParams;
  const [user, tasks, team] = await Promise.all([requireUser(), getTasks(), getTeam({ activeOnly: true })]);
  const now = today();
  const stats = boardStats(tasks);

  const who = sp.who === 'me' && user.memberId ? String(user.memberId) : sp.who || '';
  let list = todayList(tasks, now);
  if (who) list = list.filter((t) => String(t.owner_id) === who);

  const STAT_TILES = [
    ['Open tasks', stats.open, ''],
    ['Overdue', stats.overdue, stats.overdue ? 'tile-bad' : ''],
    ['Due today', stats.dueToday, stats.dueToday ? 'tile-warn' : ''],
    ['Blocked', stats.blocked, stats.blocked ? 'tile-blocked' : ''],
    ['No deadline', stats.noDeadline, stats.noDeadline ? 'tile-muted' : ''],
    ['Open pitch tasks', stats.pitch, stats.pitch ? 'tile-pitch' : ''],
    ['No owner', stats.noOwner, stats.noOwner ? 'tile-muted' : ''],
  ];

  return (
    <>
      <PageHead title="Today" lead={fmtLong(now)}>
        {user.canEdit && <Link href="/tasks/new" className="btn btn-primary">New task</Link>}
      </PageHead>

      <section className="tiles" aria-label="Board summary">
        {STAT_TILES.map(([label, value, cls]) => (
          <div key={label} className={`tile ${cls}`}>
            <span className="tile-value">{value}</span>
            <span className="tile-label">{label}</span>
          </div>
        ))}
      </section>

      <form className="filters" method="get">
        <label>
          <span>Showing</span>
          <select name="who" defaultValue={sp.who === 'me' ? 'me' : who}>
            <option value="">Everyone</option>
            {user.memberId && <option value="me">Only my tasks</option>}
            {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <button className="btn btn-ghost btn-sm" type="submit">Apply</button>
        <span className="filters-note">Ranked by urgency. Orange rows are pitch work.</span>
      </form>

      {list.length === 0 ? (
        <Empty>Nothing needs attention today{who ? ' for this person' : ''}.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="grid cards-on-phone">
            <thead>
              <tr>
                <th className="num">#</th><th>ID</th><th>Client / Prospect</th><th>Task</th><th>Owner</th>
                <th>Priority</th><th>Internal deadline</th><th>Status</th><th>Blocked by</th><th>Flag</th>
                <th className="num">Urgency</th><th className="num">Est. hrs</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t, i) => (
                <tr key={t.id} className={t.work_type === 'Pitch' ? 'row-pitch' : ''}>
                  <td className="num rank" data-label="#">{i + 1}</td>
                  <td data-label="ID"><Link href={`/tasks/${t.id}`} className="code">{t.code}</Link></td>
                  <td data-label="Client">{t.client_name} <TypeTag value={t.work_type} /></td>
                  <td className="task-cell" data-label="Task"><Link href={`/tasks/${t.id}`}>{t.task}</Link></td>
                  <td data-label="Owner">{t.owner_name || <span className="missing">No owner</span>}</td>
                  <td data-label="Priority"><Priority value={t.priority} /></td>
                  <td className="nowrap" data-label="Deadline">{fmt(t.internal_deadline)}</td>
                  <td data-label="Status">
                    {user.canEdit
                      ? <StatusSelect key={`${t.id}-${t.status}`} id={t.id} value={t.status} label={`Status of ${t.code}`} />
                      : t.status}
                  </td>
                  <td data-label="Blocked by" className={t.blocked_by ? "" : "phone-hide"}>{t.blocked_by}{t.daysBlocked ? <span className="sub"> {t.daysBlocked}d</span> : null}</td>
                  <td data-label="Flag"><Flag value={t.flag} /></td>
                  <td className="num" data-label="Urgency">{t.urgency}</td>
                  <td className={t.est_hours ? "num" : "num phone-hide"} data-label="Est. hrs">{hrs(t.est_hours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="footnote">
        Shown here: every open task due within 2 days, overdue, without a deadline, or already in progress, review or revisions.
        Everything else is on <Link href="/coming-up">Coming Up</Link> and the <Link href="/tasks">Task Log</Link>.
      </p>
    </>
  );
}
