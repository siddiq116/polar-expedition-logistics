import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import AlertBadge from '../components/AlertBadge.jsx';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    client.get('/alerts').then((res) => {
      setAlerts(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-ice-400">Loading alerts…</div>;

  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.level === filter);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ice-100">Predictive Resupply Alerts</h1>
      <p className="mb-6 text-sm text-ice-400">
        Forecasts are generated from a recency-weighted consumption trend per consumable, compared
        against each camp's next scheduled resupply date.
      </p>

      <div className="mb-5 flex gap-2">
        {['all', 'critical', 'warning'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
              filter === f
                ? 'bg-ice-500 text-ice-950'
                : 'bg-ice-900/60 text-ice-300 hover:bg-ice-800/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-ice-800/60 bg-ice-900/50 p-6 text-sm text-ice-400">
          Nothing to show here — no alerts at this level.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.consumable_id} className="rounded-xl border border-ice-800/60 bg-ice-900/50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Link to={`/camps/${a.camp_id}`} className="text-sm font-semibold text-ice-100 hover:text-ice-300">
                    {a.name} · {a.camp_name}
                  </Link>
                  <div className="text-xs uppercase tracking-wide text-ice-500">{a.category}</div>
                </div>
                <AlertBadge level={a.level} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                <div>
                  <div className="text-ice-500">Current stock</div>
                  <div className="font-semibold text-ice-200">
                    {a.current_stock} {a.unit}
                  </div>
                </div>
                <div>
                  <div className="text-ice-500">Daily usage (weighted)</div>
                  <div className="font-semibold text-ice-200">
                    {a.daily_rate} {a.unit}/day{' '}
                    <span className={a.trend_pct > 5 ? 'text-red-400' : a.trend_pct < -5 ? 'text-emerald-400' : 'text-ice-500'}>
                      ({a.trend_pct > 0 ? '+' : ''}
                      {a.trend_pct}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-ice-500">Projected depletion</div>
                  <div className="font-semibold text-ice-200">
                    {a.depletion_date ? new Date(a.depletion_date).toLocaleDateString() : '—'}{' '}
                    {a.days_remaining != null && (
                      <span className="text-ice-500">({a.days_remaining}d)</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-ice-500">Next resupply</div>
                  <div className="font-semibold text-ice-200">
                    {a.next_resupply_date ? new Date(a.next_resupply_date).toLocaleDateString() : 'unscheduled'}
                  </div>
                </div>
              </div>
              {a.shortage_gap_days != null && a.shortage_gap_days > 0 && (
                <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">
                  Projected to run out {a.shortage_gap_days.toFixed(1)} days before the next
                  scheduled resupply. Recommend expediting delivery or rationing.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
