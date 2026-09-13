import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

/**
 * Точка входа в backend-приложение.
 */
async function main() {
  const app = createApp();

  // Проверяем подключение к БД
  try {
    await prisma.$connect();
    logger.info('Подключение к базе данных установлено');
  } catch (err) {
    logger.error('Не удалось подключиться к базе данных', { error: (err as Error).message });
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    logger.info(`🚀 API «Гастрономия Коми» запущен: http://localhost:${env.PORT}/api`);
    logger.info(`📚 Swagger UI: http://localhost:${env.PORT}/api-docs`);
  });
}

main().catch((err) => {
  logger.error('Критическая ошибка запуска', { error: (err as Error).message });
  process.exit(1);
});

// Корректное завершение
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
