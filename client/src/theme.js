export const CAT_COLORS = {
  Food: '#f59e0b',
  Shopping: '#c0308f',
  Transportation: '#3b82f6',
  Education: '#6366f1',
  Entertainment: '#8b5cf6',
  Healthcare: '#ef4444',
  Bills: '#2a9d8f',
  Others: '#64748b',
  Investment: '#2a9d8f',
  Income: '#1f3a5f',
};
export const categoryColor = (c) => CAT_COLORS[c] || '#64748b';
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const pct = (n) => `${Math.round((n || 0) * 100)}%`;
