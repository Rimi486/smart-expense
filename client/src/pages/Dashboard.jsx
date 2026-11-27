import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, Wallet } from 'lucide-react';
import { api, money } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync, thisMonth } from '../hooks.js';
import { pct } from '../theme.js';
import StatCard from '../components/StatCard.jsx';
import Donut from '../components/Donut.jsx';
import QuickAdd from '../components/QuickAdd.jsx';
import History from '../components/History.jsx';
import { Alerts, EmptyState, ErrorBox, Loader } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [month, setMonth] = useState(thisMonth());
  const { data, loading, error, reload } = useAsync(() => api.dashboard(month), [month]);

  if (loading && !data) return <Loader />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;

  const { totals, month: m, split, recent, alerts } = data;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hello, {user.name.split(' ')[0]}</h1>
          <p className="muted">Here is how your money is doing.</p>
        </div>
        <label className="inline-field">
          <span>Month</span>
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </label>
      </div>

      <ErrorBox message={error} onRetry={reload} />

      <section className="stats">
        <StatCard icon={ArrowUpCircle} tone="green" label="Total income" value={money(totals.income)} />
        <StatCard icon={ArrowDownCircle} tone="pink" label="Total expenses" value={money(totals.expense)} hint={totals.investment ? `+ ${money(totals.investment)} invested` : undefined} />
        <StatCard icon={Wallet} tone={totals.balance < 0 ? 'pink' : 'navy'} label="Available balance" value={money(totals.balance)} />
        <StatCard icon={CalendarDays} tone="indigo" label="Spent this month" value={money(m.expense)} hint={m.changePct === null ? undefined : `${m.changePct > 0 ? '+' : ''}${pct(m.changePct)} vs last month`} />
      </section>

      <section className="grid-2">
        <div className="card">
          <h2 className="card-title">Income split this month</h2>
          <Donut summary={{ ...split, income: m.income }} />
        </div>
        <div className="card">
          <h2 className="card-title">Transaction</h2>
          <QuickAdd onAdded={reload} />
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <h2 className="card-title">Monthly spending summary</h2>
          <dl className="summary">
            <div><dt>Income</dt><dd>{money(m.income)}</dd></div>
            <div><dt>Expenses</dt><dd>{money(m.expense)}</dd></div>
            <div><dt>Investments</dt><dd>{money(m.investment)}</dd></div>
            <div><dt>Left over</dt><dd>{money(m.balance)}</dd></div>
            {m.inProgress && <div><dt>On pace to spend</dt><dd>{money(m.projected)}</dd></div>}
            <div><dt>Top category</dt><dd>{m.topCategory ? `${m.topCategory.category} (${money(m.topCategory.total)})` : '—'}</dd></div>
          </dl>
          {alerts.length > 0 && (
            <>
              <h3 className="sub-title">Heads up</h3>
              <Alerts items={alerts} />
            </>
          )}
        </div>
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">Recent transactions</h2>
            <Link to="/expenses" className="link">View all</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="No transactions yet" text="Add your salary on the right to get started." />
          ) : (
            <History items={recent} onDeleted={reload} />
          )}
        </div>
      </section>
    </>
  );
}
