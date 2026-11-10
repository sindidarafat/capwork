'use client';

import { useFormStatus } from 'react-dom';
import { setStatus } from '@/app/(board)/actions';

const STATUSES = ['Not started', 'In progress', 'Internal review', 'Client review', 'Revisions', 'Done', 'On hold'];

function Picker({ value, label }) {
  const { pending } = useFormStatus();
  return (
    <select
      name="status"
      defaultValue={value}
      disabled={pending}
      aria-label={label}
      className={pending ? 'status-select saving' : 'status-select'}
      onChange={(e) => e.currentTarget.form.requestSubmit()}
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

export default function StatusSelect({ id, value, label }) {
  return (
    <form action={setStatus} className="status-form">
      <input type="hidden" name="id" value={id} />
      <Picker value={value} label={label} />
    </form>
  );
}
