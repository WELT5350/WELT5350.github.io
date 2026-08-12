import { afterHoursChapter, type AfterHoursFragment } from '../data/after-hours';
import { navigate } from 'astro:transitions/client';

const storageKey = 'welt-after-hours';
const chapter = afterHoursChapter.id;

type AfterHoursState = {
  chapter: string;
  active: boolean;
  fragments: AfterHoursFragment[];
  completed: boolean;
};

declare global {
  interface Window {
    __weltAfterHoursCleanup?: () => void;
    __weltAfterHoursLifecycleBound?: boolean;
  }
}

function defaultState(): AfterHoursState {
  return { chapter, active: false, fragments: [], completed: false };
}

function readState(): AfterHoursState {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (!stored || stored.chapter !== chapter) return defaultState();
    const fragments: AfterHoursFragment[] = Array.isArray(stored.fragments)
      ? (stored.fragments as unknown[]).filter((fragment): fragment is AfterHoursFragment => typeof fragment === 'number' && Number.isInteger(fragment) && fragment >= 0 && fragment <= 2)
      : [];
    return { chapter, active: stored.active === true || fragments.length > 0 || stored.completed === true, fragments: [...new Set(fragments)].sort((left, right) => left - right), completed: stored.completed === true };
  } catch {
    return defaultState();
  }
}

function saveState(state: AfterHoursState) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function isDark() {
  return document.documentElement.classList.contains('dark');
}

function updateHome(state: AfterHoursState) {
  const home = document.querySelector<HTMLElement>('[data-after-hours-home]');
  if (!home) return;
  const active = isDark() && state.active;
  home.classList.toggle('after-hours-active', active);
  home.dataset.afterHoursActive = String(active);
  home.dataset.afterHoursFragments = String(state.fragments.length);
  document.documentElement.dataset.afterHoursActive = String(active);

  document.querySelectorAll<HTMLElement>('[data-after-hours-fragment]').forEach((element) => {
    const index = Number(element.dataset.afterHoursFragment) as AfterHoursFragment;
    const found = state.fragments.includes(index);
    element.hidden = !found;
  });

  const answerArea = document.querySelector<HTMLElement>('[data-after-hours-answer]');
  if (answerArea) answerArea.hidden = state.fragments.length < 3;
  const finishLink = document.querySelector<HTMLAnchorElement>('[data-after-hours-finish]');
  if (finishLink) finishLink.hidden = !state.completed;
  document.querySelectorAll<HTMLButtonElement>('[data-after-hours-exit]').forEach((button) => { button.hidden = !active; });
}

function announce(text: string) {
  const notice = document.querySelector<HTMLElement>('[data-after-hours-notice]');
  if (!notice) return;
  notice.textContent = text;
  notice.hidden = false;
  window.setTimeout(() => { notice.hidden = true; }, 4200);
}

function revealFragment(index: AfterHoursFragment, state: AfterHoursState) {
  if (!isDark() || !state.active) return state;
  const expected = state.fragments.length as AfterHoursFragment;
  if (index !== expected || state.fragments.includes(index)) return state;
  const next = { ...state, fragments: [...state.fragments, index] };
  saveState(next);
  updateHome(next);
  announce(afterHoursChapter.fragments[index]);
  return next;
}

function exitAfterHours() {
  localStorage.removeItem(storageKey);
  if (location.pathname === '/after-hours/' || location.pathname === '/after-hours') {
    location.assign('/');
    return;
  }
  updateHome(defaultState());
  announce('天快亮了。');
}

function initialiseAfterHours() {
  window.__weltAfterHoursCleanup?.();
  const controller = new AbortController();
  const { signal } = controller;
  let state = readState();
  updateHome(state);

  const entry = document.querySelector<HTMLButtonElement>('[data-after-hours-entry]');
  entry?.addEventListener('click', () => {
    if (!isDark()) return;
    if (state.completed) {
      void navigate('/after-hours/');
      return;
    }
    if (!state.active) {
      state = { ...state, active: true };
      saveState(state);
      updateHome(state);
      announce(afterHoursChapter.entryNotice);
    } else {
      state = revealFragment(1, state);
    }
  }, { signal });

  const avatar = document.querySelector<HTMLButtonElement>('[data-after-hours-avatar-trigger]');
  avatar?.addEventListener('pointerenter', () => { state = revealFragment(0, state); }, { signal });
  avatar?.addEventListener('click', () => { state = revealFragment(0, state); }, { signal });

  const music = document.querySelector<HTMLElement>('[data-after-hours-music]');
  music?.addEventListener('click', () => { state = revealFragment(2, state); }, { signal });
  music?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    state = revealFragment(2, state);
  }, { signal });

  const form = document.querySelector<HTMLFormElement>('[data-after-hours-answer]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector<HTMLInputElement>('input');
    const result = form.querySelector<HTMLElement>('[data-after-hours-answer-result]');
    const answer = input?.value.trim().toLocaleLowerCase('zh-CN') ?? '';
    if (answer === afterHoursChapter.answer.toLocaleLowerCase('zh-CN')) {
      state = { ...state, completed: true };
      saveState(state);
      updateHome(state);
      void navigate('/after-hours/');
      return;
    }
    if (result) result.textContent = afterHoursChapter.wrongAnswer;
  }, { signal });

  document.querySelectorAll<HTMLButtonElement>('[data-after-hours-exit]').forEach((button) => {
    button.addEventListener('click', exitAfterHours, { signal });
  });

  const hiddenPage = document.querySelector<HTMLElement>('[data-after-hours-ending]');
  if (hiddenPage) {
    document.documentElement.classList.add('dark');
    document.documentElement.dataset.afterHoursActive = 'true';
    if (!state.completed) location.replace('/#after-hours');
    document.querySelectorAll<HTMLButtonElement>('[data-after-hours-exit]').forEach((button) => { button.hidden = false; });
  }

  window.__weltAfterHoursCleanup = () => controller.abort();
}

if (!window.__weltAfterHoursLifecycleBound) {
  window.__weltAfterHoursLifecycleBound = true;
  document.addEventListener('astro:page-load', initialiseAfterHours);
}

initialiseAfterHours();
