/**
 * Browser-local backend. Data never leaves the device.
 * Used for development, for the test suite, and whenever Supabase is not configured.
 *
 * Every function is async so it matches the remote backend's signature exactly.
 */

import { STORAGE_KEYS, SCHEMA_VERSION } from '../config.js';

export const label = 'This browser only';
export const isRemote = false;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (error) {
    console.error(`Could not read "${key}" from local storage.`, error);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Could not write "${key}" to local storage.`, error);
    return false;
  }
}

const matchesClient = (record, clientId) =>
  String(record.clientId ?? '').trim().toLowerCase() === String(clientId).trim().toLowerCase();

/** Records the schema version so a future migration can detect old data. */
export async function init() {
  const stored = Number(localStorage.getItem(STORAGE_KEYS.schemaVersion));
  if (stored !== SCHEMA_VERSION) {
    localStorage.setItem(STORAGE_KEYS.schemaVersion, String(SCHEMA_VERSION));
  }
}

/* ---------- Events ---------- */

export async function getEvents() {
  const events = readJSON(STORAGE_KEYS.events, []);
  return Array.isArray(events) ? events : [];
}

export async function addEvent(event) {
  const events = await getEvents();
  events.push(event);
  writeJSON(STORAGE_KEYS.events, events);
  return event;
}

export async function addEvents(newEvents) {
  const events = (await getEvents()).concat(newEvents);
  writeJSON(STORAGE_KEYS.events, events);
  return newEvents.length;
}

export async function getEventsForClient(clientId) {
  return (await getEvents()).filter((event) => matchesClient(event, clientId));
}

/* ---------- Outcomes ---------- */

export async function getOutcomes() {
  const outcomes = readJSON(STORAGE_KEYS.outcomes, []);
  return Array.isArray(outcomes) ? outcomes : [];
}

export async function addOutcome(outcome) {
  const outcomes = await getOutcomes();
  outcomes.push(outcome);
  writeJSON(STORAGE_KEYS.outcomes, outcomes);
  return outcome;
}

export async function getOutcomesForClient(clientId) {
  return (await getOutcomes()).filter((outcome) => matchesClient(outcome, clientId));
}

/* ---------- Bulk ---------- */

export async function clearAll() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  await init();
}
