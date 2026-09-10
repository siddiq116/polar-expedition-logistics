import React, { useEffect, useState } from 'react';
import client from '../api/client';

const CONDITION_STYLES = {
  operational: 'text-emerald-300',
  degraded: 'text-amber-300',
  needs_maintenance: 'text-amber-300',
  out_of_service: 'text-red-300',
};

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    client.get('/assets').then((res) => {
      setAssets(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-ice-400">Loading assets…</div>;

  const filtered = assets.filter((a) =>
    `${a.name} ${a.category} ${a.camp_name || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ice-100">Asset Registry</h1>
      <p className="mb-6 text-sm text-ice-400">Equipment, vehicles, and infrastructure across all camps.</p>

      <input
        placeholder="Search assets…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-lg border border-ice-700 bg-ice-950 px-3 py-2 text-sm text-ice-100 outline-none focus:border-ice-400"
      />

      <div className="overflow-hidden rounded-xl border border-ice-800/60">
        <table className="w-full text-sm">
          <thead className="bg-ice-900/80 text-left text-xs uppercase tracking-wide text-ice-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Camp</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Last Maintenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ice-800/60 bg-ice-900/40">
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium text-ice-100">{a.name}</td>
                <td className="px-4 py-3 capitalize text-ice-300">{a.category}</td>
                <td className="px-4 py-3 text-ice-300">{a.camp_name || '—'}</td>
                <td className={`px-4 py-3 capitalize font-medium ${CONDITION_STYLES[a.condition] || 'text-ice-300'}`}>
                  {a.condition.replace('_', ' ')}
                </td>
                <td className="px-4 py-3 text-ice-300">{a.assigned_to || '—'}</td>
                <td className="px-4 py-3 text-ice-500">
                  {a.last_maintenance ? new Date(a.last_maintenance).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
