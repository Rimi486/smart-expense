const pad = (n) => String(n).padStart(2, '0');

// month = "YYYY-MM" (defaults to the current month). Returns UTC [start, end) bounds.
function monthRange(month) {
  const now = new Date();
  const ok = /^\d{4}-(0[1-9]|1[0-2])$/.test(month || '');
  const [y, m] = (ok ? month : `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}`).split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)), year: y, month: m };
}

// period = week | month | year, anchored on a "YYYY-MM-DD" date (defaults to today).
function periodRange(period, dateStr) {
  const d = dateStr && !Number.isNaN(new Date(dateStr).getTime()) ? new Date(dateStr) : new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  if (period === 'year') return { start: new Date(Date.UTC(y, 0, 1)), end: new Date(Date.UTC(y + 1, 0, 1)) };
  if (period === 'week') {
    const day = (d.getUTCDay() + 6) % 7; // Monday = 0
    const start = new Date(Date.UTC(y, m, d.getUTCDate() - day));
    return { start, end: new Date(start.getTime() + 7 * 86400000) };
  }
  return { start: new Date(Date.UTC(y, m, 1)), end: new Date(Date.UTC(y, m + 1, 1)) };
}

module.exports = { monthRange, periodRange, pad };
