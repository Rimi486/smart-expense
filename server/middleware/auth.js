const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Reads "Authorization: Bearer <token>", verifies it, and attaches req.user.
module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Please log in to continue' });

    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please log in again' });
  }
};
