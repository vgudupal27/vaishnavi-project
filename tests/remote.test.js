/**
 * Supabase backend, against a fake client.
 * Verifies the row <-> app-object mapping and the queries that go over the wire,
 * so a schema mismatch fails here rather than on the live site.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls = [];
let nextResult = { data: [], error: null };

/** Chainable stand-in for the Supabase query builder. */
function makeBuilder() {
  const builder = {
    then: (resolve) => resolve(nextResult),
  };
  ['select', 'order', 'ilike', 'insert', 'delete', 'neq'].forEach((method) => {
    builder[method] = (...args) => {
      calls.push([method, ...args]);
      return builder;
    };
  });
  return builder;
}

vi.mock('../src/js/supabaseClient.js', () => ({
  getClient: () => ({
    from: (table) => {
      calls.push(['from', table]);
      return makeBuilder();
    },
  }),
}));

const remote = await import('../src/js/storage/remote.js');

const call = (method) => calls.find(([name]) => name === method);

beforeEach(() => {
  calls.length = 0;
  nextResult = { data: [], error: null };
});

describe('reading', () => {
  it('maps a row back into the shape the worksheet uses', async () => {
    nextResult = {
      data: [
        {
          id: 'uuid-1',
          client_id: 'TEST-001',
          event_date: '2026-01-05',
          staff: 'A. Staff',
          created_at: '2026-01-05T10:00:00Z',
          payload: { why: ['Children'], decision: 'Continue treatment', whatHappened: 'Group conflict.' },
        },
      ],
      error: null,
    };

    const [event] = await remote.getEvents();

    expect(event).toMatchObject({
      id: 'uuid-1',
      clientId: 'TEST-001',
      date: '2026-01-05',
      staff: 'A. Staff',
      why: ['Children'],
      decision: 'Continue treatment',
      whatHappened: 'Group conflict.',
    });
    expect(call('from')).toEqual(['from', 'asa_events']);
  });

  it('survives a row with no payload', async () => {
    nextResult = { data: [{ id: 'uuid-2', client_id: 'B' }], error: null };
    const [event] = await remote.getEvents();
    expect(event).toMatchObject({ id: 'uuid-2', clientId: 'B', date: '', staff: '' });
  });

  it('escapes ilike wildcards in a Client ID', async () => {
    await remote.getEventsForClient('50%_off');
    expect(call('ilike')).toEqual(['ilike', 'client_id', '50\\%\\_off']);
  });

  it('maps outcome rows', async () => {
    nextResult = {
      data: [
        {
          id: 'o-1',
          client_id: 'TEST-001',
          status: 'Stayed in treatment',
          period: '24 hours',
          notes: 'Called family.',
          outcome_date: '2026-01-06',
        },
      ],
      error: null,
    };

    const [outcome] = await remote.getOutcomes();
    expect(outcome).toMatchObject({
      id: 'o-1',
      clientId: 'TEST-001',
      status: 'Stayed in treatment',
      period: '24 hours',
      date: '2026-01-06',
    });
  });
});

describe('writing', () => {
  it('splits the worksheet into columns plus a jsonb payload', async () => {
    nextResult = { data: [{ id: 'uuid-3', client_id: 'TEST-002', payload: {} }], error: null };

    await remote.addEvent({
      id: 'local-id',
      clientId: 'TEST-002',
      date: '2026-02-01',
      staff: 'B. Staff',
      createdAt: '2026-02-01T09:00:00Z',
      decision: 'Continue treatment',
      why: ['Health'],
    });

    const [, row] = call('insert');
    expect(row.client_id).toBe('TEST-002');
    expect(row.event_date).toBe('2026-02-01');
    expect(row.staff).toBe('B. Staff');
    expect(row.payload).toEqual({ decision: 'Continue treatment', why: ['Health'] });
    // Local-only fields must not become columns.
    expect(row).not.toHaveProperty('id');
    expect(row).not.toHaveProperty('createdAt');
  });

  it('sends blank dates as null, not empty strings', async () => {
    nextResult = { data: [{ id: 'x', client_id: 'C' }], error: null };
    await remote.addEvent({ clientId: 'C', date: '', staff: '' });

    const [, row] = call('insert');
    expect(row.event_date).toBeNull();
    expect(row.staff).toBeNull();
  });

  it('skips the round trip when there is nothing to import', async () => {
    expect(await remote.addEvents([])).toBe(0);
    expect(calls).toHaveLength(0);
  });
});

describe('errors', () => {
  it('throws with the message Supabase returned', async () => {
    nextResult = { data: null, error: { message: 'permission denied for table asa_events' } };
    await expect(remote.getEvents()).rejects.toThrow('permission denied for table asa_events');
  });
});
