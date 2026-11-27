const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkRegister, fail } = require('../utils/validate');

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, currency: u.currency, createdAt: u.createdAt });
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

router.post('/register', async (req, res, next) => {
  try {
    checkRegister(req.body);
    const email = req.body.email.toLowerCase().trim();
    if (await User.findOne({ email })) fail('An account with this email already exists');
    const password = await bcrypt.hash(req.body.password, 10); // never store the plain password
    const user = await User.create({ name: req.body.name.trim(), email, password });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const user = await User.findOne({ email }).select('+password');
    const ok = user && (await bcrypt.compare(String(req.body.password || ''), user.password));
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password' });
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
