const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Expense = require('../models/Expense');
const UserBudget = require('../models/UserBudget');
const { fail, isPlainObject, checkName, checkEmail, checkPassword } = require('../utils/validate');

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
    if (!isPlainObject(req.body)) fail('Invalid request body');
    const { name, email, currency } = req.body;
    checkName(name);
    checkEmail(email);
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
    if (!isPlainObject(req.body)) fail('Invalid request body');
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    const current = typeof currentPassword === 'string' ? currentPassword : '';
    if (!(await bcrypt.compare(current, user.password))) fail('Current password is incorrect');
    checkPassword(newPassword);
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Permanently delete the account and all of its data
router.delete('/', async (req, res, next) => {
  try {
    const body = isPlainObject(req.body) ? req.body : {};
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    const password = typeof body.password === 'string' ? body.password : '';
    if (!(await bcrypt.compare(password, user.password))) fail('Password is incorrect');
    await Promise.all([
      Expense.deleteMany({ user: user._id }),
      UserBudget.deleteMany({ user: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
