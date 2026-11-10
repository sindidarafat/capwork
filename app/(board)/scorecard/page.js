import { requireUser } from '@/lib/session';
import { getTasks, getTeam, scorecard } from '@/lib/board';
import { today, startOfWeek, fmt } from '@/lib/dates';
import { PageHead, pct, hrs } from '@/components/bits';

const valid = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default async function ScorecardPage({ searchParams }) {
  const sp = await searchParams;
  const now = today();
  const from = valid(sp.from) ? sp.from : startOfWeek(now);
  const to = valid(sp.to) ? sp.to : now;
  await requireUser();
  const [tasks, team] = await Promise.all([getTasks(), getTeam({ activeOnly: true })]);
  const { rows, total } = scorecard(tasks, team, from, to);
  const avg = (v) => (v === null ? '' : (Math.round(v * 10) / 10).toString());

  return (
    <>
      <PageHead title="Scorecard" lead={`Delivery and reliability per person, ${fmt(from)} to ${fmt(to)}. Reviewed every Thursday.`} />
      <form className="filters" method="get">
        <label><span>From</span><input type="date" name="from" defaultValue={from} /></label>
        <label><span>To</span><input type="date" name="to" defaultValue={to} /></label>
        <button className="btn btn-ghost btn-sm" type="submit">Show</button>
        <a className="btn btn-link btn-sm" href="/scorecard">This week</a>
      </form>

      <div className="table-wrap">
        <table className="grid score-grid">
          <thead>
            <tr>
              <th>Person</th><th>Team</th><th className="num">Open now</th><th className="num">Overdue now</th>
              <th className="num">Delivered</th><th className="num">On time</th><th className="num">On-time %</th>
              <th className="num">Avg revisions</th><th className="num">First-round approval</th>
              <th className="num">Est. hrs</th><th className="num">Actual hrs</th><th className="num">Estimate accuracy</th>
              <th className="num">Reviews waiting</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="strong">{r.name}</td>
                <td className="muted">{r.team}</td>
                <td className="num">{r.open || ''}</td>
                <td className={r.overdue ? 'num cell-bad' : 'num'}>{r.overdue || ''}</td>
                <td className="num">{r.delivered || ''}</td>
                <td className="num">{r.onTime || ''}</td>
                <td className={r.onTimePct !== null && r.onTimePct < 0.8 ? 'num text-bad' : 'num'}>{pct(r.onTimePct)}</td>
                <td className="num">{avg(r.avgRevisions)}</td>
                <td className="num">{pct(r.firstRoundPct)}</td>
                <td className="num">{hrs(r.est)}</td>
                <td className="num">{hrs(r.actual)}</td>
                <td className="num">{pct(r.accuracy)}</td>
                <td className={r.reviewsWaiting ? 'num cell-warn' : 'num'}>{r.reviewsWaiting || ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="strong">Whole team</td><td />
              <td className="num">{total.open}</td><td className="num">{total.overdue}</td>
              <td className="num">{total.delivered}</td><td className="num">{total.onTime}</td>
              <td className="num">{pct(total.onTimePct)}</td><td className="num">{avg(total.avgRevisions)}</td>
              <td className="num">{pct(total.firstRoundPct)}</td><td className="num">{hrs(total.est)}</td>
              <td className="num">{hrs(total.actual)}</td><td className="num">{pct(total.accuracy)}</td>
              <td className="num">{total.reviewsWaiting}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <section className="explain">
        <h2>How each measure works</h2>
        <dl>
          <dt>Delivered</dt><dd>Tasks the person sent for review (Delivered on) inside the period.</dd>
          <dt>On time</dt><dd>Delivered on or before the internal deadline. Time waiting on a client never counts against anyone.</dd>
          <dt>Avg revisions</dt><dd>Revision rounds per delivered task. Lower means briefs and first drafts are landing.</dd>
          <dt>First-round approval</dt><dd>Share of delivered tasks approved without changes.</dd>
          <dt>Estimate accuracy</dt><dd>Estimated hours divided by actual hours. 100% means estimates were right; 70% means work took about 40% longer than planned.</dd>
          <dt>Reviews waiting</dt><dd>Tasks in Internal review where this person is the reviewer.</dd>
        </dl>
      </section>
    </>
  );
}
