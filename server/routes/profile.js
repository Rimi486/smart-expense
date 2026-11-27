const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Expense = require('../models/Expense');
const UserBudget = require('../models/UserBudget');
const { fail, checkPassword, EMAIL } = require('../utils/validate');

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, currency: u.currency, createdAt: u.createdAt });

router.get('/', async (req, res, next) => {
  try {
    const [transactions, budgets] = await Promise.all([
      Expense.countDocuments({ user: req.user._id }),
      UserBudget.countDocuments({ user: req.user._id }),
    ]);
    res.json({ user: publicUser(req.user), stats: { transactions, budgets } });
  } catch (e) { next(e); }
});

// Update name, email and preferred currency
router.put('/', async (req, res, next) => {
  try {
    const { name, email, currency } = req.body;
    if (!name || name.trim().length < 2) fail('Name must be at least 2 characters');
    if (!EMAIL.test(email || '')) fail('Enter a valid email address');
    if (!['INR', 'USD', 'EUR', 'GBP'].includes(currency)) fail('Invalid currency');

    const clean = email.toLowerCase().trim();
    const taken = await User.findOne({ email: clean, _id: { $ne: req.user._id } });
    if (taken) fail('That email is already used by another account');

    Object.assign(req.user, { name: name.trim(), email: clean, currency });
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (e) { next(e); }
});

router.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await bcrypt.compare(String(currentPassword || ''), user.password))) fail('Current password is incorrect');
    checkPassword(newPassword);
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Permanently delete the account and all of its data
router.delete('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await bcrypt.compare(String(req.body.password || ''), user.password))) fail('Password is incorrect');
    await Promise.all([
      Expense.deleteMany({ user: user._id }),
      UserBudget.deleteMany({ user: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
