/** Worksheet form: renders the checkbox grids, reads and writes the whole form. */

import {
  CHECKBOX_OPTIONS,
  CHECKBOX_FIELDS,
  TEXT_FIELDS,
  KEEP_AFTER_SAVE,
} from './config.js';
import { $, $$, escapeHtml, setValue, todayISO, currentTime } from './dom.js';

/** Builds every `[data-options]` grid from CHECKBOX_OPTIONS. */
export function renderCheckboxGrids() {
  $$('[data-options]').forEach((grid) => {
    const name = grid.dataset.options;
    const options = CHECKBOX_OPTIONS[name] || [];

    grid.innerHTML = options
      .map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        return `<label><input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(value)}">${escapeHtml(label)}</label>`;
      })
      .join('');
  });
}

function checkedValues(name) {
  return $$(`input[name="${name}"]:checked`).map((el) => el.value);
}

function setCheckboxes(name, values = []) {
  const selected = new Set(values);
  $$(`input[name="${name}"]`).forEach((box) => {
    box.checked = selected.has(box.value);
  });
}

/** Reads the whole worksheet into a plain object using the config schema. */
export function collectFormData() {
  const data = {};
  TEXT_FIELDS.forEach(({ el, key }) => {
    data[key] = $(el)?.value ?? '';
  });
  CHECKBOX_FIELDS.forEach(({ name, key }) => {
    data[key] = checkedValues(name);
  });
  return data;
}

/** Writes a saved object (event or draft payload) back into the form. */
export function populateForm(data = {}) {
  TEXT_FIELDS.forEach(({ el, key }) => setValue(el, data[key]));
  CHECKBOX_FIELDS.forEach(({ name, key }) => setCheckboxes(name, data[key]));
}

/** Clears the worksheet, keeping the fields listed in KEEP_AFTER_SAVE. */
export function resetForm() {
  TEXT_FIELDS.forEach(({ el }) => {
    if (!KEEP_AFTER_SAVE.has(el)) setValue(el, '');
  });
  CHECKBOX_FIELDS.forEach(({ name }) => setCheckboxes(name, []));
  setValue('timeCompleted', currentTime());
}

/** True when the user has typed anything worth autosaving. */
export function isFormDirty() {
  const data = collectFormData();
  return Object.entries(data).some(([key, val]) => {
    if (key === 'date' || key === 'timeCompleted') return false;
    return Array.isArray(val) ? val.length > 0 : String(val).trim() !== '';
  });
}

/** Fills the date and time defaults on first load. */
export function applyDefaults() {
  setValue('eventDate', todayISO());
  setValue('timeCompleted', currentTime());
}
