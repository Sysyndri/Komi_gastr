/**
 * E2E: адаптив под телефон (375×812).
 *
 * Проверяет то, что нельзя увидеть в юнит-тестах: «бургер»-меню, отсутствие
 * горизонтальной прокрутки и заголовки с фоном морошки.
 */
import { test, expect } from '@playwright/test';

test.describe('Адаптив: телефон', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('меню открывается через «бургер» и ведёт на страницы', async ({ page }) => {
    await page.goto('/');

    const toggle = page.getByTestId('nav-toggle');
    await expect(toggle).toBeVisible();
    // До клика мобильного меню в DOM нет (нет дублей ссылок)
    await expect(page.getByLabel('Мобильная навигация')).toHaveCount(0);

    await toggle.click();
    const menu = page.getByLabel('Мобильная навигация');
    await expect(menu).toBeVisible();

    await menu.getByRole('link', { name: 'Блюда', exact: true }).click();
    await expect(page).toHaveURL(/\/dishes/);
    // После перехода меню закрылось
    await expect(page.getByLabel('Мобильная навигация')).toHaveCount(0);
  });

  test('нет горизонтальной прокрутки на публичных страницах', async ({ page }) => {
    for (const path of ['/', '/dishes', '/masterclasses', '/events', '/login']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `горизонтальная прокрутка на ${path}`).toBeLessThanOrEqual(1);
    }
  });

  test('заголовки страниц видны и не обрезаны', async ({ page }) => {
    await page.goto('/dishes');
    await expect(page.getByRole('heading', { name: 'Каталог блюд' })).toBeVisible();

    await page.goto('/masterclasses');
    await expect(page.getByRole('heading', { name: 'Мастер-классы' })).toBeVisible();

    await page.goto('/events');
    await expect(page.getByRole('heading', { name: 'Мероприятия и фестивали' })).toBeVisible();
  });
});

test.describe('Иконки и фон морошки', () => {
  test('отдаёт favicon (svg + ico) и фото морошки', async ({ request }) => {
    for (const url of [
      '/favicon.svg',
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/icon-512.png',
      '/images/berries/cloudberry.jpg',
    ]) {
      const res = await request.get(url);
      expect(res.status(), url).toBe(200);
    }
  });

  test('в HTML объявлены иконки', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="icon"][href="/favicon.svg"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });
});
