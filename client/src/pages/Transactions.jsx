import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, money } from '../api.js';
import { useAsync, useDebounced } from '../hooks.js';
import { categoryColor, fmtDate } from '../theme.js';
import TransactionModal from '../components/TransactionModal.jsx';
import { EmptyState, ErrorBox, Loader, Modal } from '../components/ui.jsx';

const SORTS = [
  ['date:desc', 'Newest first'],
  ['date:asc', 'Oldest first'],
  ['amount:desc', 'Highest amount'],
  ['amount:asc', 'Lowest amount'],
];
const BLANK = { search: '', category: '', from: '', to: '', sort: 'date:desc' };

// One page component serves both Expenses (kind="expense") and Income (kind="income")
export default function Transactions({ kind }) {
  const isExpense = kind === 'expense';
  const [filters, setFilters] = useState(BLANK);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null | 'new' | a transaction
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const search = useDebounced(filters.search);
  const [sort, order] = filters.sort.split(':');
  const params = { type: isExpense ? 'spending' : 'income', search, category: filters.category, from: filters.from, to: filters.to, sort, order, page, limit: 10 };

  const { data, loading, error, reload } = useAsync(() => api.transactions(params), [JSON.stringify(params)]);
  const cats = useAsync(() => api.categories(), []);

  const setFilter = (key) => (e) => { setFilters({ ...filters, [key]: e.target.value }); setPage(1); };
  const filtered = Object.keys(BLANK).some((k) => filters[k] !== BLANK[k]);

  async function confirmDelete() {
    try {
      await api.deleteTransaction(deleting._id);
      setDeleting(null);
      if (data.items.length === 1 && page > 1) setPage(page - 1); // last row on this page was removed
      else reload();
    } catch (e) {
      setDeleteError(e.message);
    }
  }

  const noun = isExpense ? 'expense' : 'income';
  return (
    <>
      <div className="page-head">
        <div>
          <h1>{isExpense ? 'Expenses' : 'Income'}</h1>
          <p className="muted">{data ? `${data.total} record${data.total === 1 ? '' : 's'} · ${money(data.totalAmount)} total` : ' '}</p>
        </div>
        <button className="btn primary" onClick={() => setEditing('new')}><Plus size={16} /> Add {noun}</button>
      </div>

      <div className="card filters">
        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input placeholder={`Search ${noun}s`} value={filters.search} onChange={setFilter('search')} aria-label="Search" />
        </label>
        {isExpense && (
          <select value={filters.category} onChange={setFilter('category')} aria-label="Filter by category">
            <option value="">All categories</option>
            {(cats.data || []).map((c) => <option key={c}>{c}</option>)}
            <option value="Investment">Investment</option>
          </select>
        )}
        <label className="inline-field"><span>From</span><input type="date" value={filters.from} onChange={setFilter('from')} /></label>
        <label className="inline-field"><span>To</span><input type="date" value={filters.to} onChange={setFilter('to')} /></label>
        <select value={filters.sort} onChange={setFilter('sort')} aria-label="Sort by">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {filtered && <button className="btn" onClick={() => { setFilters(BLANK); setPage(1); }}>Reset</button>}
      </div>

      <ErrorBox message={error} onRetry={reload} />

      <div className="card table-card">
        {loading && !data ? (
          <Loader />
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title={filtered ? 'No matching records' : `No ${noun} records yet`}
            text={filtered ? 'Try changing or resetting the filters.' : `Add your first ${noun} to see it here.`}
            action={!filtered && <button className="btn primary" onClick={() => setEditing('new')}>Add {noun}</button>}
          />
        ) : data ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>{isExpense ? 'Title' : 'Source'}</th>
                  {isExpense && <th>Category</th>}
                  <th>Description</th>
                  <th className="num">Amount</th>
                  <th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t._id}>
                    <td>{fmtDate(t.date)}</td>
                    <td><strong>{t.title}</strong>{t.unusual && <span className="badge warn">unusually high</span>}</td>
                    {isExpense && (
                      <td>
                        <span className="pill" style={{ '--c': categoryColor(t.category) }}>{t.category}</span>
                        {t.autoCategorized && <span className="badge">auto</span>}
                      </td>
                    )}
                    <td className="desc">{t.description || '—'}</td>
                    <td className={`num amount ${isExpense ? 'neg' : 'pos'}`}>{isExpense ? '−' : '+'}{money(t.amount)}</td>
                    <td className="num">
                      <button className="icon-btn" onClick={() => setEditing(t)} aria-label={`Edit ${t.title}`}><Pencil size={16} /></button>
                      <button className="icon-btn danger" onClick={() => { setDeleteError(''); setDeleting(t); }} aria-label={`Delete ${t.title}`}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {data && data.pages > 1 && (
          <div className="pager">
            <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /> Previous</button>
            <span>Page {data.page} of {data.pages}</span>
            <button className="btn" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next <ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {editing && (
        <TransactionModal
          kind={kind}
          item={editing === 'new' ? null : editing}
          categories={cats.data || []}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}

      {deleting && (
        <Modal title={`Delete ${noun}?`} onClose={() => setDeleting(null)}>
          <p>This will permanently delete <strong>{deleting.title}</strong> ({money(deleting.amount)}).</p>
          <ErrorBox message={deleteError} />
          <div className="actions">
            <button className="btn" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn danger-solid" onClick={confirmDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}
