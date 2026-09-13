/**
 * E2E: главная страница и навигация.
 */
import { test, expect } from '@playwright/test';

test.describe('Главная страница', () => {
  test('отображает hero и секции', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /национальной кухни Республики Коми/i })).toBeVisible();
    // Секция блюд
    await expect(page.getByRole('heading', { name: 'Национальные блюда' })).toBeVisible();
    // Ссылки в основной навигации
    const nav = page.getByLabel('Основная навигация');
    await expect(nav.getByRole('link', { name: 'Блюда', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Мастер-классы', exact: true })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Мероприятия', exact: true })).toBeVisible();
  });

  test('переход на страницу блюд', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Основная навигация').getByRole('link', { name: 'Блюда', exact: true }).click();
    await expect(page).toHaveURL(/\/dishes/);
    await expect(page.getByRole('heading', { name: 'Каталог блюд' })).toBeVisible();
  });

  test('переход на страницу мастер-классов', async ({ page }) => {
    await page.goto('/');
    await page
      .getByLabel('Основная навигация')
      .getByRole('link', { name: 'Мастер-классы', exact: true })
      .click();
    await expect(page).toHaveURL(/\/masterclasses/);
    await expect(page.getByRole('heading', { name: 'Мастер-классы' })).toBeVisible();
  });
});