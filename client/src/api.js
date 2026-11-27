const TOKEN_KEY = 'et_token';
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(url, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Make sure the API is running.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) onUnauthorized(); // expired or invalid token: send the user to login
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const qs = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v != null) p.set(k, v); });
  return p.toString();
};

export const api = {
  // auth
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  me: () => request('/api/auth/me'),
  // transactions
  categories: () => request('/api/categories'),
  transactions: (params) => request(`/api/transactions?${qs(params)}`),
  addTransaction: (body) => request('/api/transactions', { method: 'POST', body }),
  updateTransaction: (id, body) => request(`/api/transactions/${id}`, { method: 'PUT', body }),
  deleteTransaction: (id) => request(`/api/transactions/${id}`, { method: 'DELETE' }),
  // dashboard, budgets, reports
  dashboard: (month) => request(`/api/dashboard?month=${month}`),
  budgets: (month) => request(`/api/budgets?month=${month}`),
  setBudget: (category, limit) => request(`/api/budgets/${encodeURIComponent(category)}`, { method: 'PUT', body: { limit } }),
  deleteBudget: (category) => request(`/api/budgets/${encodeURIComponent(category)}`, { method: 'DELETE' }),
  report: (period, date) => request(`/api/reports?${qs({ period, date })}`),
  // profile
  profile: () => request('/api/profile'),
  updateProfile: (body) => request('/api/profile', { method: 'PUT', body }),
  changePassword: (body) => request('/api/profile/password', { method: 'PUT', body }),
  deleteAccount: (password) => request('/api/profile', { method: 'DELETE', body: { password } }),
};

// Money formatting follows the currency chosen on the profile page
const LOCALES = { INR: 'en-IN', USD: 'en-US', EUR: 'en-IE', GBP: 'en-GB' };
let currency = 'INR';
export const setCurrency = (c) => { currency = c || 'INR'; };
export const money = (n) =>
  new Intl.NumberFormat(LOCALES[currency] || 'en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n || 0);
