import dotenv from 'dotenv';

// Тестовое окружение: загружаем .env.test ДО импорта приложения/prisma.
dotenv.config({ path: '.env.test', override: true });
process.env.NODE_ENV = 'test';

// Экспортируем типы Jest глобально для ts-jest
export {};