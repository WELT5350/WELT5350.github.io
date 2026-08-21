// 答案校验：归一化输入 → SHA-256 → 与内容集合中的 answerHash 比对。
// 归一化规则与 scripts/hash-answer.mjs 保持一致。
import { installWeltDream } from './welt-state';

installWeltDream();

export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ');
}

async function sha256Hex(text: string): Promise<string | null> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null; // 非安全上下文
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

const WRONG_MESSAGES = [
  '不是这个答案，再想想。',
  '门纹丝不动。再试试？',
  '风把答案吹散了……再想想看。',
];

let cleanupAnswerGate: (() => void) | undefined;

function initialiseAnswerGate() {
  cleanupAnswerGate?.();

  const root = document.querySelector<HTMLElement>('[data-answer-gate]');
  const api = window.__weltDream;
  if (!root || !api) return;

  const form = root.querySelector<HTMLFormElement>('[data-answer-form]');
  const input = root.querySelector<HTMLInputElement>('[data-answer-input]');
  const submit = root.querySelector<HTMLButtonElement>('[data-answer-submit]');
  const status = root.querySelector<HTMLElement>('[data-answer-status]');
  const success = root.querySelector<HTMLElement>('[data-answer-success]');
  const locked = root.querySelector<HTMLElement>('[data-answer-locked]');
  const hints = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-hint-btn]'));

  if (!form || !input || !submit || !status || !success || !locked) return;

  const roomSlug = root.dataset.roomSlug ?? '';
  const answerHash = root.dataset.answerHash ?? '';
  const prevSlug = root.dataset.prevSlug || '';
  const nextSlug = root.dataset.nextSlug || null; // 空串视为 null（最后一间没有下一间）

  let wrongCount = 0;
  let hintRevealed = new Set<number>();

  const setStatus = (message: string, kind: 'error' | 'info') => {
    status.textContent = message;
    status.dataset.kind = kind;
  };

  const showSolvedState = () => {
    if (form) form.hidden = true;
    if (locked) locked.hidden = true;
    hints.forEach((btn) => { btn.disabled = true; });
    success.hidden = false;
  };

  const showLockedState = () => {
    if (form) form.hidden = true;
    hints.forEach((btn) => { btn.disabled = true; });
    if (locked) locked.hidden = false;
  };

  // 门锁检查：前一间未解开 → 显示锁住的状态
  if (prevSlug && !api.isSolved(prevSlug)) {
    showLockedState();
    setStatus('', 'info');
    return;
  }

  // 已解开：直接显示完成态
  if (api.isSolved(roomSlug)) {
    showSolvedState();
    setStatus('', 'info');
    return;
  }

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const raw = input.value;
    if (!raw.trim()) return;

    const hash = await sha256Hex(normalizeAnswer(raw));
    if (hash === null) {
      setStatus('当前环境无法进行答案校验，请通过 https 或 localhost 访问。', 'error');
      return;
    }

    if (hash === answerHash) {
      api.solveRoom(roomSlug, nextSlug);
      showSolvedState();
      setStatus('答对了，门开了。', 'info');
    } else {
      wrongCount += 1;
      input.value = '';
      input.focus();
      input.classList.remove('answer-shake');
      // 触发重排以重启动画
      void input.offsetWidth;
      input.classList.add('answer-shake');
      setStatus(WRONG_MESSAGES[(wrongCount - 1) % WRONG_MESSAGES.length], 'error');
    }
  };

  const revealHint = (index: number) => {
    if (hintRevealed.has(index)) return;
    hintRevealed.add(index);
    const btn = hints.find((candidate) => Number(candidate.dataset.hintIndex) === index);
    const text = root.querySelector<HTMLElement>(`[data-hint-text][data-hint-index="${index}"]`);
    if (btn) btn.textContent = `提示 ${index + 1} ✓`;
    if (text) text.hidden = false;
  };

  form.addEventListener('submit', handleSubmit);
  hints.forEach((btn) => {
    btn.addEventListener('click', () => revealHint(Number(btn.dataset.hintIndex)));
  });

  cleanupAnswerGate = () => {
    form.removeEventListener('submit', handleSubmit);
  };
}

document.addEventListener('astro:page-load', initialiseAnswerGate);
