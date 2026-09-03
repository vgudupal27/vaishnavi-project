/**
 * Build-time configuration.
 *
 * With all three values set, the app talks to Supabase and every device sees
 * the same data. With any of them missing it falls back to browser-local
 * storage, so `npm run dev` and the tests work with no accounts at all.
 *
 * The anon key is meant to be public — it identifies the project, it does not
 * grant access. Row-level security plus the shared staff login are the gate.
 */

const env = import.meta.env ?? {};

export const SUPABASE_URL = (env.VITE_SUPABASE_URL ?? '').trim();
export const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();

/** The single shared account staff sign in as. */
export const STAFF_EMAIL = (env.VITE_STAFF_EMAIL ?? '').trim();

export const REMOTE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && STAFF_EMAIL);
