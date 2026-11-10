import Link from 'next/link';
import { getClients, getTasks, getTeam, WORK_TYPES, ACCOUNT_STATUSES, isOpen } from '@/lib/board';
import { requireUser } from '@/lib/session';
import { PageHead, TypeTag, Saved, hrs } from '@/components/bits';
import SubmitButton from '@/components/SubmitButton';
import { saveClient } from '../actions';

function ClientFields({ c = {}, team }) {
  return (
    <div className="fields fields-inline">
      {c.id && <input type="hidden" name="id" value={c.id} />}
      <label className="field"><span className="field-label">Name *</span><input name="name" defaultValue={c.name ?? ''} required /></label>
      <label className="field"><span className="field-label">Type *</span>
        <select name="type" defaultValue={c.type ?? 'Client'}>{WORK_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label className="field"><span className="field-label">Account lead</span>
        <select name="lead_id" defaultValue={c.lead_id ?? ''}><option value="">None</option>{team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
      </label>
      <label className="field"><span className="field-label">Account status</span>
        <select name="status" defaultValue={c.status ?? ''}><option value="">Not set</option>{ACCOUNT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      </label>
      <label className="field field-wide"><span className="field-label">Notes</span><input name="notes" defaultValue={c.notes ?? ''} /></label>
    </div>
  );
}

export default async function ClientsPage({ searchParams }) {
  const sp = await searchParams;
  const [user, clients, tasks, team] = await Promise.all([requireUser(), getClients(), getTasks(), getTeam({ activeOnly: true })]);

  return (
    <>
      <Saved show={sp.saved === '1'} />
      <PageHead title="Clients & Pitches" lead="Every client and prospect. Type decides whether its tasks count as client, pitch or internal work. When a pitch is won, change its type to Client." />

      {user.canEdit && (
        <details className="card add-card">
          <summary className="btn btn-primary">Add a client or prospect</summary>
          <form action={saveClient} className="inline-form">
            <ClientFields team={team} />
            <SubmitButton>Add</SubmitButton>
          </form>
        </details>
      )}

      <div className="table-wrap">
        <table className="grid">
          <thead><tr><th>Client / Prospect</th><th>Type</th><th>Account lead</th><th>Status</th><th className="num">Open tasks</th><th className="num">Overdue</th><th className="num">Open est. hrs</th><th>Notes</th>{user.canEdit && <th />}</tr></thead>
          <tbody>
            {clients.map((c) => {
              const mine = tasks.filter((t) => t.client_id === c.id);
              const open = mine.filter(isOpen);
              return (
                <tr key={c.id} className={c.type === 'Pitch' ? 'row-pitch' : ''}>
                  <td className="strong"><Link href={`/tasks?client=${c.id}&show=all`}>{c.name}</Link></td>
                  <td><TypeTag value={c.type} /></td>
                  <td>{c.lead_name}</td>
                  <td>{c.status}</td>
                  <td className="num">{open.length || ''}</td>
                  <td className={mine.some((t) => t.flag === 'Overdue') ? 'num cell-bad' : 'num'}>{mine.filter((t) => t.flag === 'Overdue').length || ''}</td>
                  <td className="num">{hrs(open.reduce((s, t) => s + (t.est_hours || 0), 0))}</td>
                  <td className="muted">{c.notes}</td>
                  {user.canEdit && (
                    <td>
                      <details className="row-edit">
                        <summary className="btn btn-link btn-sm">Edit</summary>
                        <form action={saveClient} className="inline-form pop">
                          <ClientFields c={c} team={team} />
                          <SubmitButton>Save</SubmitButton>
                        </form>
                      </details>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
