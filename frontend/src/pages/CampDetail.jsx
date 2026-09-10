import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import client from '../api/client';
import AlertBadge from '../components/AlertBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function ConsumableRow({ item, onLog }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState(null);
  const [amount, setAmount] = useState('');
  const { user } = useAuth();

  async function toggleExpand() {
    if (!expanded && !history) {
      const res = await client.get(`/consumables/${item.consumable_id}/history`);
      setHistory(res.data.map((h) => ({ date: h.log_date.slice(5), amount: h.amount_used })));
    }
    setExpanded((e) => !e);
  }

  async function handleLog(e) {
    e.preventDefault();
    if (!amount) return;
    await onLog(item.consumable_id, Number(amount));
    setAmount('');
    setHistory(null);
    setExpanded(false);
  }

  return (
    <div className="rounded-xl border border-ice-800/60 bg-ice-900/50 p-4">
      <div className="flex items-center justify-between cursor-pointer" onClick={toggleExpand}>
        <div>
          <div className="text-sm font-semibold text-ice-100">{item.name}</div>
          <div className="text-xs text-ice-500 capitalize">{item.category}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-xs">
            <div className="text-ice-200 font-semibold">
              {item.current_stock} {item.unit}
            </div>
            <div className="text-ice-500">
              {item.days_remaining != null ? `${item.days_remaining}d remaining` : 'no data'}
            </div>
          </div>
          <AlertBadge level={item.level} />
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-ice-800/60 pt-4">
          <div className="grid grid-cols-2 gap-3 text-xs mb-4 md:grid-cols-4">
            <div>
              <div className="text-ice-500">Daily usage</div>
              <div className="text-ice-200 font-semibold">
                {item.daily_rate} {item.unit}/day
              </div>
            </div>
            <div>
              <div className="text-ice-500">Trend</div>
              <div
                className={`font-semibold ${
                  item.trend_pct > 5 ? 'text-red-400' : item.trend_pct < -5 ? 'text-emerald-400' : 'text-ice-200'
                }`}
              >
                {item.trend_pct > 0 ? '+' : ''}
                {item.trend_pct}%
              </div>
            </div>
            <div>
              <div className="text-ice-500">Depletion date</div>
              <div className="text-ice-200 font-semibold">
                {item.depletion_date ? new Date(item.depletion_date).toLocaleDateString() : '—'}
              </div>
            </div>
            <div>
              <div className="text-ice-500">Safety buffer</div>
              <div className="text-ice-200 font-semibold">{item.safety_buffer_days} days</div>
            </div>
          </div>

          {history && history.length > 0 && (
            <div className="h-40 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f4560" />
                  <XAxis dataKey="date" stroke="#5aa8d1" fontSize={10} />
                  <YAxis stroke="#5aa8d1" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: '#0b1e2d', border: '1px solid #1f4560', fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#5aa8d1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {(user?.role === 'command' || user?.role === 'logistics' || user?.role === 'field') && (
            <form onSubmit={handleLog} className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                step="0.01"
                placeholder={`Log usage (${item.unit})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded-lg border border-ice-700 bg-ice-950 px-3 py-1.5 text-xs text-ice-100 outline-none focus:border-ice-400"
              />
              <button
                type="submit"
                className="rounded-lg bg-ice-500 px-3 py-1.5 text-xs font-semibold text-ice-950 hover:bg-ice-400"
              >
                Log
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function CampDetail() {
  const { id } = useParams();
  const [camp, setCamp] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await client.get(`/camps/${id}`);
    setCamp(res.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLog(consumableId, amount) {
    await client.post(`/consumables/${consumableId}/log`, { amount_used: amount });
    await load();
  }

  if (loading) return <div className="text-ice-400">Loading camp…</div>;
  if (!camp) return <div className="text-ice-400">Camp not found.</div>;

  return (
    <div>
      <Link to="/" className="text-xs text-ice-400 hover:text-ice-200">
        ← Back to overview
      </Link>
      <div className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ice-100">{camp.name}</h1>
          <p className="text-sm text-ice-400 capitalize">{camp.type.replace('_', ' ')} · {camp.personnel_count} personnel</p>
          {camp.notes && <p className="mt-1 text-xs text-ice-500 max-w-xl">{camp.notes}</p>}
        </div>
        <div className="text-right text-xs text-ice-400">
          <div>Next resupply</div>
          <div className="text-sm font-semibold text-ice-200">
            {camp.next_resupply_date ? new Date(camp.next_resupply_date).toLocaleDateString() : 'unscheduled'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-ice-100">Consumables &amp; Forecast</h2>
          <div className="space-y-3">
            {camp.consumables.map((c) => (
              <ConsumableRow key={c.consumable_id} item={c} onLog={handleLog} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-ice-100">Assets</h2>
            <div className="space-y-2">
              {camp.assets.length === 0 && <div className="text-xs text-ice-500">No assets assigned.</div>}
              {camp.assets.map((a) => (
                <div key={a.id} className="rounded-lg border border-ice-800/60 bg-ice-900/50 p-3 text-xs">
                  <div className="font-semibold text-ice-200">{a.name}</div>
                  <div className="text-ice-500 capitalize">
                    {a.category} · {a.condition.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-ice-100">Personnel</h2>
            <div className="space-y-2">
              {camp.personnel.length === 0 && <div className="text-xs text-ice-500">No personnel assigned.</div>}
              {camp.personnel.map((p) => (
                <div key={p.id} className="rounded-lg border border-ice-800/60 bg-ice-900/50 p-3 text-xs">
                  <div className="font-semibold text-ice-200">{p.full_name}</div>
                  <div className="text-ice-500">
                    {p.role} · <span className="capitalize">{p.health_status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
