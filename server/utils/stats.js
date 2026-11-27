const Expense = require('../models/Expense');
const UserBudget = require('../models/UserBudget');

// Totals of income / expense / investment. Pass no dates for all-time totals.
async function sumByType(user, start, end) {
  const match = { user };
  if (start) match.date = { $gte: start, $lt: end };
  const rows = await Expense.aggregate([{ $match: match }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]);
  const t = Object.fromEntries(rows.map((r) => [r._id, r.total]));
  return { income: t.income || 0, expense: t.expense || 0, investment: t.investment || 0 };
}

async function expenseByCategory(user, start, end) {
  const rows = await Expense.aggregate([
    { $match: { user, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ category: r._id, total: r.total, count: r.count }));
}

// Every budget the user set, with how much of it is used in the given period.
async function budgetStatus(user, start, end) {
  const [budgets, cats, totals] = await Promise.all([
    UserBudget.find({ user }),
    expenseByCategory(user, start, end),
    sumByType(user, start, end),
  ]);
  const spentMap = Object.fromEntries(cats.map((c) => [c.category, c.total]));
  return budgets
    .map((b) => {
      const spent = b.category === 'Overall' ? totals.expense : spentMap[b.category] || 0;
      const usedPct = spent / b.limit;
      return {
        category: b.category,
        limit: b.limit,
        spent,
        remaining: b.limit - spent,
        usedPct,
        status: usedPct >= 1 ? 'over' : usedPct >= 0.8 ? 'warn' : 'ok',
      };
    })
    .sort((a, b) => (a.category === 'Overall' ? -1 : b.category === 'Overall' ? 1 : a.category.localeCompare(b.category)));
}

module.exports = { sumByType, expenseByCategory, budgetStatus };
