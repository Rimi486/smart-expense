import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, money } from '../api.js';
import { useAsync, today } from '../hooks.js';
import { categoryColor, fmtDate, pct } from '../theme.js';
import { EmptyState, ErrorBox, Loader } from '../components/ui.jsx';

const PERIODS = [['week', 'Weekly'], ['month', 'Monthly'], ['year', 'Yearly']];
const tip = (v) => money(v);
const axis = (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v);

export default function Reports() {
  const [period, setPeriod] = useState('month');
  const [date, setDate] = useState(today());
  const { data, loading, error, reload } = useAsync(() => api.report(period, date), [period, date]);

  if (loading && !data) return <Loader />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;

  const { totals, categories, series, monthly, highestCategory, largestExpense, busiestWeekday } = data;
  const hasData = totals.income + totals.expense + totals.investment > 0;
  const rangeLabel = `${fmtDate(data.start)} – ${fmtDate(new Date(new Date(data.end).getTime() - 86400000))}`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p className="muted">{rangeLabel}</p>
        </div>
        <div className="head-tools">
          <div className="tabs" role="tablist">
            {PERIODS.map(([v, l]) => (
              <button key={v} role="tab" aria-selected={period === v} className={period === v ? 'active' : ''} onClick={() => setPeriod(v)}>{l}</button>
            ))}
          </div>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Report date" />
        </div>
      </div>

      <ErrorBox message={error} onRetry={reload} />

      <section className="stats">
        <div className="stat plain"><span className="stat-label">Income</span><strong className="stat-value pos">{money(totals.income)}</strong></div>
        <div className="stat plain"><span className="stat-label">Expenses</span><strong className="stat-value neg">{money(totals.expense)}</strong></div>
        <div className="stat plain"><span className="stat-label">Net balance</span><strong className={`stat-value ${totals.net < 0 ? 'neg' : ''}`}>{money(totals.net)}</strong></div>
        <div className="stat plain"><span className="stat-label">Savings rate</span><strong className="stat-value">{data.savingsRate === null ? '—' : pct(data.savingsRate)}</strong></div>
      </section>

      {!hasData ? (
        <div className="card"><EmptyState title="No data for this period" text="Add some income or expenses, or pick another date." /></div>
      ) : (
        <>
          <section className="grid-2">
            <div className="card">
              <h2 className="card-title">Spending by category</h2>
              {categories.length === 0 ? (
                <EmptyState title="No expenses in this period" />
              ) : (
                <div className="cat-chart">
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={categories} dataKey="total" nameKey="category" innerRadius={60} outerRadius={95} paddingAngle={2}>
                          {categories.map((c) => <Cell key={c.category} fill={categoryColor(c.category)} />)}
                        </Pie>
                        <Tooltip formatter={tip} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="cat-list">
                    {categories.map((c) => (
                      <li key={c.category}>
                        <i className="dot" style={{ background: categoryColor(c.category) }} />
                        <span>{c.category}</span>
                        <b>{money(c.total)}</b>
                        <small>{pct(c.share)}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="card-title">Spending patterns</h2>
              <dl className="summary">
                <div><dt>Highest spending category</dt><dd>{highestCategory ? `${highestCategory.category} (${money(highestCategory.total)})` : '—'}</dd></div>
                <div><dt>Average spend per day</dt><dd>{money(data.avgDaily)}</dd></div>
                <div><dt>Largest expense</dt><dd>{largestExpense ? `${largestExpense.title} (${money(largestExpense.amount)})` : '—'}</dd></div>
                <div><dt>Busiest weekday</dt><dd>{busiestWeekday ? `${busiestWeekday.day} (${money(busiestWeekday.total)})` : '—'}</dd></div>
                <div><dt>Investments</dt><dd>{money(totals.investment)}</dd></div>
                <div><dt>Transactions</dt><dd>{data.count}</dd></div>
              </dl>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Income vs expenses in {data.year}</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} />
                <YAxis tickFormatter={axis} tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={tip} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#1f3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#c0308f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="card">
            <h2 className="card-title">Spending trend</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} interval="preserveStartEnd" />
                <YAxis tickFormatter={axis} tickLine={false} axisLine={false} width={40} />
                <Tooltip formatter={tip} />
                <Line type="monotone" dataKey="expense" name="Expenses" stroke="#c0308f" strokeWidth={2.5} dot={series.length <= 12} />
              </LineChart>
            </ResponsiveContainer>
          </section>
        </>
      )}
    </>
  );
}
