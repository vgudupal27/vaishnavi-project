/**
 * Pure aggregation helpers for the QI dashboard.
 * No DOM here, so these are unit-testable on their own.
 */

import { RETENTION_DECISIONS } from './config.js';

/** Merges a checkbox array with its free-text "Other" value, dropping blanks. */
export function mergeWithOther(list, other) {
  return [...(Array.isArray(list) ? list : []), other]
    .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
    .filter(Boolean);
}

/** Counts every value produced by `pick` across the records. */
export function countBy(records, pick) {
  const counts = {};
  records.forEach((record) => {
    const values = pick(record) ?? [];
    (Array.isArray(values) ? values : [values]).filter(Boolean).forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
  });
  return counts;
}

/** Counts sorted high to low, as `[label, count]` pairs. */
export function sortedCounts(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function percent(part, whole) {
  if (!whole) return null;
  return Math.round((part / whole) * 100);
}

/**
 * Headline numbers.
 *
 * 24-hour retention is measured against the 24-hour follow-ups actually
 * recorded, not against every event — events without a follow-up are unknown,
 * not failures.
 */
export function computeKpis(events, outcomes) {
  const total = events.length;

  const stayed = events.filter((e) => RETENTION_DECISIONS.includes(e.decision)).length;
  const asa = events.filter((e) => e.finalDisposition === 'ASA').length;

  const dayOne = outcomes.filter((o) => o.period === '24 hours');
  const dayOneRetained = dayOne.filter((o) => o.status === 'Stayed in treatment').length;

  return {
    total,
    stayed,
    asa,
    stayRate: percent(stayed, total),
    asaRate: percent(asa, total),
    dayOneFollowUps: dayOne.length,
    dayOneRetained,
    dayOneRate: percent(dayOneRetained, dayOne.length),
  };
}

export const whyCounts = (events) => countBy(events, (e) => mergeWithOther(e.why, e.whyOther));

export const problemCounts = (events) =>
  countBy(events, (e) => mergeWithOther(e.problems, e.problemOther));

export const outcomeCounts = (outcomes) => countBy(outcomes, (o) => [o.status]);

/** Events per YYYY-MM, oldest month first. */
export function monthlyCounts(events) {
  const counts = {};
  events.forEach((event) => {
    const month = String(event.date ?? '').slice(0, 7);
    if (month.length !== 7) return;
    counts[month] = (counts[month] || 0) + 1;
  });

  return Object.fromEntries(Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])));
}
