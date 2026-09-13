/**
 * E2E: аутентификация и запись на мастер-класс.
 */
import { test, expect, Page } from '@playwright/test';

test.describe('Аутентификация', () => {
  /** Локатор кнопки отправки формы входа (не путать с кнопкой в шапке). */
  const submitLogin = (page: Page) =>
    page.getByTestId('login-form').getByRole('button', { name: 'Войти' });

  test('вход демо-пользователя', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('demo@gastronomiakomi.ru');
    await page.getByLabel('Пароль').fill('User12345');
    await submitLogin(page).click();

    // После входа — редирект на главную, в шапке имя пользователя и «Выйти»
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Демо пользователь' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
  });

  test('ошибка при неверных данных', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@test.ru');
    await page.getByLabel('Пароль').fill('WrongPassword');
    await submitLogin(page).click();

    await expect(page.getByRole('alert')).toBeVisible();
  });
});

test.describe('Запись на мастер-класс (авторизованный)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@gastronomiakomi.ru');
    await page.getByLabel('Пароль').fill('User12345');
    await page.getByTestId('login-form').getByRole('button', { name: 'Войти' }).click();
    await expect(page).toHaveURL('/');
  });

  test('открытие страницы мастер-класса и запись', async ({ page }) => {
    await page.goto('/masterclasses');

    // Кликаем «Подробнее» на первой карточке
    const firstCard = page.getByTestId('masterclass-card').first();
    await firstCard.getByRole('link', { name: 'Подробнее' }).click();
    await expect(page).toHaveURL(/\/masterclasses\//);

    // Кнопка записи доступна
    await expect(page.getByRole('button', { name: 'Записаться' })).toBeVisible({ timeout: 10_000 });
  });

  test('профиль показывает личный кабинет', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible();
  });
});

test.describe('Защита маршрутов', () => {
  test('неавторизованный доступ к /profile редиректит на /login', async ({ browser }) => {
    // Чистый контекст без токенов
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
    await context.close();
  });

  test('не-админ не может зайти в /admin', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/admin');
    // Middleware редиректит на главную
    await expect(page).toHaveURL('/');
    await context.close();
  });
});