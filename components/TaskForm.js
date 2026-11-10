import SubmitButton from './SubmitButton';
import { STATUSES, PRIORITIES } from '@/lib/board';

function Field({ label, hint, children, wide }) {
  return (
    <label className={wide ? 'field field-wide' : 'field'}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

function People({ name, value, team, placeholder }) {
  return (
    <select name={name} defaultValue={value ?? ''}>
      <option value="">{placeholder}</option>
      {team.map((m) => <option key={m.id} value={m.id}>{m.name}{m.active ? '' : ' (inactive)'}</option>)}
    </select>
  );
}

// One form for both new and existing tasks. `action` is a server action.
export default function TaskForm({ action, task = {}, clients, team, submitLabel }) {
  const t = task;
  return (
    <form action={action} className="task-form">
      <fieldset>
        <legend>The task</legend>
        <div className="fields">
          <Field label="Client / Prospect *">
            <select name="client_id" defaultValue={t.client_id ?? ''} required>
              <option value="" disabled>Pick one</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
            </select>
          </Field>
          <Field label="Priority *">
            <select name="priority" defaultValue={t.priority ?? ''} required>
              <option value="" disabled>Pick one</option>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Task / Deliverable *" wide hint='Short and specific: "FIF reel thumbnail, 3 options", not "thumbnail".'>
            <input name="task" defaultValue={t.task ?? ''} required maxLength={200} />
          </Field>
          <Field label="Brief / Description" wide hint="One line, or a link to the brief.">
            <textarea name="brief" defaultValue={t.brief ?? ''} rows={2} />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend>People and timing</legend>
        <div className="fields">
          <Field label="Owner" hint="One person. Required before work starts.">
            <People name="owner_id" value={t.owner_id} team={team} placeholder="Not assigned yet" />
          </Field>
          <Field label="Reviewer">
            <People name="reviewer_id" value={t.reviewer_id} team={team} placeholder="No reviewer" />
          </Field>
          <Field label="Start date"><input type="date" name="start_date" defaultValue={t.start_date ?? ''} /></Field>
          <Field label="Internal deadline" hint="When it goes for internal review. At least a working day before the client deadline.">
            <input type="date" name="internal_deadline" defaultValue={t.internal_deadline ?? ''} />
          </Field>
          <Field label="Client deadline"><input type="date" name="client_deadline" defaultValue={t.client_deadline ?? ''} /></Field>
          <Field label="Est. hours" hint="Asked from the owner.">
            <input type="number" name="est_hours" min="0" step="0.5" defaultValue={t.est_hours ?? ''} />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend>Progress</legend>
        <div className="fields">
          <Field label="Status" hint="Moving to Internal review, Client review or Done fills in Delivered on for you.">
            <select name="status" defaultValue={t.status ?? 'Not started'}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Blocked by" hint="Only when waiting on someone else. Clear it once unblocked.">
            <input name="blocked_by" defaultValue={t.blocked_by ?? ''} placeholder="e.g. Client approval of copy" />
          </Field>
          <Field label="Blocked since"><input type="date" name="blocked_since" defaultValue={t.blocked_since ?? ''} /></Field>
          <Field label="Delivered on" hint="Date first sent for review. Decides on time or late.">
            <input type="date" name="delivered_on" defaultValue={t.delivered_on ?? ''} />
          </Field>
          <Field label="Completed on"><input type="date" name="completed_on" defaultValue={t.completed_on ?? ''} /></Field>
          <Field label="Actual hours"><input type="number" name="actual_hours" min="0" step="0.5" defaultValue={t.actual_hours ?? ''} /></Field>
          <Field label="Revisions" hint="Rounds of changes, internal and client.">
            <input type="number" name="revisions" min="0" step="1" defaultValue={t.revisions ?? 0} />
          </Field>
          <Field label="First-round approved?">
            <select name="first_round" defaultValue={t.first_round ?? ''}>
              <option value="">Not yet</option><option>Yes</option><option>No</option>
            </select>
          </Field>
          <Field label="Notes" wide><textarea name="notes" defaultValue={t.notes ?? ''} rows={3} /></Field>
        </div>
      </fieldset>

      <div className="form-actions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <a href={t.id ? `/tasks/${t.id}` : '/tasks'} className="btn btn-link">Cancel</a>
      </div>
    </form>
  );
}
