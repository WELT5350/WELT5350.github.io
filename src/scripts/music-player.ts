interface Song {
  id: number;
  title: string;
  artist: string;
}

const songs: Song[] = [
  { id: 493454214, title: '帝国少女', artist: 'Sawako碎花' },
  { id: 1951583615, title: 'Bet On Me', artist: 'Walk off the Earth' },
  { id: 1998168127, title: '圣诞快乐坂本龙一先生', artist: '路灰气球' },
  { id: 1978759140, title: 'Twilight', artist: 'Vanguard Sound' },
  { id: 2081798260, title: '超负荷记忆', artist: '特污兔' },
  { id: 424262994, title: '風は予告なく吹く', artist: 'ワルキューレ' },
  { id: 1416496031, title: '【星尘】月光掌', artist: '魔法汐の正义铃' },
  { id: 2661617561, title: '浅滩（2024ver）', artist: 'Lagrange_P / 海伊' },
  { id: 1929114538, title: '我多想说再见啊', artist: '柯立可' },
];

const modeIcons = [
  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>',
  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>',
  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"/>',
  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>',
];

const modeTitles = ['顺序播放', '列表循环', '单曲循环', '随机播放'];

function initializeMusicPlayer() {
function setStatus(message: string) {
  const status = document.getElementById('mp-status');
  if (status) status.textContent = message;
}

function fmt(t: number): string {
  if (!t || !isFinite(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

const audio = document.getElementById('mp-audio') as HTMLAudioElement;
if (!audio) return;
let idx = 7;
let playing = false;
let mode = 0;

function load(i: number) {
  idx = i;
  const s = songs[idx];
  audio.src = `https://music.163.com/song/media/outer/url?id=${s.id}.mp3`;
  document.getElementById('mp-title')!.textContent = s.title;
  document.getElementById('mp-artist')!.textContent = s.artist;
  const progress = document.getElementById('mp-progress') as HTMLInputElement | null;
  if (progress) progress.value = '0';
  const idxEl = document.getElementById('mp-index');
  if (idxEl) idxEl.textContent = (i + 1) + '/' + songs.length;
  const curEl = document.getElementById('mp-time-cur');
  if (curEl) curEl.textContent = '0:00';
  highlightCurrent();
}

function highlightCurrent() {
  document.querySelectorAll('.mp-item').forEach(el => {
    el.classList.remove('text-blue-500', 'dark:text-blue-400', 'border-l-2', 'border-l-blue-500', 'dark:border-l-blue-400', 'pl-2');
  });
  const current = document.querySelector(`.mp-item[data-i="${idx}"]`);
  if (current) {
    current.classList.add('text-blue-500', 'dark:text-blue-400', 'border-l-2', 'border-l-blue-500', 'dark:border-l-blue-400');
  }
}

function updatePlayIcon() {
  const icon = document.getElementById('mp-play-icon');
  if (!icon) return;
  icon.innerHTML = playing
    ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
    : '<path d="M8 5v14l11-7z"/>';
  const bars = document.getElementById('mp-bars');
  if (bars) bars.classList.toggle('playing', playing);
  const iconWrap = document.getElementById('mp-icon-wrap');
  if (iconWrap) iconWrap.classList.toggle('playing', playing);
  const playButton = document.getElementById('mp-play-btn');
  if (playButton) playButton.setAttribute('aria-label', playing ? '暂停' : '播放');
}

async function playCurrent() {
  try {
    await audio.play();
    playing = true;
    setStatus(`正在播放：${songs[idx].title}`);
  } catch {
    playing = false;
    setStatus('音频暂时无法播放，请稍后重试。');
  }
  updatePlayIcon();
}

function togglePlay() {
  if (audio.paused) {
    void playCurrent();
  } else {
    audio.pause();
    playing = false;
    setStatus('已暂停');
    updatePlayIcon();
  }
}

function nextSong() {
  let n: number;
  if (mode === 2) {
    n = idx;
  } else if (mode === 3) {
    n = Math.floor(Math.random() * songs.length);
    if (songs.length > 1) while (n === idx) n = Math.floor(Math.random() * songs.length);
  } else if (mode === 1) {
    n = (idx + 1) % songs.length;
  } else {
    n = idx + 1;
    if (n >= songs.length) {
      audio.currentTime = 0;
      audio.pause();
      playing = false;
      updatePlayIcon();
      return;
    }
  }
  load(n);
  void playCurrent();
}

function prevSong() {
  let n: number;
  if (mode === 3) {
    n = Math.floor(Math.random() * songs.length);
    if (songs.length > 1) while (n === idx) n = Math.floor(Math.random() * songs.length);
  } else {
    n = (idx - 1 + songs.length) % songs.length;
    if (mode === 0 && idx === 0) {
      audio.currentTime = 0;
      return;
    }
  }
  load(n);
  void playCurrent();
}

function toggleMode() {
  mode = (mode + 1) % 4;
  const modeIcon = document.getElementById('mp-mode-icon');
  if (modeIcon) modeIcon.innerHTML = modeIcons[mode];
  const modeBtn = document.getElementById('mp-mode');
  if (modeBtn) {
    modeBtn.title = modeTitles[mode];
    modeBtn.setAttribute('aria-label', modeTitles[mode]);
  }
}

function toggleList() {
  const list = document.getElementById('mp-list');
  const listIcon = document.getElementById('mp-list-icon');
  if (!list || !listIcon) return;
  const isOpen = !list.classList.contains('hidden');
  list.classList.toggle('hidden', isOpen);
  listIcon.outerHTML = isOpen
    ? '<svg id="mp-list-icon" aria-hidden="true" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>'
    : '<svg id="mp-list-icon" aria-hidden="true" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
  const listButton = document.getElementById('mp-list-toggle');
  if (listButton) listButton.setAttribute('aria-label', isOpen ? '打开歌单' : '关闭歌单');
}

function buildList() {
  const container = document.getElementById('mp-list-items');
  if (!container) return;
  songs.forEach((s, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/30 transition-colors text-xs mp-item';
    el.setAttribute('data-i', String(i));
    el.setAttribute('aria-label', `${s.title}，${s.artist}`);
    el.innerHTML = `<span class="mp-num text-gray-400 dark:text-gray-500 w-4 text-right flex-shrink-0 tabular-nums">${i + 1}</span><span class="mp-song truncate flex-1">${s.title}</span><span class="text-[10px] text-gray-400 dark:text-gray-500 truncate hidden sm:inline">${s.artist}</span>`;
    el.addEventListener('click', () => {
      load(i);
      void playCurrent();
    });
    container.appendChild(el);
  });
  highlightCurrent();
}

document.getElementById('mp-play-btn')?.addEventListener('click', togglePlay);
document.getElementById('mp-prev')?.addEventListener('click', prevSong);
document.getElementById('mp-next')?.addEventListener('click', nextSong);
document.getElementById('mp-mode')?.addEventListener('click', toggleMode);
document.getElementById('mp-list-toggle')?.addEventListener('click', toggleList);
audio.addEventListener('ended', nextSong);
audio.addEventListener('loadedmetadata', () => {
  const durEl = document.getElementById('mp-time-dur');
  if (durEl) durEl.textContent = fmt(audio.duration);
});
audio.addEventListener('error', () => {
  playing = false;
  updatePlayIcon();
  const artist = document.getElementById('mp-artist');
  if (artist) artist.textContent = '音频暂时无法加载，请稍后重试。';
  setStatus('音频暂时无法加载，请稍后重试。');
});
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    const progress = document.getElementById('mp-progress') as HTMLInputElement | null;
    if (progress) progress.value = String(pct);
    const curEl = document.getElementById('mp-time-cur');
    if (curEl) curEl.textContent = fmt(audio.currentTime);
  }
});

const progress = document.getElementById('mp-progress');
if (progress) {
  progress.addEventListener('input', () => {
    const value = Number((progress as HTMLInputElement).value);
    if (Number.isFinite(audio.duration)) {
      audio.currentTime = (value / 100) * audio.duration;
    }
  });
}

buildList();
load(idx);
}

document.addEventListener('astro:page-load', initializeMusicPlayer);
