/**
 * CSV import/export for test data.
 * `toCsv` / `parseCsv` / `rowsToEvents` are pure and unit-tested.
 */

import { CSV_COLUMNS, LIST_SEPARATOR } from './config.js';
import { mergeWithOther } from './stats.js';

export function csvEscape(input) {
  if (input === null || input === undefined) return '';
  const value = String(input);
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function cellFor(event, column) {
  if (column.type === 'list') {
    return mergeWithOther(event[column.key], event[column.otherKey]).join(LIST_SEPARATOR);
  }
  return event[column.key] ?? '';
}

/** Serializes events to a CSV string using CSV_COLUMNS. */
export function toCsv(events) {
  const header = CSV_COLUMNS.map((column) => csvEscape(column.header)).join(',');
  const rows = events.map((event) =>
    CSV_COLUMNS.map((column) => csvEscape(cellFor(event, column))).join(','),
  );
  return [header, ...rows].join('\n');
}

/**
 * Parses a full CSV document into rows of cells.
 * Handles quoted fields, escaped quotes, and newlines inside quotes.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  const source = String(text).replace(/^﻿/, '');

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((c) => c.trim() !== ''));
}

/** Turns parsed CSV rows (header included) into event objects. */
export function rowsToEvents(rows, makeId = () => `${Date.now()}-${Math.random()}`) {
  if (rows.length < 2) return [];

  return rows.slice(1).map((cells) => {
    const event = { id: makeId(), importedAt: new Date().toISOString() };

    CSV_COLUMNS.forEach((column, index) => {
      const raw = (cells[index] ?? '').trim();
      if (column.type === 'list') {
        event[column.key] = raw ? raw.split(LIST_SEPARATOR).map((s) => s.trim()).filter(Boolean) : [];
        if (column.otherKey) event[column.otherKey] = '';
      } else {
        event[column.key] = raw;
      }
    });

    return event;
  });
}

/** Triggers a browser download of `content`. */
export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
