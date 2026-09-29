import { createServer, Server } from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { logger } from './lib/logger';

/** Таймаут на обслуживание входящих запросов при остановке контейнера. */
const SHUTDOWN_TIMEOUT_MS = 15_000;

let server: Server | undefined;

/**
 * Точка входа backend-приложения.
 */
async function main() {
  const app = createApp();

  // Проверяем подключение к БД до начала обслуживания запросов
  try {
    await prisma.$connect();
    logger.info('Подключение к базе данных установлено');
  } catch (err) {
    logger.error('Не удалось подключиться к базе данных', { error: (err as Error).message });
    process.exit(1);
  }

  server = createServer(app);

  // Задержка перед принудительным разрывом keep-alive соединений
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  server.listen(env.PORT, env.HOST, () => {
    // Адрес из окружения: в контейнере/на сервере localhost в логах вводит в заблуждение
    const publicUrl = env.API_PUBLIC_URL || `http://${env.HOST}:${env.PORT}/api`;
    logger.info(`🚀 API «Гастрономия Коми» запущен на ${env.HOST}:${env.PORT}`);
    logger.info(`   Публичный адрес: ${publicUrl}`);
    if (env.swaggerEnabled) {
      logger.info(`   Swagger UI: ${publicUrl.replace(/\/api\/?$/, '')}/api-docs`);
    }
  });

  server.on('error', (err) => {
    logger.error('Ошибка HTTP-сервера', { error: err.message });
    process.exit(1);
  });
}

/**
 * Корректная остановка: перестаем принимать новые соединения, дожидаемся
 * активных, отключаемся от БД. Через SHUTDOWN_TIMEOUT_MS уходим принудительно,
 * чтобы зависший запрос не блокировал `docker compose down` / рестарт.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info(`Получен ${signal}, останавливаю сервер…`);

  const forceExit = setTimeout(() => {
    logger.error('Превышен таймаут остановки, выхожу принудительно');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
        // Node 18+: закрываем keep-alive соединения, иначе close() не дождётся
        (server as Server & { closeAllConnections?: () => void }).closeAllConnections?.();
      });
      logger.info('HTTP-сервер остановлен');
    }
    await prisma.$disconnect();
    logger.info('Соединение с базой данных закрыто');
    process.exit(0);
  } catch (err) {
    logger.error('Ошибка при остановке', { error: (err as Error).message });
    process.exit(1);
  }
}

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => void shutdown(signal));
}

// Неизвестные состояния логируем, но не роняем процесс без журнала
process.on('unhandledRejection', (reason) => {
  logger.error('Необработанное отклонение промиса', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Неперехваченное исключение, останавливаю процесс', {
    error: err.message,
    stack: err.stack,
  });
  void shutdown('uncaughtException');
});

main().catch((err) => {
  logger.error('Критическая ошибка запуска', { error: (err as Error).message });
  process.exit(1);
});
