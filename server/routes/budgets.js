const router = require('express').Router();
const UserBudget = require('../models/UserBudget');
const { CATEGORIES } = require('../utils/categorize');
const { monthRange } = require('../utils/dates');
const { budgetStatus } = require('../utils/stats');
const { fail, isPlainObject } = require('../utils/validate');

const valid = (c) => c === 'Overall' || CATEGORIES.includes(c);

// Budgets with how much of each has been used in the chosen month
router.get('/', async (req, res, next) => {
  try {
    const { start, end } = monthRange(typeof req.query.month === 'string' ? req.query.month : '');
    res.json(await budgetStatus(req.user._id, start, end));
  } catch (e) { next(e); }
});

// Create or update a limit. Use "Overall" for the total monthly budget.
router.put('/:category', async (req, res, next) => {
  try {
    if (!valid(req.params.category)) fail('Invalid category');
    if (!isPlainObject(req.body)) fail('Invalid request body');
    const limit = Number(req.body.limit);
    if (!Number.isFinite(limit) || limit < 1) fail('Budget must be a number greater than 0');
    if (limit > 1e9) fail('Budget is too large');
    const budget = await UserBudget.findOneAndUpdate(
      { user: req.user._id, category: req.params.category },
      { limit },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json(budget);
  } catch (e) { next(e); }
});

router.delete('/:category', async (req, res, next) => {
  try {
    if (!valid(req.params.category)) fail('Invalid category');
    await UserBudget.deleteOne({ user: req.user._id, category: req.params.category });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
