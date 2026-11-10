// All dates are 'YYYY-MM-DD' strings in Dhaka time. Arithmetic is done in UTC so
// it never drifts with the server's own time zone.
const TZ = 'Asia/Dhaka';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function toUTC(d) {
  const [y, m, day] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, day);
}
function fromUTC(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(d, n) {
  return fromUTC(toUTC(d) + n * 86400000);
}
export function diffDays(a, b) {
  return Math.round((toUTC(a) - toUTC(b)) / 86400000);
}
export function weekday(d) {
  return new Date(toUTC(d)).getUTCDay();
}
// CAP works Sunday to Thursday.
export function isWorkingDay(d) {
  const w = weekday(d);
  return w !== 5 && w !== 6;
}
export function nextWorkingDays(from, count) {
  const out = [];
  let d = from;
  while (out.length < count) {
    if (isWorkingDay(d)) out.push(d);
    d = addDays(d, 1);
  }
  return out;
}
export function startOfWeek(d) {
  return addDays(d, -weekday(d));
}

export function fmt(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  return `${day} ${MONTHS[m - 1]} ${y}`;
}
export function fmtShort(d) {
  if (!d) return '';
  const [, m, day] = d.split('-').map(Number);
  return `${DAYS[weekday(d)]} ${day} ${MONTHS[m - 1]}`;
}
export function fmtLong(d) {
  if (!d) return '';
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${names[weekday(d)]}, ${fmt(d)}`;
}
export function fmtStamp(ts) {
  if (!ts) return '';
  const s = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(ts));
  return s.replace(',', '');
}
