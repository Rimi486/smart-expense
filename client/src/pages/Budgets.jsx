import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, money } from '../api.js';
import { useAsync, thisMonth } from '../hooks.js';
import { categoryColor, pct } from '../theme.js';
import { ErrorBox, Loader, ProgressBar } from '../components/ui.jsx';

function BudgetCard({ category, status, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(status?.limit ?? '');
  const [error, setError] = useState('');
  const isOverall = category === 'Overall';

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!(Number(value) >= 1)) return setError('Enter an amount of at least 1');
    try {
      await api.setBudget(category, Number(value));
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    try {
      await api.deleteBudget(category);
      setValue('');
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className={`card budget ${isOverall ? 'overall' : ''}`}>
      <div className="card-head">
        <h3>
          {!isOverall && <i className="dot" style={{ background: categoryColor(category) }} />}
          {isOverall ? 'Total monthly budget' : category}
        </h3>
        {status && !editing && (
          <button className="icon-btn danger" onClick={remove} aria-label={`Remove ${category} budget`}><Trash2 size={16} /></button>
        )}
      </div>

      {status ? (
        <>
          <div className="budget-figures">
            <strong>{money(status.spent)}</strong>
            <span>of {money(status.limit)}</span>
          </div>
          <ProgressBar value={status.usedPct} status={status.status} />
          <p className={`budget-note ${status.status}`}>
            {status.status === 'over'
              ? `Over budget by ${money(-status.remaining)}`
              : status.status === 'warn'
              ? `Careful: ${pct(status.usedPct)} used, ${money(status.remaining)} left`
              : `${money(status.remaining)} left (${pct(status.usedPct)} used)`}
          </p>
        </>
      ) : (
        !editing && <p className="muted">No limit set.</p>
      )}

      {editing ? (
        <form className="inline-form" onSubmit={save} noValidate>
          <input type="number" min="1" autoFocus value={value} onChange={(e) => setValue(e.target.value)} aria-label={`${category} monthly limit`} placeholder="Monthly limit" />
          <button className="btn primary">Save</button>
          <button type="button" className="btn" onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
        </form>
      ) : (
        <button className="btn" onClick={() => setEditing(true)}>{status ? 'Change limit' : 'Set limit'}</button>
      )}
      <ErrorBox message={error} />
    </div>
  );
}

export default function Budgets() {
  const [month, setMonth] = useState(thisMonth());
  const { data, loading, error, reload } = useAsync(() => api.budgets(month), [month]);
  const cats = useAsync(() => api.categories(), []);

  if ((loading && !data) || !cats.data) return error ? <ErrorBox message={error} onRetry={reload} /> : <Loader />;

  const byCategory = Object.fromEntries((data || []).map((b) => [b.category, b]));
  const trouble = (data || []).filter((b) => b.status !== 'ok');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Budgets</h1>
          <p className="muted">Set monthly limits and keep an eye on your spending.</p>
        </div>
        <label className="inline-field">
          <span>Month</span>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
      </div>

      <ErrorBox message={error} onRetry={reload} />

      {trouble.length > 0 && (
        <ul className="alerts">
          {trouble.map((b) => (
            <li key={b.category} className={b.status}>
              {b.category === 'Overall' ? 'Total budget' : `${b.category} budget`}:{' '}
              {b.status === 'over' ? `exceeded by ${money(-b.remaining)}.` : `${pct(b.usedPct)} used, only ${money(b.remaining)} left.`}
            </li>
          ))}
        </ul>
      )}

      <BudgetCard key={`Overall-${byCategory.Overall?.limit}`} category="Overall" status={byCategory.Overall} onChanged={reload} />

      <h2 className="section-title">Category budgets</h2>
      <div className="budget-grid">
        {cats.data.map((c) => (
          <BudgetCard key={`${c}-${byCategory[c]?.limit}`} category={c} status={byCategory[c]} onChanged={reload} />
        ))}
      </div>
    </>
  );
}
