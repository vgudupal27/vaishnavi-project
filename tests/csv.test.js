import { describe, expect, it } from 'vitest';

import { csvEscape, parseCsv, rowsToEvents, toCsv } from '../src/js/csv.js';

const sampleEvent = {
  clientId: 'TEST-001',
  date: '2026-01-15',
  staff: 'A. Staff',
  feelings: ['Anxious', 'Restless'],
  feelingOther: 'Jittery',
  why: ['Children'],
  whyOther: '',
  problems: ['Cravings'],
  problemOther: '',
  goals: ['Hope'],
  goalOther: '',
  decision: 'Continue treatment',
  interventionResult: 'Stayed 24 hours',
  finalDisposition: 'Continued treatment',
  finalReflection: 'Wants to stay, "one more day".',
};

describe('csvEscape', () => {
  it('leaves plain values alone', () => {
    expect(csvEscape('TEST-001')).toBe('TEST-001');
  });

  it('quotes and doubles embedded quotes', () => {
    expect(csvEscape('say "hi", now')).toBe('"say ""hi"", now"');
  });

  it('renders null and undefined as empty', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });
});

describe('toCsv', () => {
  it('writes a header plus one row per event', () => {
    const lines = toCsv([sampleEvent]).split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^Client ID,Date,Staff,Feelings/);
  });

  it('merges the "Other" free text into its list column', () => {
    expect(toCsv([sampleEvent])).toContain('Anxious; Restless; Jittery');
  });
});

describe('parseCsv', () => {
  it('handles quoted commas, escaped quotes and CRLF', () => {
    const rows = parseCsv('a,b\r\n"x,1","he said ""no"""\r\n');
    expect(rows).toEqual([
      ['a', 'b'],
      ['x,1', 'he said "no"'],
    ]);
  });

  it('keeps newlines inside quoted cells', () => {
    const rows = parseCsv('a,b\n"line1\nline2",second');
    expect(rows[1][0]).toBe('line1\nline2');
  });

  it('drops blank lines', () => {
    expect(parseCsv('a,b\n\n1,2\n')).toHaveLength(2);
  });
});

describe('round trip', () => {
  it('restores scalar fields and list fields', () => {
    const [restored] = rowsToEvents(parseCsv(toCsv([sampleEvent])), () => 'fixed-id');

    expect(restored.clientId).toBe('TEST-001');
    expect(restored.decision).toBe('Continue treatment');
    expect(restored.finalReflection).toBe('Wants to stay, "one more day".');
    expect(restored.why).toEqual(['Children']);
    expect(restored.feelings).toEqual(['Anxious', 'Restless', 'Jittery']);
    expect(restored.id).toBe('fixed-id');
  });

  it('returns nothing for a header-only file', () => {
    expect(rowsToEvents(parseCsv(toCsv([])))).toEqual([]);
  });
});
