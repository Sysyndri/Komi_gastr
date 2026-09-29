/**
 * E2E: аутентификация и запись на мастер-класс.
 *
 * Пароли и учётки в репозитории не хранятся: каждый прогон регистрирует
 * собственный временный аккаунт через API, поэтому тесты работают и локально,
 * и в CI без секретных переменных окружения.
 */
import { test, expect, Page, APIRequestContext } from "@playwright/test";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:4000/api";

/** Пароль удовлетворяет серверной схеме (буквы + цифры). */
const EPHEMERAL_PASSWORD = "E2e-Test-2026";
const EPHEMERAL_NAME = "E2E Тестовый";

/** Регистрирует временного пользователя и возвращает его email. */
async function registerEphemeralUser(
  request: APIRequestContext,
): Promise<string> {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e4)}@example.ru`;
  const res = await request.post(`${API_URL}/auth/register`, {
    data: { email, password: EPHEMERAL_PASSWORD, name: EPHEMERAL_NAME },
  });
  expect(res.ok(), `регистрация не удалась: HTTP ${res.status()}`).toBeTruthy();
  return email;
}

/** Локатор кнопки отправки формы входа (не путать с кнопкой «Войти» в шапке). */
const submitLogin = (page: Page) =>
  page.getByTestId("login-form").getByRole("button", { name: "Войти" });

/** Ввод учётных данных и отправка формы входа. */
async function loginVia(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await submitLogin(page).click();
}

test.describe("Аутентификация", () => {
  test("вход зарегистрированного пользователя", async ({ page, request }) => {
    const email = await registerEphemeralUser(request);
    await loginVia(page, email, EPHEMERAL_PASSWORD);

    // После входа — редирект на главную, в шапке имя пользователя и «Выйти»
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("link", { name: EPHEMERAL_NAME }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();
  });

  test("ошибка при неверных данных", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("wrong@test.ru");
    await page.getByLabel("Пароль").fill("WrongPassword");
    await submitLogin(page).click();

    await expect(page.getByRole("alert")).toBeVisible();
  });
});

test.describe("Запись на мастер-класс (авторизованный)", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasDemoAccount, "Не заданы E2E_DEMO_EMAIL / E2E_DEMO_PASSWORD");
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Пароль").fill(DEMO_PASSWORD);
    await page
      .getByTestId("login-form")
      .getByRole("button", { name: "Войти" })
      .click();
    await expect(page).toHaveURL("/");
  });

  test("открытие страницы мастер-класса и запись", async ({ page }) => {
    await page.goto("/masterclasses");

    // Кликаем «Подробнее» на первой карточке
    const firstCard = page.getByTestId("masterclass-card").first();
    await firstCard.getByRole("link", { name: "Подробнее" }).click();
    await expect(page).toHaveURL(/\/masterclasses\//);

    // Кнопка записи доступна
    await expect(page.getByRole("button", { name: "Записаться" })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("профиль показывает личный кабинет", async ({ page }) => {
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { name: "Личный кабинет" }),
    ).toBeVisible();
  });
});

test.describe("Защита маршрутов", () => {
  test("неавторизованный доступ к /profile редиректит на /login", async ({
    browser,
  }) => {
    // Чистый контекст без токенов
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
    await context.close();
  });

  test("не-админ не может зайти в /admin", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/admin");
    // Middleware редиректит на главную
    await expect(page).toHaveURL("/");
    await context.close();
  });
});
