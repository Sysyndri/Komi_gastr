import dotenv from 'dotenv';

/**
 * DSN тестовой базы.
 *
 * Пароль и адрес БД в репозитории не хранятся. Приоритет источников:
 *   1. TEST_DATABASE_URL (переменная окружения или .env.test) — CI задаёт явно;
 *   2. DATABASE_URL текущего окружения (backend/.env при локальном запуске) —
 *      берётся тот же сервер и пароль, меняется только имя базы;
 *   3. POSTGRES_* / значения по умолчанию — свежий локальный PostgreSQL.
 *
 * Имя тестовой базы: TEST_DATABASE_NAME, по умолчанию gastro_komi_test.
 */
export function testDatabaseUrl(): string {
  const testEnv = dotenv.config({ path: '.env.test' }).parsed ?? {};
  const localEnv = dotenv.config({ path: '.env' }).parsed ?? {};

  const explicit = process.env.TEST_DATABASE_URL ?? testEnv.TEST_DATABASE_URL;
  if (explicit) return explicit;

  const dbName =
    process.env.TEST_DATABASE_NAME ?? testEnv.TEST_DATABASE_NAME ?? 'gastro_komi_test';

  const base = process.env.DATABASE_URL ?? localEnv.DATABASE_URL;
  if (base) {
    const url = new URL(base);
    url.pathname = `/${dbName}`;
    return url.toString();
  }

  const user = process.env.POSTGRES_USER ?? localEnv.POSTGRES_USER ?? 'komi';
  const password = process.env.POSTGRES_PASSWORD ?? localEnv.POSTGRES_PASSWORD ?? 'komi';
  const host = process.env.POSTGRES_HOST ?? 'localhost';
  const port = process.env.POSTGRES_PORT ?? localEnv.POSTGRES_PORT ?? '5432';
  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${dbName}?schema=public`;
}
