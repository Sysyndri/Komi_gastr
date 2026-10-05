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

  test('клик по метке на карте открывает карточку заведения', async ({ page }) => {
    await page.goto('/');

    const markers = page.getByTestId('map-marker');
    // Без ключа NEXT_PUBLIC_YANDEX_MAPS_API_KEY карта не поднимается и вместо
    // неё показывается список заведений — кликать по меткам тогда нечего.
    const available = await markers
      .first()
      .waitFor({ state: 'attached', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!available, 'Яндекс.Карты недоступны (нет ключа или нет сети)');

    // Кликаем последнюю метку: семь заведений Сыктывкара лежат в пределах
    // ~3 км, поэтому на общем масштабе они перекрываются, и клик принимает
    // верхняя из них — последняя в DOM.
    await markers.last().click();
    const popup = page.getByTestId('map-popup');
    await expect(popup).toBeVisible();
    // В карточке есть название заведения и адрес
    await expect(popup).toContainText('📍');
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