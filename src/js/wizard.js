/** Six-step worksheet navigation and progress bar. */

import { $, $$ } from './dom.js';

let steps = [];
let current = 0;

export function initWizard() {
  steps = $$('.step');
  const total = $('stepTotal');
  if (total) total.textContent = String(steps.length);
  render();
}

function render() {
  steps.forEach((step, index) => step.classList.toggle('active', index === current));

  const percent = steps.length ? ((current + 1) / steps.length) * 100 : 0;
  const bar = $('progressBar');
  if (bar) bar.style.width = `${percent}%`;

  const track = bar?.parentElement;
  if (track) {
    track.setAttribute('aria-valuenow', String(current + 1));
    track.setAttribute('aria-valuemax', String(steps.length));
  }

  const label = $('stepNumber');
  if (label) label.textContent = String(current + 1);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function nextStep() {
  if (current < steps.length - 1) {
    current += 1;
    render();
  }
}

export function previousStep() {
  if (current > 0) {
    current -= 1;
    render();
  }
}

export function goToStep(index) {
  if (!Number.isInteger(index)) return;
  current = Math.min(Math.max(index, 0), Math.max(steps.length - 1, 0));
  render();
}

export const currentStep = () => current;
