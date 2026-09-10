import React from 'react';

export default function StatCard({ label, value, sub, accent = 'ice' }) {
  const accentClasses = {
    ice: 'text-ice-200',
    red: 'text-red-300',
    amber: 'text-amber-300',
    emerald: 'text-emerald-300',
  };
  return (
    <div className="rounded-xl border border-ice-800/60 bg-ice-900/50 p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-ice-400">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${accentClasses[accent]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-ice-500">{sub}</div>}
    </div>
  );
}
