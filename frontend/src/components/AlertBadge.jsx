import React from 'react';

const STYLES = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/40',
  warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  ok: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

const LABELS = {
  critical: 'Critical',
  warning: 'Warning',
  ok: 'OK',
};

export default function AlertBadge({ level }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        STYLES[level] || STYLES.ok
      }`}
    >
      {LABELS[level] || level}
    </span>
  );
}
