/**
 * Supabase backend. Every signed-in device reads and writes the same rows.
 *
 * Worksheet answers are stored whole in a `payload` jsonb column, with the
 * fields the dashboard and history filter on lifted into real columns. Adding a
 * question to the worksheet therefore needs no database migration.
 */

import { getClient } from '../supabaseClient.js';

export const label = 'Shared (Supabase)';
export const isRemote = true;

const EVENTS_TABLE = 'asa_events';
const OUTCOMES_TABLE = 'asa_outcomes';

/** Postgres `ilike` treats these as wildcards, so escape them in user input. */
const escapeLike = (input) => String(input).replace(/([%_\\])/g, '\\$1');

function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'Supabase request failed.');
  return data ?? [];
}

/* ---------- Row mapping ---------- */

function rowToEvent(row) {
  return {
    ...(row.payload ?? {}),
    id: row.id,
    clientId: row.client_id,
    date: row.event_date ?? '',
    staff: row.staff ?? '',
    createdAt: row.created_at,
  };
}

function eventToRow(event) {
  const { id, clientId, date, staff, createdAt, ...payload } = event;
  return {
    client_id: clientId,
    event_date: date || null,
    staff: staff || null,
    payload,
  };
}

function rowToOutcome(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    status: row.status ?? '',
    period: row.period ?? '',
    notes: row.notes ?? '',
    date: row.outcome_date ?? '',
    recordedAt: row.created_at,
  };
}

function outcomeToRow(outcome) {
  return {
    client_id: outcome.clientId,
    status: outcome.status || null,
    period: outcome.period || null,
    notes: outcome.notes || null,
    outcome_date: outcome.date || null,
  };
}

/* ---------- Lifecycle ---------- */

export async function init() {
  getClient();
}

/* ---------- Events ---------- */

export async function getEvents() {
  const rows = unwrap(
    await getClient().from(EVENTS_TABLE).select('*').order('event_date', { ascending: true }),
  );
  return rows.map(rowToEvent);
}

export async function addEvent(event) {
  const rows = unwrap(
    await getClient().from(EVENTS_TABLE).insert(eventToRow(event)).select('*'),
  );
  return rows.length ? rowToEvent(rows[0]) : event;
}

export async function addEvents(newEvents) {
  if (!newEvents.length) return 0;
  const rows = unwrap(
    await getClient().from(EVENTS_TABLE).insert(newEvents.map(eventToRow)).select('id'),
  );
  return rows.length;
}

export async function getEventsForClient(clientId) {
  const rows = unwrap(
    await getClient()
      .from(EVENTS_TABLE)
      .select('*')
      .ilike('client_id', escapeLike(String(clientId).trim()))
      .order('event_date', { ascending: true }),
  );
  return rows.map(rowToEvent);
}

/* ---------- Outcomes ---------- */

export async function getOutcomes() {
  const rows = unwrap(
    await getClient().from(OUTCOMES_TABLE).select('*').order('outcome_date', { ascending: true }),
  );
  return rows.map(rowToOutcome);
}

export async function addOutcome(outcome) {
  const rows = unwrap(
    await getClient().from(OUTCOMES_TABLE).insert(outcomeToRow(outcome)).select('*'),
  );
  return rows.length ? rowToOutcome(rows[0]) : outcome;
}

export async function getOutcomesForClient(clientId) {
  const rows = unwrap(
    await getClient()
      .from(OUTCOMES_TABLE)
      .select('*')
      .ilike('client_id', escapeLike(String(clientId).trim()))
      .order('outcome_date', { ascending: true }),
  );
  return rows.map(rowToOutcome);
}

/* ---------- Bulk ---------- */

/**
 * Deletes every row in both tables — for everyone, not just this browser.
 * The caller is responsible for confirming that with the user first.
 */
export async function clearAll() {
  const client = getClient();
  const impossibleId = '00000000-0000-0000-0000-000000000000';

  unwrap(await client.from(EVENTS_TABLE).delete().neq('id', impossibleId).select('id'));
  unwrap(await client.from(OUTCOMES_TABLE).delete().neq('id', impossibleId).select('id'));
}
