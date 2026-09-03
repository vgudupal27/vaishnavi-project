/** Hash-based page switching, so pages are linkable and the back button works. */

import { $, $$ } from './dom.js';

const PAGES = ['worksheet', 'history', 'dashboard', 'outcome'];
const DEFAULT_PAGE = 'worksheet';

const listeners = new Set();

/** Registers a callback fired with the page id every time a page becomes visible. */
export function onPageShow(callback) {
  listeners.add(callback);
}

function render(page) {
  $$('.page').forEach((el) => {
    el.hidden = el.id !== page;
  });

  $$('.nav-link').forEach((button) => {
    if (button.dataset.page === page) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  listeners.forEach((callback) => callback(page));
}

export function showPage(page) {
  const next = PAGES.includes(page) ? page : DEFAULT_PAGE;
  if (window.location.hash.slice(1) !== next) {
    window.location.hash = next;
    return; // hashchange re-enters here
  }
  render(next);
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    render(PAGES.includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : DEFAULT_PAGE);
  });

  const initial = window.location.hash.slice(1);
  render(PAGES.includes(initial) ? initial : DEFAULT_PAGE);
}
