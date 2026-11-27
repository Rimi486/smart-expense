import { useEffect } from 'react';
import { AlertCircle, Inbox, X } from 'lucide-react';

export function Loader({ full, label = 'Loading…' }) {
  return (
    <div className={full ? 'loader full' : 'loader'} role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <Inbox size={36} aria-hidden="true" />
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-box" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <span>{message}</span>
      {onRetry && <button className="link" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value, status = 'ok' }) {
  const width = Math.min(100, Math.max(0, value * 100));
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(width)} aria-valuemin="0" aria-valuemax="100">
      <i className={status} style={{ width: `${width}%` }} />
    </div>
  );
}

export function Alerts({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="alerts">
      {items.map((a, i) => <li key={i} className={a.level}>{a.text}</li>)}
    </ul>
  );
}
