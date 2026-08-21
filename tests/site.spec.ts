import { expect, test, type Page } from '@playwright/test';

const appearanceKey = 'welt-reading-appearance';
async function resetSiteState(page: Page) {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem('welt-e2e-initialized') === 'true') return;
    sessionStorage.setItem('welt-e2e-initialized', 'true');
    localStorage.removeItem(key);
    localStorage.removeItem('welt-dream-state');
    localStorage.setItem('theme', 'light');
    sessionStorage.setItem('welt-background-index', '0');
  }, appearanceKey);
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
  await resetSiteState(page);
});

test('default day and night glass baselines remain readable', async ({ page }) => {
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/');

  await expect(page.locator('.glass-main').first()).toHaveCSS('background-color', 'rgba(248, 250, 252, 0.3)');
  await expect(page.locator('.glass-sub').first()).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.2)');
  await expect(page.locator('.glass-nav').first()).toHaveCSS('background-color', 'rgba(255, 255, 255, 0.24)');
  await expect(page.locator('[data-night-star-divider]')).toHaveText('✦');
  const dayDividerBox = await page.locator('[data-night-star-divider]').boundingBox();
  const dayStarBox = await page.locator('[data-night-star]').boundingBox();
  expect(dayStarBox).toMatchObject({ width: 14.6875, height: 18 });
  await expect(page.locator('[data-night-star]')).toHaveCSS('color', 'rgb(63, 80, 102)');
  await expect(page.locator('.glass-main').first()).toHaveCSS('backdrop-filter', /blur\(16px\)/);
  await expect(page.locator('.glass-nav').first()).toHaveCSS('backdrop-filter', /blur\(14px\)/);
  await expect(page.locator('.reading-rail')).toHaveCount(0);

  await page.locator('[data-theme-toggle]').first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('.glass-main').first()).toHaveCSS('background-color', 'rgba(14, 25, 48, 0.36)');
  await expect(page.getByRole('link', { name: '浏览文章' })).toHaveCSS('background-color', 'rgb(37, 99, 235)');
  await expect(page.locator('.accent-brand').first()).toHaveCSS('background-image', 'linear-gradient(90deg, rgb(37, 99, 235), rgb(96, 165, 250))');
  await expect(page.locator('.accent-brand-surface')).toHaveCSS('background-image', 'linear-gradient(135deg, rgb(96, 165, 250), rgb(37, 99, 235))');
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(209, 213, 219)');
  await expect(page.locator('[data-night-star]')).toHaveCSS('color', 'rgb(196, 212, 232)');
  await expect(page.locator('[data-night-star]')).toHaveCSS('cursor', 'pointer');
  expect(await page.locator('[data-night-star-divider]').boundingBox()).toEqual(dayDividerBox);
  expect(await page.locator('[data-night-star]').boundingBox()).toEqual(dayStarBox);
  expect(failures).toEqual([]);
});

test('appearance controls apply to their intended targets and persist through client navigation', async ({ page }) => {
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/');
  await page.locator('[data-appearance-toggle]').first().click();

  await page.locator('input[data-appearance-input="hue"]').first().fill('280');
  await expect(page.locator('html')).toHaveAttribute('data-appearance-custom-hue', '');
  await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--appearance-accent').trim())).toBe('hsl(280 78% 48%)');
  await expect(page.getByRole('link', { name: '浏览文章' })).toHaveCSS('background-color', 'rgb(154, 27, 218)');
  await expect(page.locator('.accent-brand').first()).toHaveCSS('background-image', 'linear-gradient(90deg, rgb(154, 27, 218), rgb(192, 97, 239))');
  await expect(page.locator('.accent-brand-surface')).toHaveCSS('background-image', 'linear-gradient(135deg, rgb(192, 97, 239), rgb(154, 27, 218))');
  await expect(page.getByRole('link', { name: '浏览文章' })).toHaveCSS('box-shadow', /rgba\(154, 27, 218, 0\.2\)/);

  await page.locator('input[data-appearance-input="blur"]').first().fill('8');
  await expect(page.locator('.glass-background')).toHaveCSS('filter', /blur\(8px\)/);

  await page.locator('input[data-appearance-input="backgroundOpacity"]').first().fill('65');
  await expect(page.locator('.glass-background')).toHaveCSS('opacity', '0.65');

  await page.locator('input[data-appearance-input="cardOpacity"]').first().fill('80');
  await expect(page.locator('.glass-main').first()).toHaveCSS('background-color', 'rgba(251, 248, 252, 0.78)');

  await page.locator('a[href="/posts"]').first().click();
  await expect(page).toHaveURL(/\/posts\/?$/);
  await expect(page.locator('.glass-background')).toHaveCSS('opacity', '0.65');
  await expect(page.locator('html')).toHaveAttribute('data-appearance-custom-hue', '');

  await page.locator('a[href="/"]').first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.locator('[data-theme-toggle]').first().click();
  await expect(page.locator('.glass-background')).toHaveCSS('opacity', '0.65');
  await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--appearance-accent').trim())).toBe('hsl(280 86% 70%)');
  await expect(page.getByRole('link', { name: '浏览文章' })).toHaveCSS('background-color', 'rgb(164, 40, 226)');
  await expect(page.locator('.accent-brand').first()).toHaveCSS('background-image', 'linear-gradient(90deg, rgb(164, 40, 226), rgb(203, 125, 242))');
  await expect(page.locator('.accent-brand-surface')).toHaveCSS('background-image', 'linear-gradient(135deg, rgb(203, 125, 242), rgb(164, 40, 226))');
  await expect(page.getByRole('link', { name: '浏览文章' })).toHaveCSS('box-shadow', /rgba\(164, 40, 226, 0\.24\)/);
  await page.locator('[data-appearance-toggle]').first().click();
  await page.locator('[data-appearance-reset]').first().click();
  await expect(page.locator('html')).not.toHaveAttribute('data-appearance-custom-hue');
  await expect(page.locator('.glass-background')).toHaveCSS('opacity', '1');
  expect(failures).toEqual([]);
});

