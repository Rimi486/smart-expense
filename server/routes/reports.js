const router = require('express').Router();
const Expense = require('../models/Expense');
const { periodRange, pad } = require('../utils/dates');
const { expenseByCategory } = require('../utils/stats');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Income / expense totals per day (or per month) with empty slots filled with zeros
async function buildSeries(user, start, end, byMonth) {
  const fmt = byMonth ? '%Y-%m' : '%Y-%m-%d';
  const rows = await Expense.aggregate([
    { $match: { user, date: { $gte: start, $lt: end } } },
    { $group: { _id: { k: { $dateToString: { format: fmt, date: '$date', timezone: 'UTC' } }, t: '$type' }, total: { $sum: '$amount' } } },
  ]);
  const map = {};
  for (const r of rows) {
    map[r._id.k] = map[r._id.k] || { income: 0, expense: 0, investment: 0 };
    map[r._id.k][r._id.t] = r.total;
  }

  const slots = [];
  if (byMonth) {
    const y = start.getUTCFullYear();
    for (let m = 0; m < 12; m++) slots.push({ key: `${y}-${pad(m + 1)}`, label: MONTHS[m] });
  } else {
    const spanDays = Math.round((end - start) / 86400000);
    for (let i = 0; i < spanDays; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const key = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
      slots.push({ key, label: spanDays <= 7 ? `${DAYS[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()}` : String(d.getUTCDate()) });
    }
  }
  return slots.map((s) => ({ label: s.label, income: 0, expense: 0, investment: 0, ...(map[s.key] || {}) }));
}

// GET /api/reports?period=week|month|year&date=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const user = req.user._id;
    const period = ['week', 'month', 'year'].includes(req.query.period) ? req.query.period : 'month';
    const { start, end } = periodRange(period, req.query.date);
    const yearRange = periodRange('year', start.toISOString().slice(0, 10));
    const inRange = { $gte: start, $lt: end };

    const [series, monthly, categories, largest, count, weekdays] = await Promise.all([
      buildSeries(user, start, end, period === 'year'),
      period === 'year' ? null : buildSeries(user, yearRange.start, yearRange.end, true),
      expenseByCategory(user, start, end),
      Expense.findOne({ user, type: 'expense', date: inRange }).sort({ amount: -1 }),
      Expense.countDocuments({ user, date: inRange }),
      Expense.aggregate([
        { $match: { user, type: 'expense', date: inRange } },
        { $group: { _id: { $dayOfWeek: '$date' }, total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const totals = series.reduce(
      (t, s) => ({ income: t.income + s.income, expense: t.expense + s.expense, investment: t.investment + s.investment }),
      { income: 0, expense: 0, investment: 0 }
    );
    const daysElapsed = Math.max(1, Math.ceil((Math.min(end.getTime(), Date.now()) - start.getTime()) / 86400000));
    const net = totals.income - totals.expense - totals.investment;

    res.json({
      period,
      start,
      end,
      totals: { ...totals, net },
      categories: categories.map((c) => ({ ...c, share: totals.expense ? c.total / totals.expense : 0 })),
      series,
      monthly: monthly || series,
      year: yearRange.start.getUTCFullYear(),
      highestCategory: categories[0] || null,
      avgDaily: totals.expense / daysElapsed,
      largestExpense: largest ? { title: largest.title, amount: largest.amount, category: largest.category, date: largest.date } : null,
      count,
      savingsRate: totals.income ? net / totals.income : null,
      busiestWeekday: weekdays[0] ? { day: DAYS[weekdays[0]._id - 1], total: weekdays[0].total } : null,
    });
  } catch (e) { next(e); }
});

module.exports = router;
