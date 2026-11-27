import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, LayoutDashboard, LogOut, Menu, PiggyBank, Receipt, TrendingUp, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/income', label: 'Income', icon: TrendingUp },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="app">
      <header className="mobile-bar">
        <button className="icon-btn light" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
        <strong>Expense Tracker</strong>
      </header>

      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <span>Expense Tracker</span>
          <button className="icon-btn light close-nav" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav>
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="side-user">
          <div className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
          <div className="who">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button className="icon-btn light" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
