/** QI dashboard rendering. */

import { $, escapeHtml } from './dom.js';
import { getEvents, getOutcomes } from './storage.js';
import {
  computeKpis,
  monthlyCounts,
  outcomeCounts,
  problemCounts,
  sortedCounts,
  whyCounts,
} from './stats.js';

const RECENT_EVENT_LIMIT = 25;

/** Renders horizontal bars from `[label, count]` pairs, in the order given. */
function renderBars(elementId, pairs) {
  const el = $(elementId);
  if (!el) return;

  if (!pairs.length) {
    el.innerHTML = '<p class="small">No data yet.</p>';
    return;
  }

  const max = Math.max(...pairs.map(([, count]) => count), 1);

  el.innerHTML = pairs
    .map(([label, count]) => {
      const width = (count / max) * 100;
      return `
        <div class="bar">
          <div class="bar-label">${escapeHtml(label)} (${count})</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${width}%">${count}</div>
          </div>
        </div>`;
    })
    .join('');
}

function renderKpis(events, outcomes) {
  const kpi = computeKpis(events, outcomes);
  const asPercent = (n) => (n === null ? '—' : `${n}%`);

  $('totalEvents').textContent = String(kpi.total);
  $('stayRate').textContent = asPercent(kpi.stayRate);
  $('asaRate').textContent = asPercent(kpi.asaRate);
  $('twentyFourRate').textContent = asPercent(kpi.dayOneRate);

  $('twentyFourNote').textContent = kpi.dayOneFollowUps
    ? `${kpi.dayOneRetained} of ${kpi.dayOneFollowUps} 24-hour follow-ups`
    : 'No 24-hour follow-ups recorded';
}

function renderEventTable(events) {
  const table = $('eventTable');
  if (!table) return;

  if (!events.length) {
    table.innerHTML = '<tr><td colspan="4">No test events recorded.</td></tr>';
    return;
  }

  table.innerHTML = events
    .slice()
    .reverse()
    .slice(0, RECENT_EVENT_LIMIT)
    .map(
      (event) => `
        <tr>
          <td>${escapeHtml(event.clientId)}</td>
          <td>${escapeHtml(event.date)}</td>
          <td>${escapeHtml(event.decision || '—')}</td>
          <td>${escapeHtml(event.finalDisposition || '—')}</td>
        </tr>`,
    )
    .join('');
}

export async function updateDashboard() {
  let events = [];
  let outcomes = [];

  try {
    [events, outcomes] = await Promise.all([getEvents(), getOutcomes()]);
  } catch (error) {
    console.error(error);
    const table = $('eventTable');
    if (table) {
      table.innerHTML = `<tr><td colspan="4">Could not load data: ${escapeHtml(error.message)}</td></tr>`;
    }
    return;
  }

  renderKpis(events, outcomes);
  renderBars('whyChart', sortedCounts(whyCounts(events)));
  renderBars('problemChart', sortedCounts(problemCounts(events)));
  renderBars('monthlyChart', Object.entries(monthlyCounts(events)));
  renderBars('outcomeChart', sortedCounts(outcomeCounts(outcomes)));
  renderEventTable(events);
}
