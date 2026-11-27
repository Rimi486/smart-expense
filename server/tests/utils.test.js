const test = require('node:test');
const assert = require('node:assert/strict');
const { guessCategory, CATEGORIES } = require('../utils/categorize');
const { monthRange, periodRange } = require('../utils/dates');
const { checkRegister, checkPassword, checkTransaction, checkDateValue } = require('../utils/validate');

test('guessCategory detects known keywords and falls back to Others', () => {
  assert.equal(guessCategory('Swiggy dinner'), 'Food');
  assert.equal(guessCategory('Uber ride to office'), 'Transportation');
  assert.equal(guessCategory('Random misc expense'), 'Others');
  assert.equal(guessCategory(null), 'Others');
  assert.ok(CATEGORIES.includes('Others'));
});

test('monthRange returns UTC month bounds', () => {
  const { start, end, year, month } = monthRange('2026-02');
  assert.equal(year, 2026);
  assert.equal(month, 2);
  assert.equal(start.toISOString(), '2026-02-01T00:00:00.000Z');
  assert.equal(end.toISOString(), '2026-03-01T00:00:00.000Z');
});

test('periodRange handles week, month, and year', () => {
  const week = periodRange('week', '2026-11-27'); // Friday -> Monday Nov 23
  assert.equal(week.start.toISOString(), '2026-11-23T00:00:00.000Z');
  assert.equal(week.end.toISOString(), '2026-11-30T00:00:00.000Z');

  const yr = periodRange('year', '2026-11-27');
  assert.equal(yr.start.toISOString(), '2026-01-01T00:00:00.000Z');
  assert.equal(yr.end.toISOString(), '2027-01-01T00:00:00.000Z');
});

test('validate helpers reject malformed types and invalid inputs with 400', () => {
  assert.throws(() => checkRegister(null), { status: 400 });
  assert.throws(() => checkRegister({ name: 'A', email: 'a@b.com', password: 'secret' }), { status: 400 });
  assert.throws(() => checkPassword(['123456']), { status: 400 });
  assert.throws(() => checkTransaction({ title: 'Test', amount: -5 }), { status: 400 });
  assert.throws(() => checkTransaction({ title: 'Test', amount: 100, type: '' }), { status: 400 });
  assert.throws(() => checkTransaction({ title: 'Test', amount: 100, description: { bad: 1 } }), { status: 400 });
  assert.throws(() => checkDateValue('not-a-date'), { status: 400 });
  assert.doesNotThrow(() => checkTransaction({ title: 'Coffee', amount: 120, type: 'expense', category: 'Food', date: '2026-11-27' }));
});
