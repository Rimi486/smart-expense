import { useState } from 'react';
import { api } from '../api.js';
import { today } from '../hooks.js';
import { ErrorBox, Modal } from './ui.jsx';

// Add or edit a transaction. `item` is the record being edited (null when adding).
export default function TransactionModal({ kind, item, categories, onClose, onSaved }) {
  const isIncome = kind === 'income';
  const [form, setForm] = useState({
    title: item?.title || '',
    amount: item?.amount ?? '',
    type: item?.type || (isIncome ? 'income' : 'expense'),
    category: item?.type === 'expense' ? item.category : '',
    date: item ? item.date.slice(0, 10) : today(),
    description: item?.description || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError(isIncome ? 'Enter the income source' : 'Enter a title');
    if (!(Number(form.amount) > 0)) return setError('Amount must be greater than 0');
    if (!form.date) return setError('Choose a date');

    const payload = {
      title: form.title.trim(),
      amount: Number(form.amount),
      type: form.type,
      category: form.type === 'expense' && form.category ? form.category : undefined,
      date: form.date,
      description: form.description.trim(),
    };
    setBusy(true);
    try {
      if (item) await api.updateTransaction(item._id, payload);
      else await api.addTransaction(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const noun = isIncome ? 'income' : 'expense';
  return (
    <Modal title={`${item ? 'Edit' : 'Add'} ${noun}`} onClose={onClose}>
      <form className="form" onSubmit={submit} noValidate>
        <label>{isIncome ? 'Income source' : 'Title'}
          <input autoFocus value={form.title} onChange={set('title')} placeholder={isIncome ? 'e.g. Salary, Freelance' : 'e.g. Swiggy dinner'} maxLength={100} />
        </label>
        <div className="row">
          <label>Amount
            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} />
          </label>
          <label>Date
            <input type="date" value={form.date} onChange={set('date')} />
          </label>
        </div>
        {!isIncome && (
          <div className="row">
            <label>Type
              <select value={form.type} onChange={set('type')}>
                <option value="expense">Expense</option>
                <option value="investment">Investment</option>
              </select>
            </label>
            {form.type === 'expense' && (
              <label>Category
                <select value={form.category} onChange={set('category')}>
                  <option value="">Detect automatically</option>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            )}
          </div>
        )}
        <label>Description (optional)
          <textarea rows="2" value={form.description} onChange={set('description')} maxLength={300} />
        </label>
        <ErrorBox message={error} />
        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : item ? 'Save changes' : `Add ${noun}`}</button>
        </div>
      </form>
    </Modal>
  );
}
