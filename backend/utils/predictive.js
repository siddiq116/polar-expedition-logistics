const MS_PER_DAY = 1000 * 60 * 60 * 24;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

function diffDaysISO(laterStr, earlierStr) {
  const later = new Date(laterStr + 'T00:00:00Z').getTime();
  const earlier = new Date(earlierStr + 'T00:00:00Z').getTime();
  return (later - earlier) / MS_PER_DAY;
}

/**
 * Computes a recency-weighted daily consumption rate and trend from a log history.
 * Linear weights (1..n) favor the most recent entries so a sudden spike in usage
 * (e.g. bad weather, more personnel) shows up in the forecast quickly.
 */
function weightedRate(logs) {
  if (!logs.length) return { rate: 0, trendPct: 0 };
  const sorted = [...logs].sort((a, b) => (a.log_date < b.log_date ? -1 : 1));
  let weightedSum = 0;
  let weightTotal = 0;
  sorted.forEach((log, i) => {
    const weight = i + 1;
    weightedSum += log.amount_used * weight;
    weightTotal += weight;
  });
  const rate = weightedSum / weightTotal;

  const mid = Math.floor(sorted.length / 2) || 1;
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  const avg = (arr) => arr.reduce((s, l) => s + l.amount_used, 0) / (arr.length || 1);
  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf.length ? secondHalf : firstHalf);
  const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

  return { rate, trendPct };
}

/**
 * Projects depletion date for a consumable and flags shortage risk against
 * the camp's next scheduled resupply date.
 */
function analyzeConsumable(consumable, logs, nextResupplyDate) {
  const today = todayISO();
  const { rate, trendPct } = weightedRate(logs);

  const projectedDailyRate = Math.max(rate, 0);
  const daysRemaining =
    projectedDailyRate > 0.0001 ? consumable.current_stock / projectedDailyRate : Infinity;

  const depletionDate =
    Number.isFinite(daysRemaining) ? addDaysISO(today, daysRemaining) : null;

  let daysUntilResupply = null;
  let shortageGapDays = null;
  if (nextResupplyDate) {
    daysUntilResupply = diffDaysISO(nextResupplyDate, today);
    if (Number.isFinite(daysRemaining)) {
      shortageGapDays = daysUntilResupply - daysRemaining;
    }
  }

  let level = 'ok';
  const buffer = consumable.safety_buffer_days ?? 3;

  if (Number.isFinite(daysRemaining) && daysRemaining <= buffer) {
    level = 'critical';
  } else if (shortageGapDays !== null && shortageGapDays > 0) {
    level = 'critical';
  } else if (Number.isFinite(daysRemaining) && daysRemaining <= buffer + 5) {
    level = 'warning';
  } else if (shortageGapDays !== null && shortageGapDays > -3) {
    level = 'warning';
  }

  return {
    consumable_id: consumable.id,
    name: consumable.name,
    category: consumable.category,
    unit: consumable.unit,
    current_stock: consumable.current_stock,
    safety_buffer_days: buffer,
    daily_rate: Number(projectedDailyRate.toFixed(2)),
    trend_pct: Number(trendPct.toFixed(1)),
    days_remaining: Number.isFinite(daysRemaining) ? Number(daysRemaining.toFixed(1)) : null,
    depletion_date: depletionDate,
    next_resupply_date: nextResupplyDate || null,
    days_until_resupply:
      daysUntilResupply !== null ? Number(daysUntilResupply.toFixed(1)) : null,
    shortage_gap_days:
      shortageGapDays !== null ? Number(shortageGapDays.toFixed(1)) : null,
    level,
  };
}

module.exports = { analyzeConsumable, todayISO, addDaysISO, diffDaysISO };
