// 梦境之音：梦境层 BGM。曲目 ID 在 DreamBgm.astro 顶部维护，换曲只改一处。
// 通过 transition:persist 让 audio 元素跨房间导航保持播放（不重新加载、不中断）。

function getAudio(): HTMLAudioElement | null {
  return document.querySelector<HTMLAudioElement>('[data-dream-audio]');
}

function getRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-dream-bgm]');
}

function syncButton(playing: boolean) {
  const root = getRoot();
  const toggle = document.querySelector<HTMLButtonElement>('[data-dream-bgm-toggle]');
  if (root) root.dataset.state = playing ? 'playing' : 'paused';
  if (toggle) {
    toggle.setAttribute('aria-label', playing ? '暂停梦境之音' : '播放梦境之音');
  }
}

function tryPlay(): void {
  const audio = getAudio();
  if (!audio) return;
  audio
    .play()
    .then(() => syncButton(true))
    .catch(() => syncButton(false));
}

export const dreamBgm = {
  play: tryPlay,
  pause() {
    getAudio()?.pause();
  },
  toggle() {
    const audio = getAudio();
    if (!audio) return;
    if (audio.paused) {
      tryPlay();
    } else {
      audio.pause();
    }
  },
};

// 立即暴露全局 API：梦境之门页的「走进门」按钮需要调它，且不依赖 page-load 时序。
window.__weltDreamBgm = dreamBgm;

function initialiseDreamBgm() {
  const root = getRoot();
  if (!root || root.dataset.bound === 'true') return; // 持久化元素已被上个页面绑定
  const toggle = document.querySelector<HTMLButtonElement>('[data-dream-bgm-toggle]');
  const audio = getAudio();
  if (!toggle || !audio) return;
  root.dataset.bound = 'true';

  toggle.addEventListener('click', () => {
    if (audio.paused) {
      tryPlay();
    } else {
      audio.pause();
    }
  });
  audio.addEventListener('play', () => syncButton(true));
  audio.addEventListener('pause', () => syncButton(false));
  audio.addEventListener('error', () => {
    syncButton(false);
    toggle.title = '梦境之音暂时无法播放';
  });
}

document.addEventListener('astro:page-load', initialiseDreamBgm);

declare global {
  interface Window {
    __weltDreamBgm?: { play: () => void; pause: () => void; toggle: () => void };
  }
}

export {};
