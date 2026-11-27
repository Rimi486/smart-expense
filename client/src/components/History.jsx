import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, money } from '../api.js';
import { ErrorBox } from './ui.jsx';

const COLOR = { income: 'savings', expense: 'expense', investment: 'investment' };

// Card-style list (the original History look). Used for "Recent transactions".
export default function History({ items, onDeleted }) {
  const [error, setError] = useState('');

  async function remove(id) {
    try {
      setError('');
      await api.deleteTransaction(id);
      onDeleted();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="history">
      <ErrorBox message={error} />
      <ul>
        {items.map((t) => {
          const kind = COLOR[t.type];
          return (
            <li key={t._id} style={{ borderRightColor: `var(--${kind})` }}>
              <button className="trash" style={{ color: `var(--${kind})` }} onClick={() => remove(t._id)} aria-label={`Delete ${t.title}`}>
                <Trash2 size={15} />
              </button>
              <span className="name">
                {t.title}
                <small>{t.category}{t.autoCategorized && ' (auto)'}{t.unusual && ' · unusually high'}</small>
              </span>
              <span className="amt">{t.type === 'income' ? '+' : '−'}{money(t.amount)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
