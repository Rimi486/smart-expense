export default function StatCard({ icon: Icon, label, value, tone = 'indigo', hint }) {
  return (
    <div className="stat">
      <span className={`stat-icon ${tone}`}><Icon size={20} aria-hidden="true" /></span>
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        {hint && <small className="stat-hint">{hint}</small>}
      </div>
    </div>
  );
}
