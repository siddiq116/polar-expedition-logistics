import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('command1');
  const [password, setPassword] = useState('polar123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ice-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ice-800/60 bg-ice-900/60 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-ice-100">Polar Ops</div>
          <div className="text-sm text-ice-400">Expedition Logistics &amp; Asset Command</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ice-300">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-ice-700 bg-ice-950 px-3 py-2 text-sm text-ice-100 outline-none focus:border-ice-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ice-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ice-700 bg-ice-950 px-3 py-2 text-sm text-ice-100 outline-none focus:border-ice-400"
            />
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ice-500 px-3 py-2 text-sm font-semibold text-ice-950 hover:bg-ice-400 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="mt-6 rounded-lg bg-ice-950/60 p-3 text-xs text-ice-400">
          <div className="font-semibold text-ice-300 mb-1">Demo accounts (password: polar123)</div>
          <div>command1 — Expedition Commander</div>
          <div>logistics1 — Logistics Officer</div>
          <div>field1 — Field Team Lead</div>
        </div>
      </div>
    </div>
  );
}
