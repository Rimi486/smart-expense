const router = require('express').Router();
const Expense = require('../models/Expense');
const { guessCategory } = require('../utils/categorize');
const { checkId, checkTransaction, fail } = require('../utils/validate');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Flag an expense as unusual if it is > 2.5x the average of the last 90 days in that category
async function isUnusual(user, category, amount, excludeId) {
  const since = new Date(Date.now() - 90 * 86400000);
  const match = { user, type: 'expense', category, date: { $gte: since } };
  if (excludeId) match._id = { $ne: excludeId };
  const [stats] = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, avg: { $avg: '$amount' }, count: { $sum: 1 } } },
  ]);
  return Boolean(stats && stats.count >= 5 && amount > stats.avg * 2.5);
}

// Work out the category (and flags) from the type, title and what the user chose.
async function resolveFields(user, { type, title, category, amount }, excludeId) {
  let auto = false;
  let finalCategory = category;
  if (type === 'income') finalCategory = 'Income';
  else if (type === 'investment') finalCategory = 'Investment';
  else if (!finalCategory) { finalCategory = guessCategory(title); auto = true; }
  const unusual = type === 'expense' ? await isUnusual(user, finalCategory, Number(amount), excludeId) : false;
  return { category: finalCategory, autoCategorized: auto, unusual };
}

// GET /api/transactions?type=&search=&category=&from=&to=&sort=&order=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { type, search, category, from, to, sort = 'date', order = 'desc' } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = { user: req.user._id };
    if (type === 'spending') filter.type = { $in: ['expense', 'investment'] };
    else if (['income', 'expense', 'investment'].includes(type)) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      const rx = new RegExp(escapeRegex(String(search).slice(0, 50)), 'i');
      filter.$or = [{ title: rx }, { description: rx }];
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lt = new Date(new Date(to).getTime() + 86400000); // include the whole "to" day
    }

    const sortField = ['date', 'amount', 'title'].includes(sort) ? sort : 'date';
    const sortDir = order === 'asc' ? 1 : -1;

    const [items, total, sums] = await Promise.all([
      Expense.find(filter).sort({ [sortField]: sortDir, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Expense.countDocuments(filter),
      Expense.aggregate([{ $match: filter }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
    ]);
    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), totalAmount: sums[0]?.amount || 0 });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const type = req.body.type || 'expense';
    checkTransaction({ ...req.body, type });
    const extra = await resolveFields(req.user._id, { ...req.body, type });
    const created = await Expense.create({
      user: req.user._id,
      type,
      title: String(req.body.title).trim(),
      amount: Number(req.body.amount),
      date: req.body.date || Date.now(),
      description: req.body.description || '',
      ...extra,
    });
    res.status(201).json(created);
  } catch (e) { if (e.name === 'ValidationError') e.status = 400; next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    checkId(req.params.id);
    checkTransaction(req.body);
    // Only the owner's own record can be found, so users can never edit someone else's data
    const tx = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const wasIncome = tx.type === 'income';
    const type = req.body.type || tx.type;
    if (wasIncome !== (type === 'income')) fail('You cannot change a transaction between income and expense');

    const extra = await resolveFields(req.user._id, { ...req.body, type }, tx._id);
    Object.assign(tx, {
      type,
      title: String(req.body.title).trim(),
      amount: Number(req.body.amount),
      date: req.body.date || tx.date,
      description: req.body.description || '',
      ...extra,
    });
    await tx.save();
    res.json(tx);
  } catch (e) { if (e.name === 'ValidationError') e.status = 400; next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    checkId(req.params.id);
    const tx = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
