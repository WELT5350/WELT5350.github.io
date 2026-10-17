import { expect, test, type Page } from '@playwright/test';

// 梦境层端到端测试：星标入口 → 梦境之门 → 线性房间 → 答案校验 → 存档持久化 → 门锁拦截。

async function resetDreamState(page: Page) {
  // 每个测试只清一次档（sessionStorage 标记）：整页刷新与站内导航不应抹掉玩家进度。
  await page.addInitScript(() => {
    if (sessionStorage.getItem('welt-e2e-dream-initialized') === 'true') return;
    sessionStorage.setItem('welt-e2e-dream-initialized', 'true');
    localStorage.removeItem('welt-dream-state');
    localStorage.setItem('theme', 'dark'); // 星标/梦境的故事发生在夜里
  });
}

async function expectNoConsoleFailures(page: Page) {
  const failures: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') failures.push(message.text());
  });
  page.on('pageerror', (error) => failures.push(error.message));
  return failures;
}

test.beforeEach(async ({ page }) => {
  await resetDreamState(page);
});

test('star opens the dream door at night and the door starts the journey', async ({ page }) => {
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/');
  // resetDreamState 已将主题设为暗色：星标在夜里可直接点击
  await expect(page.locator('[data-night-star]')).toHaveCSS('cursor', 'pointer');
  await page.locator('[data-night-star]').click();
  await expect(page).toHaveURL(/\/dream\/?$/);

  // 梦境之门：未开始的介绍态
  await expect(page.getByRole('heading', { name: '梦境之门' })).toBeVisible();
  await expect(page.locator('[data-door-panel="intro"]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-dream', '');

  await page.locator('[data-door-start]').click();
  await expect(page).toHaveURL(/\/dream\/room-1\/?$/);
  await expect(page.getByRole('heading', { name: '看门人' })).toBeVisible();

  // 存档已初始化：startedAt 已写入，第一间未解开
  const state = await page.evaluate(() => (window as unknown as { __weltDream?: { getState(): unknown } }).__weltDream?.getState()) as { startedAt?: string | null; solved: Record<string, boolean> } | undefined;
  expect(state?.startedAt).toBeTruthy();
  expect(state?.solved['room-1']).toBeUndefined();
  expect(failures).toEqual([]);
});

test('wrong answers are rejected and the world name opens room 1', async ({ page }) => {
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/dream/room-1/');

  await page.locator('[data-answer-input]').fill('world');
  await page.locator('[data-answer-submit]').click();
  await expect(page.locator('[data-answer-status]')).toHaveText(/再想想/);
  await expect(page.locator('[data-answer-success]')).toBeHidden();

  // 大小写、首尾空格不影响校验
  await page.locator('[data-answer-input]').fill('  WELT  ');
  await page.locator('[data-answer-submit]').click();
  await expect(page.locator('[data-answer-success]')).toBeVisible();
  await expect(page.locator('[data-answer-success]')).toContainText('答对了');

  const state = await page.evaluate(() => (window as unknown as { __weltDream?: { getState(): unknown } }).__weltDream?.getState()) as { solved: Record<string, boolean>; currentRoom: string | null } | undefined;
  expect(state?.solved['room-1']).toBe(true);
  expect(state?.currentRoom).toBe('room-2');
  expect(failures).toEqual([]);
});

test('hints reveal progressively', async ({ page }) => {
  await page.goto('/dream/room-1/');
  await expect(page.locator('[data-hint-text]').first()).toBeHidden();
  await page.locator('[data-hint-btn]').first().click();
  await expect(page.locator('[data-hint-text]').first()).toBeVisible();
});

test('solving room 1 unlocks room 2 and progress survives navigation', async ({ page }) => {
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/dream/room-1/');
  await page.locator('[data-answer-input]').fill('welt');
  await page.locator('[data-answer-submit]').click();
  await expect(page.locator('[data-answer-success]')).toBeVisible();

  await page.locator('[data-answer-next]').click();
  await expect(page).toHaveURL(/\/dream\/room-2\/?$/);
  await expect(page.getByRole('heading', { name: '夜空' })).toBeVisible();

  // 全量刷新（整页加载）：存档仍在，第二间无需重新解开前一间
  await page.reload();
  await expect(page.getByRole('heading', { name: '夜空' })).toBeVisible();
  await expect(page.locator('[data-answer-locked]')).toBeHidden();
  expect(failures).toEqual([]);
});

test('unlocked rooms stay locked until the previous room is solved', async ({ page }) => {
  await page.goto('/dream/room-2/');
  await expect(page.locator('[data-answer-locked]')).toBeVisible();
  await expect(page.locator('[data-answer-form]')).toBeHidden();
});

test('completing all rooms marks the dream done and reset restarts it', async ({ page }) => {
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/dream/room-1/');
  await page.locator('[data-answer-input]').fill('welt');
  await page.locator('[data-answer-submit]').click();
  await page.locator('[data-answer-next]').click();
  await page.locator('[data-answer-input]').fill('star');
  await page.locator('[data-answer-submit]').click();
  await expect(page.locator('[data-answer-success]')).toContainText('全部房间');

  await page.goto('/dream/');
  await expect(page.locator('[data-door-panel="done"]')).toBeVisible();
  await expect(page.locator('[data-door-solved]')).toHaveText('2');

  await page.locator('[data-door-reset]').click();
  await expect(page.locator('[data-door-panel="intro"]')).toBeVisible();
  await expect(page.locator('[data-door-solved]')).toHaveText('0');
  expect(failures).toEqual([]);
});

test('dream background stays stable across rooms and reality returns on exit', async ({ page }) => {
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/dream/');
  await expect(page.locator('html')).toHaveAttribute('data-dream', '');
  const dreamBackground = await page.locator('html').evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--site-background-image'));

  // 房间之间切换：梦境背景保持稳定
  await page.locator('[data-door-start]').click();
  await expect(page).toHaveURL(/\/dream\/room-1\/?$/);
  const room1Background = await page.locator('html').evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--site-background-image'));
  expect(room1Background).toBe(dreamBackground);

  // 返回现实：脱离梦境标记
  await page.locator('.dream-exit').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).not.toHaveAttribute('data-dream', '');
  expect(failures).toEqual([]);
});
