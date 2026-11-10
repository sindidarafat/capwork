import { getUser } from '@/lib/session';
import { getTasks } from '@/lib/board';
import { today } from '@/lib/dates';

export const dynamic = 'force-dynamic';

const COLUMNS = [
  ['ID', 'code'], ['Date added', 'date_added'], ['Client / Prospect', 'client_name'], ['Work type', 'work_type'],
  ['Task', 'task'], ['Brief', 'brief'], ['Owner', 'owner_name'], ['Team', 'owner_team'], ['Reviewer', 'reviewer_name'],
  ['Priority', 'priority'], ['Start date', 'start_date'], ['Internal deadline', 'internal_deadline'],
  ['Client deadline', 'client_deadline'], ['Est. hours', 'est_hours'], ['Status', 'status'], ['Flag', 'flag'],
  ['Blocked by', 'blocked_by'], ['Blocked since', 'blocked_since'], ['Delivered on', 'delivered_on'],
  ['Completed on', 'completed_on'], ['Actual hours', 'actual_hours'], ['Revisions', 'revisions'],
  ['First-round approved', 'first_round'], ['On time?', 'onTime'], ['Days late', 'daysLate'], ['Notes', 'notes'],
  ['Last changed by', 'updated_by'],
];

function cell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const user = await getUser();
  if (!user) return new Response('Please sign in.', { status: 401 });
  const tasks = await getTasks();
  const lines = [COLUMNS.map(([h]) => cell(h)).join(',')];
  for (const t of tasks) lines.push(COLUMNS.map(([, k]) => cell(t[k])).join(','));
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="CAP-Task-Log-${today()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
