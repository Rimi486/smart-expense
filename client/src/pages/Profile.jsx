import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks.js';
import { fmtDate } from '../theme.js';
import { ErrorBox, Modal } from '../components/ui.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENCIES = [['INR', '₹ Indian Rupee'], ['USD', '$ US Dollar'], ['EUR', '€ Euro'], ['GBP', '£ British Pound']];

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const stats = useAsync(() => api.profile(), []);

  const [form, setForm] = useState({ name: user.name, email: user.email, currency: user.currency });
  const [formMsg, setFormMsg] = useState({ error: '', ok: '' });
  const [profileBusy, setProfileBusy] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ error: '', ok: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [delPw, setDelPw] = useState('');
  const [delError, setDelError] = useState('');

  async function saveProfile(e) {
    e.preventDefault();
    setFormMsg({ error: '', ok: '' });
    if (form.name.trim().length < 2) return setFormMsg({ error: 'Name must be at least 2 characters', ok: '' });
    if (!EMAIL.test(form.email)) return setFormMsg({ error: 'Enter a valid email address', ok: '' });
    setProfileBusy(true);
    try {
      const r = await api.updateProfile(form);
      setUser(r.user);
      setFormMsg({ error: '', ok: 'Profile updated.' });
    } catch (err) {
      setFormMsg({ error: err.message, ok: '' });
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg({ error: '', ok: '' });
    if (pw.newPassword.length < 6) return setPwMsg({ error: 'New password must be at least 6 characters', ok: '' });
    if (pw.newPassword !== pw.confirm) return setPwMsg({ error: 'New passwords do not match', ok: '' });
    setPwBusy(true);
    try {
      await api.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg({ error: '', ok: 'Password changed.' });
    } catch (err) {
      setPwMsg({ error: err.message, ok: '' });
    } finally {
      setPwBusy(false);
    }
  }

  async function deleteAccount(e) {
    e.preventDefault();
    setDelError('');
    if (!delPw) return setDelError('Enter your password');
    setDelBusy(true);
    try {
      await api.deleteAccount(delPw);
      logout();
    } catch (err) {
      setDelError(err.message);
      setDelBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p className="muted">Manage your account and preferences.</p>
        </div>
      </div>

      <section className="card profile-head">
        <div className="avatar big" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <p className="muted">
            Member since {fmtDate(user.createdAt)}
            {stats.data && ` · ${stats.data.stats.transactions} transactions · ${stats.data.stats.budgets} budgets`}
          </p>
        </div>
      </section>

      <section className="grid-2">
        <form className="card form" onSubmit={saveProfile} noValidate>
          <h2 className="card-title">Account details</h2>
          <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Currency
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {CURRENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <ErrorBox message={formMsg.error} />
          {formMsg.ok && <p className="success">{formMsg.ok}</p>}
          <button className="btn primary" disabled={profileBusy}>{profileBusy ? 'Saving…' : 'Save changes'}</button>
        </form>

        <form className="card form" onSubmit={savePassword} noValidate>
          <h2 className="card-title">Change password</h2>
          <label>Current password<input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
          <label>New password<input type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></label>
          <label>Confirm new password<input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
          <ErrorBox message={pwMsg.error} />
          {pwMsg.ok && <p className="success">{pwMsg.ok}</p>}
          <button className="btn primary" disabled={pwBusy}>{pwBusy ? 'Updating…' : 'Update password'}</button>
        </form>
      </section>

      <section className="card danger-zone">
        <div>
          <h2 className="card-title">Delete account</h2>
          <p className="muted">Permanently removes your account, transactions and budgets. This cannot be undone.</p>
        </div>
        <button className="btn danger-solid" onClick={() => { setDelPw(''); setDelError(''); setDeleting(true); }}>Delete account</button>
      </section>

      {deleting && (
        <Modal title="Delete your account?" onClose={() => setDeleting(false)}>
          <form className="form" onSubmit={deleteAccount} noValidate>
            <p>Enter your password to confirm. All your data will be erased.</p>
            <label>Password<input type="password" autoFocus value={delPw} onChange={(e) => setDelPw(e.target.value)} /></label>
            <ErrorBox message={delError} />
            <div className="actions">
              <button type="button" className="btn" disabled={delBusy} onClick={() => setDeleting(false)}>Cancel</button>
              <button className="btn danger-solid" disabled={delBusy}>{delBusy ? 'Deleting…' : 'Delete everything'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
