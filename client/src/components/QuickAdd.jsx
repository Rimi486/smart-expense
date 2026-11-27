import { useState } from 'react';
import { api } from '../api.js';
import { today } from '../hooks.js';
import { ErrorBox } from './ui.jsx';

// The original "Make Transaction" form: title, type and amount.
export default function QuickAdd({ onAdded }) {
  const [form, setForm] = useState({ title: '', type: 'income', amount: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Enter a title');
    if (!(Number(form.amount) > 0)) return setError('Enter an amount greater than 0');
    setBusy(true);
    try {
      await api.addTransaction({ ...form, amount: Number(form.amount), date: today() });
      // After the salary is in, most entries will be expenses
      setForm({ title: '', type: form.type === 'income' ? 'expense' : form.type, amount: '' });
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="tx" onSubmit={submit} noValidate>
      <input placeholder="Salary, Electricity bill, Buy stocks" value={form.title} onChange={set('title')} aria-label="Title" />
      <select value={form.type} onChange={set('type')} aria-label="Type">
        <option value="income">Income</option>
        <option value="expense">Expense</option>
        <option value="investment">Investment</option>
      </select>
      <input type="number" min="0.01" step="0.01" placeholder="Amount" value={form.amount} onChange={set('amount')} aria-label="Amount" />
      <ErrorBox message={error} />
      <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Make Transaction'}</button>
    </form>
  );
}
