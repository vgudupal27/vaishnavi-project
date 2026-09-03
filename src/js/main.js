/** App entry point: wires the DOM to the feature modules. */

import { AUTOSAVE_MS } from './config.js';
import { $, escapeHtml, showMessage, todayISO, value } from './dom.js';
import {
  applyDefaults,
  collectFormData,
  isFormDirty,
  populateForm,
  renderCheckboxGrids,
  resetForm,
} from './form.js';
import { currentStep, goToStep, initWizard, nextStep, previousStep } from './wizard.js';
import { initRouter, onPageShow, showPage } from './router.js';
import { updateDashboard } from './dashboard.js';
import { loadHistory } from './history.js';
import { saveOutcome } from './outcomes.js';
import {
  addEvent,
  addEvents,
  backendLabel,
  clearAll,
  clearDraft,
  getDraft,
  getEvents,
  initStorage,
  isRemote,
  newId,
  saveDraft,
} from './storage.js';
import { authRequired, isSignedIn, onAuthChange, signIn, signOut } from './auth.js';
import { downloadFile, parseCsv, readFileAsText, rowsToEvents, toCsv } from './csv.js';

/* ---------- Draft ---------- */

function writeDraft() {
  return saveDraft({
    savedAt: new Date().toISOString(),
    step: currentStep(),
    data: collectFormData(),
  });
}

function handleSaveDraft() {
  const ok = writeDraft();
  window.alert(
    ok
      ? 'Draft saved on this computer. Drafts are never shared between devices.'
      : 'Draft could not be saved (storage full or blocked).',
  );
}

function handleResumeDraft() {
  const draft = getDraft();
  if (!draft) {
    window.alert('No saved draft was found on this computer.');
    return;
  }

  showPage('worksheet');
  populateForm(draft.data || {});
  goToStep(draft.step ?? 0);
  window.alert('Draft restored.');
}

/* ---------- Events ---------- */

async function handleSaveEvent() {
  const clientId = value('clientId', { trim: true });

  if (!clientId) {
    showMessage('saveMessage', 'Enter a Client ID before saving.', 'warning');
    showPage('worksheet');
    goToStep(0);
    $('clientId')?.focus();
    return;
  }

  const data = collectFormData();
  const event = {
    id: newId(),
    ...data,
    clientId,
    date: data.date || todayISO(),
    createdAt: new Date().toISOString(),
  };

  showMessage('saveMessage', 'Saving&hellip;', 'info');

  let saved;
  try {
    saved = await addEvent(event);
  } catch (error) {
    console.error(error);
    showMessage(
      'saveMessage',
      `<strong>Not saved.</strong> ${escapeHtml(error.message)}<br>Your answers are still on screen — try again.`,
      'warning',
    );
    return;
  }

  clearDraft();
  resetForm();

  showMessage(
    'saveMessage',
    `<strong>ASA event saved.</strong><br>Client: ${escapeHtml(clientId)} &middot; Event ID: ${escapeHtml(saved.id)}`,
  );
}

/* ---------- CSV ---------- */

async function handleExport() {
  let events = [];
  try {
    events = await getEvents();
  } catch (error) {
    console.error(error);
    window.alert(`Could not load data to export: ${error.message}`);
    return;
  }

  if (!events.length) {
    window.alert('There is no test data to export.');
    return;
  }

  downloadFile(`ASA_TEST_DATA_${todayISO()}.csv`, toCsv(events));
}

async function handleImport(fileInput) {
  const file = fileInput.files?.[0];
  if (!file) return;

  try {
    const rows = parseCsv(await readFileAsText(file));
    const imported = rowsToEvents(rows, newId);

    if (!imported.length) {
      window.alert('CSV contains no data rows.');
      return;
    }

    const count = await addEvents(imported);
    await updateDashboard();
    window.alert(`${count} test record(s) imported.`);
  } catch (error) {
    console.error(error);
    window.alert(`Import failed: ${error.message}`);
  } finally {
    fileInput.value = '';
  }
}

