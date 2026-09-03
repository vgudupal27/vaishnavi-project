/**
 * @vitest-environment jsdom
 *
 * Boot smoke test: loads the real index.html, starts the app, and drives the
 * worksheet the way a user would. Catches wiring breaks that unit tests miss.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

// import.meta.url is an http URL under the jsdom environment, so resolve from the project root.
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));

/** Lets pending promise chains (storage reads/writes) settle. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function bootApp() {
  document.body.innerHTML = body;
  vi.resetModules();
  await import('../src/js/main.js');
  await flush();
}

async function click(selector) {
  document.querySelector(selector).click();
  await flush();
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  window.scrollTo = () => {};
});

describe('app boot', () => {
  it('renders every checkbox grid from config', async () => {
    await bootApp();

    expect(document.querySelectorAll('input[name="feelings"]').length).toBe(14);
    expect(document.querySelectorAll('input[name="support"]').length).toBe(8);
    expect(document.querySelector('#eventDate').value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('starts on step 1 and advances', async () => {
    await bootApp();

    expect(document.querySelector('.step.active').dataset.step).toBe('1');
    await click('[data-action="next"]');
    expect(document.querySelector('.step.active').dataset.step).toBe('2');
    expect(document.querySelector('#stepNumber').textContent).toBe('2');
  });

  it('switches pages and hides the others', async () => {
    await bootApp();

    await click('[data-page="dashboard"]');
    expect(document.querySelector('#dashboard').hidden).toBe(false);
    expect(document.querySelector('#worksheet').hidden).toBe(true);
    expect(document.querySelector('#totalEvents').textContent).toBe('0');
  });
});

describe('saving an event', () => {
  it('refuses to save without a Client ID', async () => {
    await bootApp();

    await click('[data-action="save-event"]');
    expect(JSON.parse(localStorage.getItem('asaEvents') || '[]')).toEqual([]);
    expect(document.querySelector('#saveMessage').textContent).toContain('Client ID');
  });

  it('stores the worksheet and clears it for the next client', async () => {
    await bootApp();

    document.querySelector('#clientId').value = 'TEST-001';
    document.querySelector('#whatHappened').value = 'Argument at group.';
    document.querySelector('input[name="why"][value="Children"]').checked = true;
    document.querySelector('#decision').value = 'Continue treatment';
    document.querySelector('#finalDisposition').value = 'Continued treatment';

    await click('[data-action="save-event"]');

    const [saved] = JSON.parse(localStorage.getItem('asaEvents'));
    expect(saved.clientId).toBe('TEST-001');
    expect(saved.why).toEqual(['Children']);
    expect(saved.decision).toBe('Continue treatment');

    expect(document.querySelector('#clientId').value).toBe('');
    expect(document.querySelector('input[name="why"][value="Children"]').checked).toBe(false);
    expect(localStorage.getItem('asaDraft')).toBeNull();
  });
});

describe('draft, history and dashboard', () => {
  it('saves and restores a draft', async () => {
    await bootApp();

    document.querySelector('#clientId').value = 'TEST-002';
    document.querySelector('#todayGoal').value = 'Get through lunch.';
    await click('[data-action="save-draft"]');

    await bootApp(); // simulate reopening the browser
    await click('[data-action="resume-draft"]');

    expect(document.querySelector('#clientId').value).toBe('TEST-002');
    expect(document.querySelector('#todayGoal').value).toBe('Get through lunch.');
  });

  it('shows a client timeline and escapes stored text', async () => {
    localStorage.setItem(
      'asaEvents',
      JSON.stringify([
        { id: '1', clientId: 'TEST-003', date: '2026-01-02', decision: '<img src=x>', why: ['Health'] },
      ]),
    );
    await bootApp();

    await click('[data-page="history"]');
    document.querySelector('#historyClient').value = 'TEST-003';
    await click('[data-action="load-history"]');

    const results = document.querySelector('#historyResults');
    expect(results.textContent).toContain('TEST-003 Timeline');
    expect(results.textContent).toContain('<img src=x>');
    expect(results.querySelector('img')).toBeNull();
  });

  it('computes dashboard KPIs from stored data', async () => {
    localStorage.setItem(
      'asaEvents',
      JSON.stringify([
        { id: '1', clientId: 'A', date: '2026-01-02', decision: 'Continue treatment', finalDisposition: 'ASA' },
        { id: '2', clientId: 'B', date: '2026-01-03', decision: 'I still want to leave', finalDisposition: '' },
      ]),
    );
    localStorage.setItem(
      'asaOutcomes',
      JSON.stringify([{ id: '1', clientId: 'A', period: '24 hours', status: 'Stayed in treatment' }]),
    );
    await bootApp();

    await click('[data-page="dashboard"]');

    expect(document.querySelector('#totalEvents').textContent).toBe('2');
    expect(document.querySelector('#stayRate').textContent).toBe('50%');
    expect(document.querySelector('#asaRate').textContent).toBe('50%');
    expect(document.querySelector('#twentyFourRate').textContent).toBe('100%');
    expect(document.querySelector('#eventTable').textContent).toContain('B');
  });

  it('saves a follow-up outcome', async () => {
    await bootApp();

    await click('[data-page="outcome"]');
    document.querySelector('#outcomeClient').value = 'TEST-004';
    document.querySelector('#outcomeNotes').value = 'Called family.';
    await click('[data-action="save-outcome"]');

    const [outcome] = JSON.parse(localStorage.getItem('asaOutcomes'));
    expect(outcome.clientId).toBe('TEST-004');
    expect(outcome.period).toBe('24 hours');
    expect(document.querySelector('#outcomeNotes').value).toBe('');
  });

  it('clears every stored key', async () => {
    localStorage.setItem('asaEvents', JSON.stringify([{ id: '1', clientId: 'A' }]));
    await bootApp();

    await click('[data-page="dashboard"]');
    await click('[data-action="clear-data"]');

    expect(localStorage.getItem('asaEvents')).toBeNull();
    expect(document.querySelector('#totalEvents').textContent).toBe('0');
  });
});
