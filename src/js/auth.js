/**
 * Shared-password sign-in.
 *
 * Every staff member signs in as one shared Supabase account, so records carry
 * no per-user attribution — the worksheet's "Staff Assisting" field is the only
 * attribution, and it is self-reported. Move to per-user accounts before this
 * holds anything that needs an audit trail.
 *
 * With Supabase unconfigured there is nothing to sign in to: the app runs on
 * browser-local storage and `isSignedIn()` is always true.
 */

import { REMOTE_ENABLED, STAFF_EMAIL } from './env.js';
import { getClient } from './supabaseClient.js';

export const authRequired = REMOTE_ENABLED;

export async function isSignedIn() {
  if (!authRequired) return true;

  const { data, error } = await getClient().auth.getSession();
  if (error) {
    console.error('Could not read the session.', error);
    return false;
  }
  return Boolean(data.session);
}

export async function signIn(password) {
  if (!authRequired) return { ok: true };

  if (!password) return { ok: false, message: 'Enter the staff password.' };

  const { error } = await getClient().auth.signInWithPassword({
    email: STAFF_EMAIL,
    password,
  });

  if (!error) return { ok: true };

  const message =
    error.status === 400
      ? 'That password was not accepted. Check with your supervisor.'
      : `Could not sign in: ${error.message}`;

  return { ok: false, message };
}

export async function signOut() {
  if (!authRequired) return;
  await getClient().auth.signOut();
}

/** Fires whenever the session appears or disappears (including token expiry). */
export function onAuthChange(callback) {
  if (!authRequired) return;
  getClient().auth.onAuthStateChange((_event, session) => callback(Boolean(session)));
}
