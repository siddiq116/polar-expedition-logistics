import React, { useEffect, useState } from 'react';
import client from '../api/client';

const HEALTH_STYLES = {
  fit: 'text-emerald-300',
  fatigued: 'text-amber-300',
  injured: 'text-red-300',
  ill: 'text-red-300',
};

export default function Personnel() {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/personnel').then((res) => {
      setPersonnel(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-ice-400">Loading personnel…</div>;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ice-100">Personnel Roster</h1>
      <p className="mb-6 text-sm text-ice-400">Team assignments, certifications, and health status.</p>

      <div className="overflow-hidden rounded-xl border border-ice-800/60">
        <table className="w-full text-sm">
          <thead className="bg-ice-900/80 text-left text-xs uppercase tracking-wide text-ice-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Camp</th>
              <th className="px-4 py-3">Certification</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Last Check-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ice-800/60 bg-ice-900/40">
            {personnel.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-ice-100">{p.full_name}</td>
                <td className="px-4 py-3 text-ice-300">{p.role}</td>
                <td className="px-4 py-3 text-ice-300">{p.camp_name || '—'}</td>
                <td className="px-4 py-3 text-ice-500">{p.certification || '—'}</td>
                <td className={`px-4 py-3 capitalize font-medium ${HEALTH_STYLES[p.health_status] || 'text-ice-300'}`}>
                  {p.health_status}
                </td>
                <td className="px-4 py-3 text-ice-500">
                  {p.last_checkin ? new Date(p.last_checkin).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
