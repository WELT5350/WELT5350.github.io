import { installWeltDream } from './welt-state';

installWeltDream();

function navigateTo(path: string) {
  // 锚点必须挂到文档上，click 事件才会冒泡到 document，ClientRouter 才能拦截为站内导航。
  const anchor = document.createElement('a');
  anchor.href = path;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function initialiseDreamDoor() {
  const root = document.querySelector<HTMLElement>('[data-dream-door]');
  const api = window.__weltDream;
  if (!root || !api) return;

  const firstRoom = root.dataset.firstRoom ?? '';
  const startButton = root.querySelector<HTMLButtonElement>('[data-door-start]');
  const resumeLink = root.querySelector<HTMLAnchorElement>('[data-door-resume]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-door-reset]');
  const solvedEl = root.querySelector<HTMLElement>('[data-door-solved]');
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-door-panel]'));

  const renderPanels = () => {
    const state = api.getState();
    const solvedCount = Object.keys(state.solved).length;
    if (solvedEl) solvedEl.textContent = String(solvedCount);

    let active: string;
    if (state.completedAt) {
      active = 'done';
    } else if (state.startedAt && state.currentRoom) {
      active = 'resume';
    } else {
      active = 'intro';
    }

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.doorPanel !== active;
    });

    if (resumeLink && state.currentRoom) {
      resumeLink.href = `/dream/${state.currentRoom}`;
    }
  };

  startButton?.addEventListener('click', () => {
    if (!firstRoom) return;
    api.startDream(firstRoom);
    window.__weltDreamBgm?.play();
    renderPanels();
    navigateTo(`/dream/${firstRoom}`);
  });

  resetButton?.addEventListener('click', () => {
    api.resetDream();
    renderPanels();
  });

  renderPanels();
}

document.addEventListener('astro:page-load', initialiseDreamDoor);
