const mongoose = require('mongoose');
const { CATEGORIES } = require('./categorize');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Throw a 400 error with a readable message.
function fail(message) {
  const err = new Error(message);
  err.status = 400;
  throw err;
}

const validId = (id) => mongoose.isValidObjectId(id);
const checkId = (id) => { if (!validId(id)) fail('Invalid id'); };

function checkRegister({ name, email, password }) {
  if (!name || name.trim().length < 2) fail('Name must be at least 2 characters');
  if (!EMAIL.test(email || '')) fail('Enter a valid email address');
  checkPassword(password);
}

function checkPassword(password) {
  if (!password || password.length < 6) fail('Password must be at least 6 characters');
  if (password.length > 72) fail('Password is too long (max 72 characters)');
}

function checkTransaction(body, { partial = false } = {}) {
  const { title, amount, type, category, date } = body;
  if (!partial || title !== undefined) if (!title || !String(title).trim()) fail('Title is required');
  if (!partial || amount !== undefined) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) fail('Amount must be a number greater than 0');
    if (n > 1e9) fail('Amount is too large');
  }
  if (type !== undefined && !['income', 'expense', 'investment'].includes(type)) fail('Invalid type');
  if (category !== undefined && category !== '' && !CATEGORIES.includes(category)) fail('Invalid category');
  if (date !== undefined && date !== '' && Number.isNaN(new Date(date).getTime())) fail('Invalid date');
}

module.exports = { fail, checkId, checkRegister, checkPassword, checkTransaction, EMAIL };