/* ---------- Danger zone ---------- */

async function handleClearData() {
  const scope = isRemote
    ? 'Delete ALL shared data for EVERY user of this site (events and outcomes)?'
    : 'Delete ALL test data (events, outcomes and the saved draft) from this browser?';

  if (!window.confirm(`${scope} This cannot be undone.`)) return;
  if (isRemote && !window.confirm('Second confirmation: this wipes the shared database for everyone.')) {
    return;
  }

  try {
    await clearAll();
    clearDraft();
    await updateDashboard();
    window.alert('All test data has been deleted.');
  } catch (error) {
    console.error(error);
    window.alert(`Could not clear data: ${error.message}`);
  }
}

/* ---------- Sign-in gate ---------- */

function showApp(signedIn) {
  const gate = $('authGate');
  if (gate) gate.hidden = signedIn;

  const signOutButton = $('signOutButton');
  if (signOutButton) signOutButton.hidden = !authRequired || !signedIn;

  if (signedIn) $('clientId')?.focus();
  else $('authPassword')?.focus();
}

function bindAuth() {
  const form = $('authForm');

  form?.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();
    form.classList.add('is-busy');
    showMessage('authMessage', 'Signing in&hellip;', 'info');

    const result = await signIn($('authPassword').value);

    form.classList.remove('is-busy');

    if (result.ok) {
      $('authPassword').value = '';
      showMessage('authMessage', null);
      showApp(true);
      return;
    }

    showMessage('authMessage', escapeHtml(result.message), 'auth-error');
    $('authPassword').select();
  });

  onAuthChange((signedIn) => showApp(signedIn));
}

async function handleSignOut() {
  if (isFormDirty() && !window.confirm('Sign out? The worksheet on screen will be saved as a draft on this device.')) {
    return;
  }
  if (isFormDirty()) writeDraft();

  await signOut();
  showApp(false);
}

/* ---------- Wiring ---------- */

const ACTIONS = {
  next: nextStep,
  back: previousStep,
  'save-draft': handleSaveDraft,
  'resume-draft': handleResumeDraft,
  'save-event': handleSaveEvent,
  'save-outcome': saveOutcome,
  'load-history': loadHistory,
  'export-csv': handleExport,
  'import-csv': () => $('csvFile')?.click(),
  'clear-data': handleClearData,
  'sign-out': handleSignOut,
};

function bindEvents() {
  document.addEventListener('click', (clickEvent) => {
    const target = clickEvent.target.closest('[data-action], [data-page]');
    if (!target) return;

    if (target.dataset.page) {
      showPage(target.dataset.page);
      return;
    }

    ACTIONS[target.dataset.action]?.();
  });

  $('csvFile')?.addEventListener('change', (changeEvent) => handleImport(changeEvent.target));

  $('historyClient')?.addEventListener('keydown', (keyEvent) => {
    if (keyEvent.key === 'Enter') loadHistory();
  });

  onPageShow((page) => {
    if (page === 'dashboard') updateDashboard();
  });

  window.setInterval(() => {
    if (!$('worksheet').hidden && isFormDirty()) writeDraft();
  }, AUTOSAVE_MS);

  window.addEventListener('beforeunload', (unloadEvent) => {
    if (!isFormDirty()) return;
    writeDraft();
    unloadEvent.preventDefault();
    unloadEvent.returnValue = '';
  });
}

async function init() {
  const modeLabel = $('storageMode');
  if (modeLabel) modeLabel.textContent = backendLabel;

  renderCheckboxGrids();
  applyDefaults();
  initWizard();
  initRouter();
  bindEvents();
  bindAuth();

  await initStorage();
  showApp(await isSignedIn());
}

init().catch((error) => {
  console.error('The app failed to start.', error);
  window.alert(`The app failed to start: ${error.message}`);
});
