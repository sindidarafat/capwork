import { q } from './db';
import { today, addDays, diffDays, nextWorkingDays } from './dates';

export const STATUSES = ['Not started', 'In progress', 'Internal review', 'Client review', 'Revisions', 'Done', 'On hold'];
export const ACTIVE_STATUSES = ['In progress', 'Internal review', 'Client review', 'Revisions'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const WORK_TYPES = ['Client', 'Pitch', 'Internal'];
export const ACCOUNT_STATUSES = ['Active', 'Pitching', 'Won', 'Lost', 'Paused'];
export const FLAGS = ['Overdue', 'Due today', 'Due soon', 'Blocked', 'No deadline', 'On track', 'On hold', 'Done'];

export const taskCode = (id) => `T-${String(id).padStart(3, '0')}`;

export function isOpen(t) {
  return t.status !== 'Done' && t.status !== 'On hold';
}

// Same rules as the Flag column in the sheet.
export function flagOf(t, now) {
  if (t.status === 'Done') return 'Done';
  if (t.status === 'On hold') return 'On hold';
  if (t.blocked_by) return 'Blocked';
  if (!t.internal_deadline) return 'No deadline';
  const left = diffDays(t.internal_deadline, now);
  if (left < 0) return 'Overdue';
  if (left === 0) return 'Due today';
  if (left <= 2) return 'Due soon';
  return 'On track';
}

// Urgency 1 to 7: priority (3/2/1) plus deadline pressure (4/3/2/1/0).
export function urgencyOf(t, now) {
  if (!isOpen(t)) return null;
  const p = t.priority === 'High' ? 3 : t.priority === 'Medium' ? 2 : 1;
  if (!t.internal_deadline) return p;
  const left = diffDays(t.internal_deadline, now);
  const d = left < 0 ? 4 : left === 0 ? 3 : left === 1 ? 2 : left <= 3 ? 1 : 0;
  return p + d;
}

export function onTimeOf(t) {
  if (!t.delivered_on || !t.internal_deadline) return null;
  return t.delivered_on <= t.internal_deadline ? 'Yes' : 'No';
}

function enrich(t, now) {
  return {
    ...t,
    code: taskCode(t.id),
    flag: flagOf(t, now),
    urgency: urgencyOf(t, now),
    daysLeft: t.internal_deadline && isOpen(t) ? diffDays(t.internal_deadline, now) : null,
    onTime: onTimeOf(t),
    daysLate: onTimeOf(t) === 'No' ? diffDays(t.delivered_on, t.internal_deadline) : null,
    daysBlocked: t.blocked_by && t.blocked_since ? diffDays(now, t.blocked_since) : null,
  };
}

const TASK_SELECT = `
  select t.*, c.name as client_name, c.type as work_type,
         o.name as owner_name, o.team as owner_team, r.name as reviewer_name
  from tasks t
  join clients c on c.id = t.client_id
  left join team o on o.id = t.owner_id
  left join team r on r.id = t.reviewer_id`;

export async function getTasks() {
  const now = today();
  const rows = await q(`${TASK_SELECT} order by t.id`);
  return rows.map((t) => enrich(t, now));
}

export async function getTask(id) {
  const now = today();
  const rows = await q(`${TASK_SELECT} where t.id = $1`, [id]);
  return rows[0] ? enrich(rows[0], now) : null;
}

export async function getHistory(id) {
  return q('select * from task_history where task_id = $1 order by changed_at desc, id desc', [id]);
}

export async function getTeam({ activeOnly = false } = {}) {
  return q(`select * from team ${activeOnly ? 'where active' : ''} order by id`);
}

export async function getClients() {
  return q(`select c.*, t.name as lead_name from clients c left join team t on t.id = c.lead_id order by c.id`);
}

export async function getBuffer() {
  const rows = await q("select value from settings where key = 'buffer'");
  const v = rows[0] ? parseFloat(rows[0].value) : 0.2;
  return Number.isFinite(v) ? v : 0.2;
}

// Today: every open task due within 2 days, overdue, without a deadline, or already moving.
export function todayList(tasks, now = today()) {
  const horizon = addDays(now, 2);
  return tasks
    .filter((t) => isOpen(t) && (!t.internal_deadline || t.internal_deadline <= horizon || ACTIVE_STATUSES.includes(t.status)))
    .sort((a, b) => {
      if (b.urgency !== a.urgency) return b.urgency - a.urgency;
      if (a.internal_deadline && b.internal_deadline && a.internal_deadline !== b.internal_deadline) {
        return a.internal_deadline < b.internal_deadline ? -1 : 1;
      }
      if (!!a.internal_deadline !== !!b.internal_deadline) return a.internal_deadline ? -1 : 1;
      return a.id - b.id;
    });
}

export function boardStats(tasks) {
  const open = tasks.filter(isOpen);
  const count = (f) => tasks.filter((t) => t.flag === f).length;
  return {
    open: open.length,
    overdue: count('Overdue'),
    dueToday: count('Due today'),
    blocked: count('Blocked'),
    noDeadline: count('No deadline'),
    pitch: open.filter((t) => t.work_type === 'Pitch').length,
    noOwner: open.filter((t) => !t.owner_id).length,
  };
}

export function comingUp(tasks, team, buffer, now = today()) {
  const days = nextWorkingDays(now, 6);
  const last = days[days.length - 1];
  const people = team.map((m) => {
    const mine = tasks.filter((t) => t.owner_id === m.id && isOpen(t));
    const dueBy = mine.filter((t) => t.internal_deadline && t.internal_deadline <= last);
    const hrsDue = dueBy.reduce((s, t) => s + (t.est_hours || 0), 0) * (1 + buffer);
    const capacity = (m.capacity || 0) * days.length;
    return {
      ...m,
      overdue: mine.filter((t) => t.flag === 'Overdue').length,
      perDay: days.map((d) => mine.filter((t) => t.internal_deadline === d).length),
      openHrs: mine.reduce((s, t) => s + (t.est_hours || 0), 0),
      hrsDue,
      capacity,
      load: capacity ? hrsDue / capacity : null,
      open: mine.length,
    };
  });
  const horizon = addDays(now, 14);
  const upcoming = tasks
    .filter((t) => isOpen(t) && t.internal_deadline && t.internal_deadline > now && t.internal_deadline <= horizon)
    .sort((a, b) => (a.internal_deadline === b.internal_deadline ? a.id - b.id : a.internal_deadline < b.internal_deadline ? -1 : 1));
  return { days, people, upcoming };
}

export function scorecard(tasks, team, from, to) {
  const inPeriod = (t) => t.delivered_on && t.delivered_on >= from && t.delivered_on <= to;
  const rows = team.map((m) => {
    const mine = tasks.filter((t) => t.owner_id === m.id);
    const delivered = mine.filter(inPeriod);
    const onTime = delivered.filter((t) => t.onTime === 'Yes').length;
    const est = delivered.reduce((s, t) => s + (t.est_hours || 0), 0);
    const actual = delivered.reduce((s, t) => s + (t.actual_hours || 0), 0);
    return {
      ...m,
      open: mine.filter(isOpen).length,
      overdue: mine.filter((t) => t.flag === 'Overdue').length,
      delivered: delivered.length,
      onTime,
      onTimePct: delivered.length ? onTime / delivered.length : null,
      avgRevisions: delivered.length ? delivered.reduce((s, t) => s + (t.revisions || 0), 0) / delivered.length : null,
      firstRoundPct: delivered.length ? delivered.filter((t) => t.first_round === 'Yes').length / delivered.length : null,
      est,
      actual,
      accuracy: actual ? est / actual : null,
      reviewsWaiting: tasks.filter((t) => t.reviewer_id === m.id && t.status === 'Internal review').length,
    };
  });
  const sum = (k) => rows.reduce((s, r) => s + r[k], 0);
  const allDelivered = tasks.filter(inPeriod);
  const total = {
    open: sum('open'), overdue: sum('overdue'), delivered: sum('delivered'), onTime: sum('onTime'),
    est: sum('est'), actual: sum('actual'), reviewsWaiting: sum('reviewsWaiting'),
  };
  total.onTimePct = total.delivered ? total.onTime / total.delivered : null;
  total.avgRevisions = allDelivered.length ? allDelivered.reduce((s, t) => s + (t.revisions || 0), 0) / allDelivered.length : null;
  total.firstRoundPct = allDelivered.length ? allDelivered.filter((t) => t.first_round === 'Yes').length / allDelivered.length : null;
  total.accuracy = total.actual ? total.est / total.actual : null;
  return { rows, total };
}
