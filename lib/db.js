import pg from 'pg';
import { SEED } from './seed';

// Return DATE columns as plain 'YYYY-MM-DD' strings and NUMERIC as numbers,
// so dates never shift with the server's time zone.
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));

export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

function makePool() {
  const url = databaseUrl();
  if (!url) throw new Error('DATABASE_URL is not set');
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url) || url.includes('host=/');
  return new pg.Pool({
    connectionString: url,
    ssl: local || url.includes('sslmode=') ? undefined : { rejectUnauthorized: true },
    max: 5,
    idleTimeoutMillis: 10000,
  });
}

const g = globalThis;
function pool() {
  if (!g.__capPool) g.__capPool = makePool();
  return g.__capPool;
}

const SCHEMA = `
create table if not exists team (
  id serial primary key,
  name text not null unique,
  role text,
  team text,
  email text unique,
  capacity numeric default 6,
  can_edit boolean not null default false,
  active boolean not null default true,
  notes text
);
create table if not exists clients (
  id serial primary key,
  name text not null unique,
  type text not null default 'Client',
  lead_id integer references team(id),
  status text,
  notes text
);
create table if not exists tasks (
  id serial primary key,
  date_added date not null default current_date,
  client_id integer not null references clients(id),
  task text not null,
  brief text,
  owner_id integer references team(id),
  reviewer_id integer references team(id),
  priority text not null default 'Medium',
  start_date date,
  internal_deadline date,
  client_deadline date,
  est_hours numeric,
  status text not null default 'Not started',
  blocked_by text,
  blocked_since date,
  delivered_on date,
  completed_on date,
  actual_hours numeric,
  revisions integer not null default 0,
  first_round text,
  notes text,
  created_at timestamptz not null default now(),
  created_by text,
  updated_at timestamptz not null default now(),
  updated_by text
);
create table if not exists task_history (
  id serial primary key,
  task_id integer not null references tasks(id),
  changed_at timestamptz not null default now(),
  changed_by text,
  action text not null,
  changes jsonb
);
create index if not exists task_history_task on task_history(task_id);
create table if not exists settings (
  key text primary key,
  value text
);
`;

async function setup() {
  const client = await pool().connect();
  try {
    await client.query('begin');
    await client.query('select pg_advisory_xact_lock(724501)');
    await client.query(SCHEMA);
    const { rows } = await client.query('select count(*)::int as n from team');
    if (rows[0].n === 0) await seed(client);
    await client.query('commit');
  } catch (e) {
    await client.query('rollback').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function seed(client) {
  const teamIds = {};
  for (const m of SEED.team) {
    const r = await client.query(
      'insert into team (name, role, team, capacity) values ($1,$2,$3,$4) returning id',
      [m.name, m.role, m.team, m.capacity]
    );
    teamIds[m.name] = r.rows[0].id;
  }
  const clientIds = {};
  for (const c of SEED.clients) {
    const r = await client.query(
      'insert into clients (name, type, status) values ($1,$2,$3) returning id',
      [c.name, c.type, c.status]
    );
    clientIds[c.name] = r.rows[0].id;
  }
  for (const t of SEED.tasks) {
    const r = await client.query(
      `insert into tasks (date_added, client_id, task, brief, owner_id, reviewer_id, priority, start_date,
        internal_deadline, client_deadline, status, blocked_by, blocked_since, notes, created_by, updated_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'Imported from the Task Board sheet','Imported from the Task Board sheet')
       returning id`,
      [
        t.date_added, clientIds[t.client], t.task, t.brief || null,
        t.owner ? teamIds[t.owner] : null, t.reviewer ? teamIds[t.reviewer] : null,
        t.priority, t.start_date || null, t.internal_deadline || null, t.client_deadline || null,
        t.status, t.blocked_by || null, t.blocked_since || null, t.notes || null,
      ]
    );
    await client.query(
      "insert into task_history (task_id, changed_by, action) values ($1, 'Imported from the Task Board sheet', 'created')",
      [r.rows[0].id]
    );
  }
  await client.query("insert into settings (key, value) values ('buffer', '0.2') on conflict do nothing");
}

let ready = null;
export function ensureReady() {
  if (!ready) ready = setup().catch((e) => { ready = null; throw e; });
  return ready;
}

export async function q(text, params = []) {
  await ensureReady();
  const r = await pool().query(text, params);
  return r.rows;
}

export async function tx(fn) {
  await ensureReady();
  const client = await pool().connect();
  try {
    await client.query('begin');
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (e) {
    await client.query('rollback').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
