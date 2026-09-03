/**
 * Storage facade.
 *
 * Picks the shared Supabase backend when it is configured, otherwise browser-local
 * storage. Everything else in the app imports from here and never from a backend
 * directly, so switching backends is this one decision.
 *
 * The in-progress draft is deliberately always local: it is one person's
 * half-finished worksheet on one device, not a record worth sharing.
 */

import { STORAGE_KEYS } from './config.js';
import { REMOTE_ENABLED } from './env.js';
import * as localBackend from './storage/local.js';
import * as remoteBackend from './storage/remote.js';

const backend = REMOTE_ENABLED ? remoteBackend : localBackend;

export const isRemote = backend.isRemote;
export const backendLabel = backend.label;

export const initStorage = (...args) => backend.init(...args);
export const getEvents = (...args) => backend.getEvents(...args);
export const addEvent = (...args) => backend.addEvent(...args);
export const addEvents = (...args) => backend.addEvents(...args);
export const getEventsForClient = (...args) => backend.getEventsForClient(...args);
export const getOutcomes = (...args) => backend.getOutcomes(...args);
export const addOutcome = (...args) => backend.addOutcome(...args);
export const getOutcomesForClient = (...args) => backend.getOutcomesForClient(...args);
export const clearAll = (...args) => backend.clearAll(...args);

export { newId } from './id.js';

/* ---------- Draft (always this device) ---------- */

export function getDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.draft);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Could not read the saved draft.', error);
    return null;
  }
}

export function saveDraft(draft) {
  try {
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(draft));
    return true;
  } catch (error) {
    console.error('Could not save the draft.', error);
    return false;
  }
}

export function clearDraft() {
  localStorage.removeItem(STORAGE_KEYS.draft);
}
