import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '▣' },
  { to: '/alerts', label: 'Resupply Alerts', icon: '⚠' },
  { to: '/map', label: 'Live Map', icon: '⌖' },
  { to: '/assets', label: 'Assets', icon: '⚙' },
  { to: '/personnel', label: 'Personnel', icon: '☺' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-ice-950">
      <aside className="w-60 shrink-0 border-r border-ice-800/60 bg-ice-900/60 p-4 flex flex-col">
        <div className="mb-8 px-2">
          <div className="text-lg font-bold text-ice-100 tracking-tight">Polar Ops</div>
          <div className="text-xs text-ice-400">Logistics &amp; Asset Command</div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ice-500/20 text-ice-100'
                    : 'text-ice-300 hover:bg-ice-800/50 hover:text-ice-100'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-ice-800/60 pt-4 px-2">
          <div className="text-sm font-medium text-ice-100">{user?.full_name}</div>
          <div className="text-xs text-ice-400 capitalize mb-3">{user?.role}</div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full rounded-lg bg-ice-800/60 px-3 py-1.5 text-xs font-medium text-ice-200 hover:bg-ice-800"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
