/** Per-client ASA timeline. */

import { $, escapeHtml, value } from './dom.js';
import { getEventsForClient, getOutcomesForClient } from './storage.js';
import { mergeWithOther } from './stats.js';

const list = (items) => (items.length ? escapeHtml(items.join(', ')) : 'None documented');

const field = (label, text) =>
  `<div><strong>${label}:</strong> ${escapeHtml(text || 'Not documented')}</div>`;

function eventCard(event) {
  return `
    <div class="timeline-item">
      ${field('Date', event.date)}
      ${field('Decision', event.decision)}
      ${field('Final Disposition', event.finalDisposition)}
      ${field('Intervention Result', event.interventionResult)}
      <div><strong>Why:</strong> ${list(mergeWithOther(event.why, event.whyOther))}</div>
      <div><strong>Problems:</strong> ${list(mergeWithOther(event.problems, event.problemOther))}</div>
    </div>`;
}

function outcomeCard(outcome) {
  return `
    <div class="timeline-item">
      <strong>${escapeHtml(outcome.date)}</strong><br>
      ${escapeHtml(outcome.period)}<br>
      <strong>${escapeHtml(outcome.status)}</strong>
      ${outcome.notes ? `<p>${escapeHtml(outcome.notes)}</p>` : ''}
    </div>`;
}

export async function loadHistory() {
  const container = $('historyResults');
  if (!container) return;

  const clientId = value('historyClient', { trim: true });

  if (!clientId) {
    container.innerHTML = '<div class="card">Enter a Client ID to view history.</div>';
    return;
  }

  let events = [];
  let outcomes = [];

  try {
    [events, outcomes] = await Promise.all([
      getEventsForClient(clientId),
      getOutcomesForClient(clientId),
    ]);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="card warning">Could not load history: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!events.length) {
    container.innerHTML = '<div class="card">No ASA history found for this Client ID.</div>';
    return;
  }

  const sorted = events.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));

  container.innerHTML = `
    <div class="card">
      <h2>${escapeHtml(clientId)} Timeline</h2>
      <p class="small">${sorted.length} ASA event(s), ${outcomes.length} follow-up outcome(s).</p>

      <div class="timeline">${sorted.map(eventCard).join('')}</div>

      ${
        outcomes.length
          ? `<h3>Follow-up Outcomes</h3>
             <div class="timeline">${outcomes.map(outcomeCard).join('')}</div>`
          : ''
      }
    </div>`;
}
