// 梦境世界状态系统。
// 纯静态方案：玩家档案存在浏览器 localStorage，每台设备独立，无后端无同步。
// 页面脚本通过 window.__weltDream 访问，与 __weltAppearance 的既有模式保持一致。

export interface DreamState {
  version: 1;
  /** 首次走进梦境的时刻（ISO） */
  startedAt: string | null;
  /** 下次继续旅程时进入的房间 slug；全部完成后为 null */
  currentRoom: string | null;
  /** 已解开的房间：slug -> true */
  solved: Record<string, true>;
  /** 全部房间完成时刻（ISO），null 表示未完成 */
  completedAt: string | null;
}

const STORAGE_KEY = 'welt-dream-state';

const EMPTY_STATE: DreamState = {
  version: 1,
  startedAt: null,
  currentRoom: null,
  solved: {},
  completedAt: null,
};

export type DreamApi = {
  getState: () => DreamState;
  /** 首次走进梦境：记录开始时刻，把当前房间设为第一个房间 */
  startDream: (firstRoom: string) => DreamState;
  /** 解开房间：记录进度，推进到下一间；最后一间则标记完成 */
  solveRoom: (slug: string, nextSlug: string | null) => DreamState;
  /** 忘记梦境：清空存档 */
  resetDream: () => DreamState;
  isSolved: (slug: string) => boolean;
};

function clampState(raw: unknown): DreamState {
  if (typeof raw !== 'object' || raw === null) return { ...EMPTY_STATE };
  const data = raw as Record<string, unknown>;
  return {
    version: 1,
    startedAt: typeof data.startedAt === 'string' ? data.startedAt : null,
    currentRoom: typeof data.currentRoom === 'string' ? data.currentRoom : null,
    solved:
      typeof data.solved === 'object' && data.solved !== null
        ? (data.solved as Record<string, true>)
        : {},
    completedAt: typeof data.completedAt === 'string' ? data.completedAt : null,
  };
}

function read(): DreamState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? clampState(JSON.parse(raw)) : { ...EMPTY_STATE };
  } catch {
    return { ...EMPTY_STATE };
  }
}

function write(state: DreamState): DreamState {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 存储不可用时梦境仍可玩，只是不记住进度。
  }
  return state;
}

function isSolved(slug: string): boolean {
  return read().solved[slug] === true;
}

function startDream(firstRoom: string): DreamState {
  return write({
    version: 1,
    startedAt: new Date().toISOString(),
    currentRoom: firstRoom,
    solved: {},
    completedAt: null,
  });
}

function solveRoom(slug: string, nextSlug: string | null): DreamState {
  const state = read();
  if (state.solved[slug]) return state;
  const solved = { ...state.solved, [slug]: true as const };
  const isLast = nextSlug === null;
  return write({
    ...state,
    solved,
    currentRoom: isLast ? null : nextSlug,
    completedAt: isLast ? new Date().toISOString() : null,
  });
}

function resetDream(): DreamState {
  return write({ ...EMPTY_STATE });
}

export function installWeltDream(): void {
  const api: DreamApi = { getState: read, startDream, solveRoom, resetDream, isSolved };
  window.__weltDream = api;
}

declare global {
  interface Window {
    __weltDream?: DreamApi;
  }
}

export {};
