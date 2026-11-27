const router = require('express').Router();
const Expense = require('../models/Expense');
const { monthRange } = require('../utils/dates');
const { sumByType, expenseByCategory, budgetStatus } = require('../utils/stats');

router.get('/', async (req, res, next) => {
  try {
    const user = req.user._id;
    const { start, end, year, month } = monthRange(typeof req.query.month === 'string' ? req.query.month : '');
    const prevStart = new Date(Date.UTC(year, month - 2, 1));

    const [all, current, prev, categories, prevCategories, budgets, recent, unusual] = await Promise.all([
      sumByType(user),
      sumByType(user, start, end),
      sumByType(user, prevStart, start),
      expenseByCategory(user, start, end),
      expenseByCategory(user, prevStart, start),
      budgetStatus(user, start, end),
      Expense.find({ user }).sort({ date: -1, createdAt: -1 }).limit(5),
      Expense.countDocuments({ user, type: 'expense', unusual: true, date: { $gte: start, $lt: end } }),
    ]);

    // Donut split for the month: income is 100%, spending takes its share out of savings
    const spent = current.expense + current.investment;
    const balance = current.income - spent;
    const base = Math.max(current.income, spent);
    const share = (n) => (base ? n / base : 0);

    // Projection of the month's spending at the current pace
    const now = new Date();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const inProgress = now >= start && now < end;
    const projected = inProgress ? Math.round((current.expense / now.getUTCDate()) * daysInMonth) : current.expense;

    // Plain-language alerts
    const alerts = [];
    for (const b of budgets) {
      const name = b.category === 'Overall' ? 'Your overall budget' : `${b.category} budget`;
      if (b.status === 'over') alerts.push({ level: 'over', text: `${name} is exceeded by ${Math.round(b.spent - b.limit)}.` });
      else if (b.status === 'warn') alerts.push({ level: 'warn', text: `${name} is ${Math.round(b.usedPct * 100)}% used.` });
    }
    const overall = budgets.find((b) => b.category === 'Overall');
    if (overall && inProgress && overall.status !== 'over' && projected > overall.limit) {
      alerts.push({ level: 'warn', text: `At this pace you'll spend about ${projected}, above your overall budget of ${overall.limit}.` });
    }
    const prevMap = Object.fromEntries(prevCategories.map((c) => [c.category, c.total]));
    for (const c of categories) {
      const before = prevMap[c.category];
      if (before && c.total > before * 1.5 && c.total > 500) {
        alerts.push({ level: 'warn', text: `${c.category} spending is up ${Math.round(((c.total - before) / before) * 100)}% from last month.` });
      }
    }
    if (unusual) alerts.push({ level: 'info', text: `${unusual} expense${unusual > 1 ? 's' : ''} look unusually large for their category.` });

    res.json({
      totals: { income: all.income, expense: all.expense, investment: all.investment, balance: all.income - all.expense - all.investment },
      month: {
        ...current,
        balance,
        prevExpense: prev.expense,
        changePct: prev.expense ? (current.expense - prev.expense) / prev.expense : null,
        projected,
        inProgress,
        topCategory: categories[0] || null,
      },
      split: { savingsPct: share(Math.max(0, balance)), expensePct: share(current.expense), investmentPct: share(current.investment), balance },
      categories: categories.map((c) => ({ ...c, share: current.expense ? c.total / current.expense : 0 })),
      recent,
      alerts,
    });
  } catch (e) { next(e); }
});

module.exports = router;
