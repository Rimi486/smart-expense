import { money } from '../api.js';

const R = 100;
const STROKE = 20;
const C = 2 * Math.PI * R;
const GAP = STROKE + 8; // room for the rounded end caps plus a visible gap

// summary = { income, balance, savingsPct, expensePct, investmentPct }
export default function Donut({ summary }) {
  const parts = [
    { key: 'savings', label: 'Savings', pct: summary.savingsPct },
    { key: 'expense', label: 'Expense', pct: summary.expensePct },
    { key: 'investment', label: 'Investment', pct: summary.investmentPct },
  ];
  const visible = parts.filter((p) => p.pct > 0);
  const single = visible.length === 1;
  const empty = summary.income === 0 && visible.length === 0;

  let offset = 0;
  const arcs = visible.map((p) => {
    const length = single ? C : Math.max(0.1, p.pct * C - GAP);
    const start = single ? 0 : offset + GAP / 2;
    offset += p.pct * C;
    return { ...p, length, start };
  });

  return (
    <div className="donut-wrap">
      <div className="donut">
        <svg viewBox="0 0 260 260" role="img" aria-label="Savings, expense and investment split">
          <g transform="rotate(-90 130 130)" fill="none" strokeWidth={STROKE}>
            <circle cx="130" cy="130" r={R} stroke="var(--track)" />
            {arcs.map((a) => (
              <circle
                key={a.key}
                cx="130" cy="130" r={R}
                stroke={`var(--${a.key})`}
                strokeLinecap={single ? 'butt' : 'round'}
                strokeDasharray={`${a.length} ${C}`}
                strokeDashoffset={-a.start}
                className="arc"
              />
            ))}
          </g>
        </svg>
        <div className="donut-center">
          <span>Total</span>
          <strong className={summary.balance < 0 ? 'neg' : ''}>{money(summary.balance)}</strong>
        </div>
      </div>

      {empty && <p className="muted center">Add your salary as income to see your split.</p>}

      <ul className="legend">
        {parts.map((p) => (
          <li key={p.key}>
            <i style={{ background: `var(--${p.key})` }} />
            <span>{p.label}</span>
            <b>{Math.round(p.pct * 100)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
