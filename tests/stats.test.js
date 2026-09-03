import { describe, expect, it } from 'vitest';

import {
  computeKpis,
  mergeWithOther,
  monthlyCounts,
  problemCounts,
  sortedCounts,
  whyCounts,
} from '../src/js/stats.js';

const events = [
  {
    date: '2026-01-05',
    decision: 'Continue treatment',
    finalDisposition: 'Continued treatment',
    why: ['Children', 'Health'],
    whyOther: '',
    problems: ['Cravings'],
    problemOther: 'Noise',
  },
  {
    date: '2026-01-20',
    decision: 'I still want to leave',
    finalDisposition: 'ASA',
    why: ['Children'],
    whyOther: 'Court date',
    problems: ['Cravings'],
    problemOther: '',
  },
  {
    date: '2026-02-02',
    decision: 'Stay for today and revisit tomorrow',
    finalDisposition: '',
    why: [],
    whyOther: '',
    problems: [],
    problemOther: '',
  },
];

const outcomes = [
  { period: '24 hours', status: 'Stayed in treatment' },
  { period: '24 hours', status: 'Left treatment' },
  { period: '72 hours', status: 'Stayed in treatment' },
];

describe('mergeWithOther', () => {
  it('appends the free-text value and drops blanks', () => {
    expect(mergeWithOther(['A'], ' B ')).toEqual(['A', 'B']);
    expect(mergeWithOther(['A'], '')).toEqual(['A']);
    expect(mergeWithOther(undefined, undefined)).toEqual([]);
  });
});

describe('computeKpis', () => {
  it('counts retention and ASA against total events', () => {
    const kpi = computeKpis(events, outcomes);
    expect(kpi.total).toBe(3);
    expect(kpi.stayed).toBe(2);
    expect(kpi.stayRate).toBe(67);
    expect(kpi.asa).toBe(1);
    expect(kpi.asaRate).toBe(33);
  });

  it('measures 24-hour retention against 24-hour follow-ups only', () => {
    const kpi = computeKpis(events, outcomes);
    expect(kpi.dayOneFollowUps).toBe(2);
    expect(kpi.dayOneRetained).toBe(1);
    expect(kpi.dayOneRate).toBe(50);
  });

  it('reports null rather than 0% when there is nothing to divide by', () => {
    const kpi = computeKpis([], []);
    expect(kpi.stayRate).toBeNull();
    expect(kpi.dayOneRate).toBeNull();
  });
});

describe('counts', () => {
  it('tallies why factors including the "Other" text', () => {
    expect(whyCounts(events)).toEqual({ Children: 2, Health: 1, 'Court date': 1 });
  });

  it('tallies problems', () => {
    expect(problemCounts(events)).toEqual({ Cravings: 2, Noise: 1 });
  });

  it('sorts counts high to low', () => {
    expect(sortedCounts(whyCounts(events))[0]).toEqual(['Children', 2]);
  });

  it('groups events by month in chronological order', () => {
    expect(Object.entries(monthlyCounts(events))).toEqual([
      ['2026-01', 2],
      ['2026-02', 1],
    ]);
  });

  it('ignores events with no usable date', () => {
    expect(monthlyCounts([{ date: '' }, { date: 'nope' }])).toEqual({});
  });
});
