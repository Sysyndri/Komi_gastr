import dotenv from 'dotenv';
import { testDatabaseUrl } from './testDatabase';

// Тестовое окружение: загружаем .env.test ДО импорта приложения/prisma.
dotenv.config({ path: '.env.test', override: true });
process.env.NODE_ENV = 'test';
// Prisma должна работать с тестовой базой, а не с базой из backend/.env
process.env.DATABASE_URL = testDatabaseUrl();

// Экспортируем типы Jest глобально для ts-jest
export {};