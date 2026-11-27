const mongoose = require('mongoose');
const { CATEGORIES } = require('./categorize');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Throw a 400 error with a readable message.
function fail(message) {
  const err = new Error(message);
  err.status = 400;
  throw err;
}

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const validId = (id) => mongoose.isValidObjectId(id);
const checkId = (id) => { if (!validId(id)) fail('Invalid id'); };

function checkName(name) {
  if (typeof name !== 'string' || name.trim().length < 2) fail('Name must be at least 2 characters');
  if (name.trim().length > 60) fail('Name must be at most 60 characters');
}

function checkEmail(email) {
  if (typeof email !== 'string' || !EMAIL.test(email.trim())) fail('Enter a valid email address');
}

function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 6) fail('Password must be at least 6 characters');
  if (password.length > 72) fail('Password is too long (max 72 characters)');
}

function checkRegister(body) {
  if (!isPlainObject(body)) fail('Invalid request body');
  checkName(body.name);
  checkEmail(body.email);
  checkPassword(body.password);
}

function checkDateValue(date, label = 'Invalid date') {
  if (typeof date !== 'string' && !(date instanceof Date)) fail(label);
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) fail(label);
  return parsed;
}

function checkTransaction(body, { partial = false } = {}) {
  if (!isPlainObject(body)) fail('Invalid request body');
  const { title, amount, type, category, date, description } = body;
  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) fail('Title is required');
    if (title.trim().length > 100) fail('Title must be at most 100 characters');
  }
  if (!partial || amount !== undefined) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) fail('Amount must be a number greater than 0');
    if (n > 1e9) fail('Amount is too large');
  }
  if (type !== undefined && !['income', 'expense', 'investment'].includes(type)) fail('Invalid type');
  if (category !== undefined && category !== '' && !CATEGORIES.includes(category)) fail('Invalid category');
  if (date !== undefined && date !== '' && date !== null) checkDateValue(date, 'Invalid date');
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') fail('Description must be text');
    if (description.trim().length > 300) fail('Description must be at most 300 characters');
  }
}

module.exports = {
  fail,
  isPlainObject,
  checkId,
  checkName,
  checkEmail,
  checkRegister,
  checkPassword,
  checkDateValue,
  checkTransaction,
  EMAIL,
};
