import Link from 'next/link';
import { getTeam, getBuffer } from '@/lib/board';
import { requireUser } from '@/lib/session';
import { PageHead, Saved } from '@/components/bits';
import SubmitButton from '@/components/SubmitButton';
import { saveMember, saveBuffer } from '../actions';

function MemberFields({ m = {}, isAdmin }) {
  return (
    <div className="fields fields-inline">
      {m.id && <input type="hidden" name="id" value={m.id} />}
      <label className="field"><span className="field-label">Name *</span><input name="name" defaultValue={m.name ?? ''} required /></label>
      <label className="field"><span className="field-label">Role</span><input name="role" defaultValue={m.role ?? ''} /></label>
      <label className="field"><span className="field-label">Team</span><input name="team" defaultValue={m.team ?? ''} list="team-names" /></label>
      <label className="field field-wide"><span className="field-label">Work email (Microsoft 365)</span><input type="email" name="email" defaultValue={m.email ?? ''} placeholder="name@yourcompany.com" /></label>
      <label className="field"><span className="field-label">Daily capacity (hrs)</span><input type="number" name="capacity" min="0" max="24" step="0.5" defaultValue={m.capacity ?? 6} /></label>
      <label className="check"><input type="checkbox" name="active" defaultChecked={m.active ?? true} /> Active</label>
      {isAdmin && <label className="check"><input type="checkbox" name="can_edit" defaultChecked={m.can_edit ?? false} /> Can edit the board</label>}
      <label className="field field-wide"><span className="field-label">Notes</span><input name="notes" defaultValue={m.notes ?? ''} /></label>
    </div>
  );
}

export default async function TeamPage({ searchParams }) {
  const sp = await searchParams;
  const [user, team, buffer] = await Promise.all([requireUser(), getTeam(), getBuffer()]);

  return (
    <>
      <Saved show={sp.saved === '1'} />
      <PageHead title="Team" lead="Names, roles and daily capacity. A person's work email links their Microsoft sign-in to their tasks." />
      <datalist id="team-names">
        {[...new Set(team.map((m) => m.team).filter(Boolean))].map((t) => <option key={t} value={t} />)}
      </datalist>

      {user.canEdit && (
        <div className="team-tools">
          <details className="card add-card">
            <summary className="btn btn-primary">Add a team member</summary>
            <form action={saveMember} className="inline-form">
              <MemberFields isAdmin={user.isAdmin} />
              <SubmitButton>Add</SubmitButton>
            </form>
          </details>
          <form action={saveBuffer} className="card buffer-form">
            <label className="field"><span className="field-label">Estimate buffer</span>
              <span className="with-unit"><input type="number" name="buffer" min="0" max="200" step="5" defaultValue={Math.round(buffer * 100)} />%</span>
              <span className="field-hint">Added to estimates when Coming Up checks each person's load.</span>
            </label>
            <SubmitButton className="btn btn-ghost btn-sm">Save buffer</SubmitButton>
          </form>
        </div>
      )}

      {user.canEdit && !user.isAdmin && <p className="hint-line">Only admins can decide who can edit the board.</p>}

      <div className="table-wrap">
        <table className="grid">
          <thead><tr><th>Name</th><th>Role</th><th>Team</th><th>Work email</th><th className="num">Capacity / day</th><th>Access</th><th>Notes</th>{user.canEdit && <th />}</tr></thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id} className={m.active ? '' : 'row-inactive'}>
                <td className="strong"><Link href={`/tasks?owner=${m.id}`}>{m.name}</Link>{!m.active && <span className="sub"> (inactive)</span>}</td>
                <td>{m.role}</td>
                <td className="muted">{m.team}</td>
                <td>{m.email || <span className="missing">Not linked</span>}</td>
                <td className="num">{m.capacity}</td>
                <td>{m.can_edit ? <span className="role role-edit">Editor</span> : <span className="role">Viewer</span>}</td>
                <td className="muted">{m.notes}</td>
                {user.canEdit && (
                  <td>
                    <details className="row-edit">
                      <summary className="btn btn-link btn-sm">Edit</summary>
                      <form action={saveMember} className="inline-form pop">
                        <MemberFields m={m} isAdmin={user.isAdmin} />
                        <SubmitButton>Save</SubmitButton>
                      </form>
                    </details>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footnote">People who leave are marked inactive rather than removed, so their task history stays intact.</p>
    </>
  );
}
