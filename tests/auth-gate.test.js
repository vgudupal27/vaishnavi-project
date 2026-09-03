/**
 * @vitest-environment jsdom
 *
 * Boots the app in "Supabase configured" mode with a fake client and checks
 * that the sign-in gate actually blocks the app until a password is accepted.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));

const flush = () => new Promise((r) => setTimeout(r, 0));

let session = null;
let signInResult = { error: null };
const signInCalls = [];

vi.mock('../src/js/env.js', () => ({
  SUPABASE_URL: 'https://demo.supabase.co',
  SUPABASE_ANON_KEY: 'demo-key',
  STAFF_EMAIL: 'unit-staff@example.org',
  REMOTE_ENABLED: true,
}));

vi.mock('../src/js/supabaseClient.js', () => {
  const builder = {
    then: (r) => r({ data: [], error: null }),
    select: () => builder,
    order: () => builder,
    ilike: () => builder,
    insert: () => builder,
    delete: () => builder,
    neq: () => builder,
  };

  return {
    getClient: () => ({
      from: () => builder,
      auth: {
        getSession: async () => ({ data: { session }, error: null }),
        signInWithPassword: async (credentials) => {
          signInCalls.push(credentials);
          if (!signInResult.error) session = { user: { id: 'shared' } };
          return signInResult;
        },
        signOut: async () => {
          session = null;
          return { error: null };
        },
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
    }),
  };
});

async function bootApp() {
  document.body.innerHTML = body;
  vi.resetModules();
  await import('../src/js/main.js');
  await flush();
}

beforeEach(() => {
  localStorage.clear();
  session = null;
  signInResult = { error: null };
  signInCalls.length = 0;
  window.location.hash = '';
  window.scrollTo = () => {};
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('sign-in gate', () => {
  it('blocks the app when there is no session', async () => {
    await bootApp();

    expect(document.querySelector('#authGate').hidden).toBe(false);
    expect(document.querySelector('#signOutButton').hidden).toBe(true);
    expect(document.querySelector('#storageMode').textContent).toBe('Shared (Supabase)');
  });

  it('lets the app through once the password is accepted', async () => {
    await bootApp();

    document.querySelector('#authPassword').value = 'shared-password';
    document.querySelector('#authForm').dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();

    expect(signInCalls[0]).toEqual({
      email: 'unit-staff@example.org',
      password: 'shared-password',
    });
    expect(document.querySelector('#authGate').hidden).toBe(true);
    expect(document.querySelector('#signOutButton').hidden).toBe(false);
    expect(document.querySelector('#authPassword').value).toBe('');
  });

  it('keeps the gate up and explains a rejected password', async () => {
    signInResult = { error: { status: 400, message: 'Invalid login credentials' } };
    await bootApp();

    document.querySelector('#authPassword').value = 'wrong';
    document.querySelector('#authForm').dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();

    expect(document.querySelector('#authGate').hidden).toBe(false);
    expect(document.querySelector('#authMessage').textContent).toContain('not accepted');
  });

  it('skips the gate when a session already exists', async () => {
    session = { user: { id: 'shared' } };
    await bootApp();

    expect(document.querySelector('#authGate').hidden).toBe(true);
    expect(document.querySelector('#signOutButton').hidden).toBe(false);
  });

  it('puts the gate back on sign out', async () => {
    session = { user: { id: 'shared' } };
    await bootApp();

    document.querySelector('[data-action="sign-out"]').click();
    await flush();

    expect(document.querySelector('#authGate').hidden).toBe(false);
  });
});
