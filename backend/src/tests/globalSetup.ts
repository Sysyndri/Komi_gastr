import { Client } from 'pg';
import { execSync } from 'child_process';
import { testDatabaseUrl } from './testDatabase';

/**
 * Глобальная настройка Jest (выполняется один раз перед всеми тестами).
 * 1. Определяет DSN тестовой базы (см. testDatabase.ts)
 * 2. Создаёт тестовую базу данных, если она ещё не существует
 * 3. Применяет схему через `prisma db push`
 */
export default async function globalSetup(): Promise<void> {
  const testUrl = testDatabaseUrl();
  const dbName = new URL(testUrl).pathname.slice(1);

  // Адрес до БД без имени базы (подключаемся к postgres)
  const adminUrl = testUrl.replace(`/${dbName}`, '/postgres');

  const client = new Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
      // Идентификаторы нельзя параметризовать в DDL
      await client.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await client.end();
  }

  // Применяем схему
  execSync('npx prisma db push --skip-generate', {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });
}