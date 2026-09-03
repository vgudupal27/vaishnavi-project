/** Follow-up outcome capture. */

import { $, escapeHtml, setValue, showMessage, todayISO, value } from './dom.js';
import { addOutcome, newId } from './storage.js';

export async function saveOutcome() {
  const clientId = value('outcomeClient', { trim: true });

  if (!clientId) {
    showMessage('outcomeMessage', 'Enter a Client ID before saving an outcome.', 'warning');
    $('outcomeClient')?.focus();
    return null;
  }

  const outcome = {
    id: newId(),
    clientId,
    status: value('outcomeStatus'),
    period: value('outcomePeriod'),
    notes: value('outcomeNotes', { trim: true }),
    date: todayISO(),
    recordedAt: new Date().toISOString(),
  };

  try {
    await addOutcome(outcome);
  } catch (error) {
    console.error(error);
    showMessage('outcomeMessage', `Outcome not saved: ${escapeHtml(error.message)}`, 'warning');
    return null;
  }

  setValue('outcomeNotes', '');

  showMessage(
    'outcomeMessage',
    `Outcome saved for <strong>${escapeHtml(clientId)}</strong> (${escapeHtml(outcome.period)}).`,
  );

  return outcome;
}
