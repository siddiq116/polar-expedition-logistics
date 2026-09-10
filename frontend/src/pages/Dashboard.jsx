import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import StatCard from '../components/StatCard.jsx';
import AlertBadge from '../components/AlertBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [camps, setCamps] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const load = useCallback(async () => {
    const [campsRes, alertsRes] = await Promise.all([
      client.get('/camps'),
      client.get('/alerts'),
    ]);
    setCamps(campsRes.data);
    setAlerts(alertsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSimulate() {
    setSimulating(true);
    try {
      await client.post('/simulate/advance-day');
      await load();
    } finally {
      setSimulating(false);
    }
  }

  if (loading) return <div className="text-ice-400">Loading command overview…</div>;

  const totalPersonnel = camps.reduce((s, c) => s + c.personnel_count, 0);
  const criticalCount = alerts.filter((a) => a.level === 'critical').length;
  const warningCount = alerts.filter((a) => a.level === 'warning').length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ice-100">Command Overview</h1>
          <p className="text-sm text-ice-400">Welcome back, {user?.full_name}.</p>
        </div>
        {(user?.role === 'command' || user?.role === 'logistics') && (
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="rounded-lg bg-ice-500 px-4 py-2 text-sm font-semibold text-ice-950 hover:bg-ice-400 disabled:opacity-60"
            title="Advances the simulated clock by one day, generating new consumption data"
          >
            {simulating ? 'Advancing…' : 'Simulate Next Day →'}
          </button>
        )}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Active Camps" value={camps.length} />
        <StatCard label="Total Personnel" value={totalPersonnel} />
        <StatCard label="Critical Alerts" value={criticalCount} accent="red" />
        <StatCard label="Warnings" value={warningCount} accent="amber" />
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ice-100">Predictive Resupply Alerts</h2>
          <Link to="/alerts" className="text-xs font-medium text-ice-400 hover:text-ice-200">
            View all →
          </Link>
        </div>
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-ice-800/60 bg-ice-900/50 p-6 text-sm text-ice-400">
            All camps are within safe supply margins.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <div
                key={a.consumable_id}
                className="flex items-center justify-between rounded-xl border border-ice-800/60 bg-ice-900/50 p-4"
              >
                <div>
                  <div className="text-sm font-semibold text-ice-100">
                    {a.name} — {a.camp_name}
                  </div>
                  <div className="text-xs text-ice-400">
                    {a.days_remaining != null
                      ? `${a.days_remaining} days remaining at current usage`
                      : 'Insufficient data'}
                    {a.shortage_gap_days != null && a.shortage_gap_days > 0 && (
                      <span className="text-red-400">
                        {' '}
                        — {a.shortage_gap_days.toFixed(1)}d short of next resupply
                      </span>
                    )}
                  </div>
                </div>
                <AlertBadge level={a.level} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ice-100">Camps &amp; Stations</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {camps.map((camp) => (
            <Link
              key={camp.id}
              to={`/camps/${camp.id}`}
              className="rounded-xl border border-ice-800/60 bg-ice-900/50 p-5 hover:border-ice-500/60 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-ice-100">{camp.name}</div>
                  <div className="text-xs uppercase tracking-wide text-ice-500">
                    {camp.type.replace('_', ' ')}
                  </div>
                </div>
                {camp.alert_summary.critical > 0 ? (
                  <AlertBadge level="critical" />
                ) : camp.alert_summary.warning > 0 ? (
                  <AlertBadge level="warning" />
                ) : (
                  <AlertBadge level="ok" />
                )}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-ice-400">
                <span>{camp.personnel_count} personnel</span>
                <span>
                  Resupply:{' '}
                  {camp.next_resupply_date
                    ? new Date(camp.next_resupply_date).toLocaleDateString()
                    : 'unscheduled'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
