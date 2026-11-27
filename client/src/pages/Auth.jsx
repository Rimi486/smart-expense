import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorBox } from '../components/ui.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!isLogin && form.name.trim().length < 2) return setError('Name must be at least 2 characters');
    if (!EMAIL.test(form.email)) return setError('Enter a valid email address');
    if (!isLogin && form.password.length < 6) return setError('Password must be at least 6 characters');
    if (isLogin && !form.password) return setError('Enter your password');
    if (!isLogin && form.password !== form.confirm) return setError('Passwords do not match');

    setBusy(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register({ name: form.name, email: form.email, password: form.password });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth-brand">
        <h1>Personal Expense and Budget Management System</h1>
        <p>Track income and spending, set budgets, and understand where your money goes.</p>
      </aside>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted">{isLogin ? 'Log in to see your dashboard.' : 'It only takes a minute.'}</p>
        {!isLogin && (
          <label>Full name<input value={form.name} onChange={set('name')} autoComplete="name" /></label>
        )}
        <label>Email<input type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
        <label>Password<input type="password" value={form.password} onChange={set('password')} autoComplete={isLogin ? 'current-password' : 'new-password'} /></label>
        {!isLogin && (
          <label>Confirm password<input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></label>
        )}
        <ErrorBox message={error} />
        <button className="btn primary" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}</button>
        <p className="switch">
          {isLogin ? "Don't have an account? " : 'Already registered? '}
          <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Sign up' : 'Log in'}</Link>
        </p>
      </form>
    </div>
  );
}
