/** Small DOM helpers shared by the feature modules. */

export const $ = (id) => document.getElementById(id);

export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** Value of an input/select/textarea by id, trimmed of trailing whitespace only when asked. */
export function value(id, { trim = false } = {}) {
  const el = $(id);
  if (!el) return '';
  return trim ? el.value.trim() : el.value;
}

export function setValue(id, next) {
  const el = $(id);
  if (el) el.value = next ?? '';
}

export function escapeHtml(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Renders a status box into a container; pass `null` to clear it. */
export function showMessage(containerId, text, tone = 'success') {
  const el = $(containerId);
  if (!el) return;
  if (!text) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `<div class="${tone}">${text}</div>`;
}

export function todayISO() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}
