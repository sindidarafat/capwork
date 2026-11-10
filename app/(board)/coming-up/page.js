import { requireUser } from '@/lib/session';
import Link from 'next/link';
import { getTasks, getTeam, getBuffer, comingUp } from '@/lib/board';
import { fmtShort, today } from '@/lib/dates';
import { PageHead, Priority, TypeTag, Empty, pct, hrs } from '@/components/bits';

export default async function ComingUpPage() {
  await requireUser();
  const [tasks, team, buffer] = await Promise.all([getTasks(), getTeam({ activeOnly: true }), getBuffer()]);
  const { days, people, upcoming } = comingUp(tasks, team, buffer, today());

  return (
    <>
      <PageHead
        title="Coming Up"
        lead={`Who is carrying what over the next six working days (Sunday to Thursday). Load adds a ${Math.round(buffer * 100)}% buffer to estimates.`}
      />

      <div className="table-wrap">
        <table className="grid load-grid">
          <thead>
            <tr>
              <th>Person</th><th>Team</th><th className="num">Overdue</th>
              {days.map((d) => <th key={d} className="num nowrap">{fmtShort(d)}</th>)}
              <th className="num">Open est. hrs</th><th className="num">Hrs due (+buffer)</th><th className="num">Capacity</th><th className="num">Load</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td className="strong"><Link href={`/tasks?owner=${p.id}`}>{p.name}</Link></td>
                <td className="muted">{p.team}</td>
                <td className={p.overdue ? 'num cell-bad' : 'num'}>{p.overdue || ''}</td>
                {p.perDay.map((n, i) => <td key={days[i]} className={n ? 'num cell-due' : 'num'}>{n || ''}</td>)}
                <td className="num">{hrs(p.openHrs)}</td>
                <td className="num">{hrs(p.hrsDue)}</td>
                <td className="num">{hrs(p.capacity)}</td>
                <td className={`num ${p.load > 1 ? 'cell-bad' : p.load >= 0.8 ? 'cell-warn' : ''}`}>{p.load ? pct(p.load) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footnote">Numbers in the day columns are open tasks due that day. Load over 100% means more hours due than the person has. Hours only count when estimates are filled in.</p>

      <h2 className="section-title">Due in the next 14 days</h2>
      {upcoming.length === 0 ? <Empty>Nothing with a deadline in the next two weeks.</Empty> : (
        <div className="table-wrap">
          <table className="grid">
            <thead><tr><th>Deadline</th><th>ID</th><th>Client / Prospect</th><th>Task</th><th>Owner</th><th>Priority</th><th>Status</th><th className="num">Est. hrs</th></tr></thead>
            <tbody>
              {upcoming.map((t) => (
                <tr key={t.id} className={t.work_type === 'Pitch' ? 'row-pitch' : ''}>
                  <td className="nowrap strong">{fmtShort(t.internal_deadline)}</td>
                  <td><Link href={`/tasks/${t.id}`} className="code">{t.code}</Link></td>
                  <td>{t.client_name} <TypeTag value={t.work_type} /></td>
                  <td className="task-cell"><Link href={`/tasks/${t.id}`}>{t.task}</Link></td>
                  <td>{t.owner_name || <span className="missing">No owner</span>}</td>
                  <td><Priority value={t.priority} /></td>
                  <td>{t.status}</td>
                  <td className="num">{hrs(t.est_hours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