test('background survives client navigation and pages never overflow horizontally', async ({ page }) => {
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/');
  const background = await page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--site-background-image'));
  await page.locator('a[href="/links"]').first().click();
  await expect(page).toHaveURL(/\/links\/?$/);
  expect(await page.locator('html').evaluate((element) => element.scrollWidth)).toBe(await page.locator('html').evaluate((element) => element.clientWidth));
  expect(await page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--site-background-image'))).toBe(background);
  expect(failures).toEqual([]);
});

test('mobile navigation and appearance panel are operable at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/');
  await page.locator('#menu-toggle').click();
  await expect(page.locator('#mobile-menu')).toBeVisible();
  await page.locator('[data-appearance-toggle]').last().click();
  await expect(page.locator('#appearance-panel-mobile')).toBeVisible();
  expect(await page.locator('html').evaluate((element) => element.scrollWidth)).toBe(390);
  expect(failures).toEqual([]);
});

test('article keeps its independent reading surface and table of contents interaction', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/posts/72-hour-project/');
  await expect(page.locator('.article-glass')).toHaveCSS('background-color', 'rgba(248, 250, 252, 0.76)');
  await expect(page.locator('[data-reading-toggle]')).toBeVisible();
  await page.locator('[data-reading-toggle]').click();
  await expect(page.locator('#reading-panel')).toBeVisible();
  await expect(page.locator('#reading-panel [data-reading-link]').first()).toBeVisible();
  expect(failures).toEqual([]);
});

test('night star stays quiet by day and opens the dream door at night', async ({ page }) => {
  const failures = await expectNoConsoleFailures(page);
  await page.goto('/');
  await expect(page.locator('[data-night-star]')).toHaveCSS('cursor', 'default');

  // 白天点击星标：什么都不发生
  await page.locator('[data-night-star]').click();
  await expect(page).toHaveURL(/\/$/);

  await page.locator('[data-theme-toggle]').first().click();
  await expect(page.locator('[data-night-star]')).toHaveCSS('cursor', 'pointer');

  // 夜里点击星标：进入梦境之门
  await page.locator('[data-night-star]').click();
  await expect(page).toHaveURL(/\/dream\/?$/);
  expect(failures).toEqual([]);
});

test('navbar stays pinned and keeps its height while scrolling', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.nav-row')).toHaveCSS('height', '56px');
  // 底部渐变光边常驻
  const edgeOpacity = await page.evaluate(() =>
    getComputedStyle(document.querySelector('#top-nav')!, '::after').opacity);
  expect(edgeOpacity).toBe('1');

  await page.evaluate(() => window.scrollTo(0, 400));
  // 吸顶跟随：滚动后导航仍固定在视口顶部
  const box = await page.locator('#top-nav').boundingBox();
  expect(box?.y).toBe(0);
  // 高度恒定：不再收细
  await expect(page.locator('.nav-row')).toHaveCSS('height', '56px');
  // 光边在滚动后依旧常驻
  const edgeAfter = await page.evaluate(() =>
    getComputedStyle(document.querySelector('#top-nav')!, '::after').opacity);
  expect(edgeAfter).toBe('1');
});

test('removed puzzle route resolves to the site 404 page', async ({ page }) => {
  await page.goto('/after-hours/');
  await expect(page).toHaveTitle('页面不存在 | 我的博客');
});
