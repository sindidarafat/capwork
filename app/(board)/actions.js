'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { q, tx } from '@/lib/db';
import { requireEditor } from '@/lib/session';
import { today } from '@/lib/dates';
import { STATUSES, PRIORITIES, WORK_TYPES, ACCOUNT_STATUSES } from '@/lib/board';
import { signOut } from '@/auth';

const TASK_FIELDS = {
  client_id: 'Client / Prospect', task: 'Task', brief: 'Brief', owner_id: 'Owner', reviewer_id: 'Reviewer',
  priority: 'Priority', start_date: 'Start date', internal_deadline: 'Internal deadline', client_deadline: 'Client deadline',
  est_hours: 'Est. hours', status: 'Status', blocked_by: 'Blocked by', blocked_since: 'Blocked since',
  delivered_on: 'Delivered on', completed_on: 'Completed on', actual_hours: 'Actual hours', revisions: 'Revisions',
  first_round: 'First-round approved', notes: 'Notes',
};
const DATE_FIELDS = ['start_date', 'internal_deadline', 'client_deadline', 'blocked_since', 'delivered_on', 'completed_on'];

function text(fd, k) {
  const v = fd.get(k);
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}
function int(fd, k) {
  const s = text(fd, k);
  if (s === null) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}
function num(fd, k) {
  const s = text(fd, k);
  if (s === null) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function date(fd, k) {
  const s = text(fd, k);
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function readTask(fd) {
  const t = {
    client_id: int(fd, 'client_id'), task: text(fd, 'task'), brief: text(fd, 'brief'),
    owner_id: int(fd, 'owner_id'), reviewer_id: int(fd, 'reviewer_id'), priority: text(fd, 'priority'),
    est_hours: num(fd, 'est_hours'), status: text(fd, 'status') || 'Not started',
    blocked_by: text(fd, 'blocked_by'), actual_hours: num(fd, 'actual_hours'),
    revisions: int(fd, 'revisions') ?? 0, first_round: text(fd, 'first_round'), notes: text(fd, 'notes'),
  };
  for (const k of DATE_FIELDS) t[k] = date(fd, k);
  if (!t.client_id) throw new Error('Pick a client or prospect.');
  if (!t.task) throw new Error('Give the task a name.');
  if (!PRIORITIES.includes(t.priority)) throw new Error('Pick a priority.');
  if (!STATUSES.includes(t.status)) throw new Error('Pick a valid status.');
  if (t.first_round && !['Yes', 'No'].includes(t.first_round)) t.first_round = null;
  if (t.revisions < 0) t.revisions = 0;
  return t;
}

// Fill the dates the Scorecard depends on, so nobody has to remember them.
function applyStatusRules(prev, next, { manualRevisions = false } = {}) {
  const now = today();
  if (next.status !== prev?.status) {
    if (['Internal review', 'Client review', 'Done'].includes(next.status) && !next.delivered_on) next.delivered_on = now;
    if (next.status === 'Done' && !next.completed_on) next.completed_on = now;
    if (next.status === 'Revisions' && prev && prev.status !== 'Revisions' && !manualRevisions) {
      next.revisions = (prev.revisions || 0) + 1;
    }
  }
  if (next.blocked_by && !next.blocked_since) next.blocked_since = now;
  return next;
}

function diff(prev, next) {
  const out = {};
  for (const k of Object.keys(TASK_FIELDS)) {
    const a = prev ? prev[k] ?? null : null;
    const b = next[k] ?? null;
    if (String(a ?? '') !== String(b ?? '')) out[k] = { from: a, to: b };
  }
  return out;
}

async function labelChanges(client, changes) {
  const ids = new Set();
  for (const k of ['owner_id', 'reviewer_id']) if (changes[k]) { ids.add(changes[k].from); ids.add(changes[k].to); }
  const cids = new Set();
  if (changes.client_id) { cids.add(changes.client_id.from); cids.add(changes.client_id.to); }
  const people = {};
  const clients = {};
  const pIds = [...ids].filter(Boolean);
  const cIds = [...cids].filter(Boolean);
  if (pIds.length) (await client.query('select id, name from team where id = any($1)', [pIds])).rows.forEach((r) => { people[r.id] = r.name; });
  if (cIds.length) (await client.query('select id, name from clients where id = any($1)', [cIds])).rows.forEach((r) => { clients[r.id] = r.name; });
  const out = {};
  for (const [k, v] of Object.entries(changes)) {
    const map = k === 'client_id' ? clients : k === 'owner_id' || k === 'reviewer_id' ? people : null;
    out[TASK_FIELDS[k]] = map ? { from: map[v.from] ?? null, to: map[v.to] ?? null } : v;
  }
  return out;
}

const COLS = Object.keys(TASK_FIELDS);

export async function createTask(formData) {
  const user = await requireEditor();
  const t = applyStatusRules(null, readTask(formData));
  const id = await tx(async (client) => {
    const vals = COLS.map((k) => t[k] ?? null);
    const placeholders = COLS.map((_, i) => `$${i + 1}`).join(',');
    const r = await client.query(
      `insert into tasks (${COLS.join(',')}, date_added, created_by, updated_by)
       values (${placeholders}, $${COLS.length + 1}, $${COLS.length + 2}, $${COLS.length + 2}) returning id`,
      [...vals, today(), user.name]
    );
    const newId = r.rows[0].id;
    await client.query("insert into task_history (task_id, changed_by, action) values ($1, $2, 'created')", [newId, user.name]);
    return newId;
  });
  revalidatePath('/', 'layout');
  redirect(`/tasks/${id}?saved=1`);
}

export async function updateTask(id, formData) {
  const user = await requireEditor();
  const incoming = readTask(formData);
  await tx(async (client) => {
    const prev = (await client.query('select * from tasks where id = $1 for update', [id])).rows[0];
    if (!prev) throw new Error('That task no longer exists.');
    const manualRevisions = incoming.revisions !== (prev.revisions || 0);
    const next = applyStatusRules(prev, incoming, { manualRevisions });
    const changes = diff(prev, next);
    if (!Object.keys(changes).length) return;
    const sets = COLS.map((k, i) => `${k} = $${i + 1}`).join(', ');
    await client.query(
      `update tasks set ${sets}, updated_at = now(), updated_by = $${COLS.length + 1} where id = $${COLS.length + 2}`,
      [...COLS.map((k) => next[k] ?? null), user.name, id]
    );
    await client.query(
      "insert into task_history (task_id, changed_by, action, changes) values ($1, $2, 'updated', $3)",
      [id, user.name, JSON.stringify(await labelChanges(client, changes))]
    );
  });
  revalidatePath('/', 'layout');
  redirect(`/tasks/${id}?saved=1`);
}

// The quick status dropdown on the Today and Task Log pages.
export async function setStatus(formData) {
  const user = await requireEditor();
  const id = int(formData, 'id');
  const status = text(formData, 'status');
  if (!id || !STATUSES.includes(status)) return;
  await tx(async (client) => {
    const prev = (await client.query('select * from tasks where id = $1 for update', [id])).rows[0];
    if (!prev || prev.status === status) return;
    const next = applyStatusRules(prev, { ...prev, status });
    const changes = diff(prev, next);
    await client.query(
      `update tasks set status = $1, delivered_on = $2, completed_on = $3, revisions = $4, blocked_since = $5,
       updated_at = now(), updated_by = $6 where id = $7`,
      [next.status, next.delivered_on, next.completed_on, next.revisions, next.blocked_since, user.name, id]
    );
    await client.query(
      "insert into task_history (task_id, changed_by, action, changes) values ($1, $2, 'updated', $3)",
      [id, user.name, JSON.stringify(await labelChanges(client, changes))]
    );
  });
  revalidatePath('/', 'layout');
}

export async function saveClient(formData) {
  await requireEditor();
  const id = int(formData, 'id');
  const name = text(formData, 'name');
  const type = text(formData, 'type');
  const status = text(formData, 'status');
  if (!name) throw new Error('A client needs a name.');
  if (!WORK_TYPES.includes(type)) throw new Error('Pick Client, Pitch or Internal.');
  const vals = [name, type, int(formData, 'lead_id'), ACCOUNT_STATUSES.includes(status) ? status : null, text(formData, 'notes')];
  try {
    if (id) await q('update clients set name=$1, type=$2, lead_id=$3, status=$4, notes=$5 where id=$6', [...vals, id]);
    else await q('insert into clients (name, type, lead_id, status, notes) values ($1,$2,$3,$4,$5)', vals);
  } catch (e) {
    if (e.code === '23505') throw new Error(`There is already a client called "${name}".`);
    throw e;
  }
  revalidatePath('/', 'layout');
  redirect('/clients?saved=1');
}

export async function saveMember(formData) {
  const user = await requireEditor();
  const id = int(formData, 'id');
  const name = text(formData, 'name');
  if (!name) throw new Error('A team member needs a name.');
  const email = text(formData, 'email')?.toLowerCase() || null;
  const capacity = num(formData, 'capacity') ?? 6;
  const active = formData.get('active') === 'on';
  const vals = [name, text(formData, 'role'), text(formData, 'team'), email, capacity, active, text(formData, 'notes')];
  try {
    if (id) {
      await q('update team set name=$1, role=$2, team=$3, email=$4, capacity=$5, active=$6, notes=$7 where id=$8', [...vals, id]);
      if (user.isAdmin) await q('update team set can_edit=$1 where id=$2', [formData.get('can_edit') === 'on', id]);
    } else {
      const canEdit = user.isAdmin && formData.get('can_edit') === 'on';
      await q('insert into team (name, role, team, email, capacity, active, notes, can_edit) values ($1,$2,$3,$4,$5,$6,$7,$8)', [...vals, canEdit]);
    }
  } catch (e) {
    if (e.code === '23505') throw new Error('That name or email is already on the team list.');
    throw e;
  }
  revalidatePath('/', 'layout');
  redirect('/team?saved=1');
}

export async function saveBuffer(formData) {
  await requireEditor();
  const pct = num(formData, 'buffer');
  if (pct === null || pct > 200) throw new Error('Enter a buffer between 0 and 200%.');
  await q("insert into settings (key, value) values ('buffer', $1) on conflict (key) do update set value = excluded.value", [String(pct / 100)]);
  revalidatePath('/', 'layout');
  redirect('/team?saved=1');
}

export async function doSignOut() {
  await signOut({ redirectTo: '/signin' });
}
