import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { existsSync } from 'fs';
import path from 'path';

import { env } from './config/env';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { dishesRouter } from './routes/dishes.routes';
import { placesRouter } from './routes/places.routes';
import { masterClassesRouter } from './routes/masterclasses.routes';
import { eventsRouter } from './routes/events.routes';
import { bookingsRouter } from './routes/bookings.routes';
import { searchRouter } from './routes/search.routes';
import { adminRouter } from './routes/admin.routes';
import { statsRouter } from './routes/stats.routes';

/**
 * Создаёт и настраивает Express-приложение.
 * Вынесено в отдельную функцию для интеграционных тестов (Supertest).
 */
export function createApp(): Express {
  const app = express();

  // За nginx (или другим reverse proxy) нужен trust proxy: иначе rate limiter
  // считает все запросы с одного адреса 127.0.0.1, а протокол в куках/redirect
  // определяется неверно. Включается только явно (TRUST_PROXY=true).
  if (env.trustProxy) {
    app.set('trust proxy', 1);
  }
  // Корректный Host в заголовках за прокси (иначе Express может вернуть 400
  // «Trust proxy misconfiguration» на нестандартных портах).
  app.disable('x-powered-by');

  // --- Базовая безопасность и middleware ---
  // CSP настроена вручную (без upgrade-insecure-requests): API отдаёт JSON,
  // а /api-docs (Swagger UI) отдаёт HTML с инлайн-скриптом инициализации и
  // стилями — дефолтная CSP helmet их заблокировала бы. Без
  // upgrade-insecure-requests страница /api-docs работает и по http://localhost.
  // HSTS имеет смысл только когда наружу отдаётся HTTPS (например, TLS на
  // балансировщике) — иначе браузеры получают бесполезный заголовок.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      // Ресурсы API (фото блюд) подключаются со страницы фронтенда на другом
      // origin — политика same-origin запретила бы такую встраиваемую загрузку.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: env.isSecure ? undefined : false,
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  // Ответы API (списки блюд, поиск) сжимаются — экономия трафика в 5-10 раз.
  app.use(compression());
  if (env.NODE_ENV !== 'test') {
    // В production — общий формат логов (IP, дата, статус, длительность),
    // в разработке — короткий «dev»-вывод.
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // --- Общий rate limiter для API ---
  app.use('/api', apiLimiter);

  // --- Health check ---
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
  });

  // --- Документация OpenAPI (Swagger UI) ---
  // В production Swagger UI выключен (SWAGGER_ENABLED=false): публичная схема
  // API упрощает подбор параметров для атак.
  if (env.swaggerEnabled) {
    const possiblePaths = [
      path.join(__dirname, '../docs/api/openapi.yaml'), // dev (src)
      path.join(__dirname, '../../docs/api/openapi.yaml'), // prod (dist) / root docs
      path.join(process.cwd(), 'docs/api/openapi.yaml'), // Docker (/app/docs/api)
      path.join(process.cwd(), '../docs/api/openapi.yaml'), // локальный запуск из backend/
    ];
    const yamlPath = possiblePaths.find((p) => {
      try {
        return existsSync(p);
      } catch {
        return false;
      }
    });
    if (yamlPath) {
      const swaggerDocument = YAML.load(yamlPath);
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    }
  }

  // --- REST API маршруты ---
  app.use('/api/auth', authRouter);
  app.use('/api/dishes', dishesRouter);
  app.use('/api/places', placesRouter);
  app.use('/api/masterclasses', masterClassesRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/stats', statsRouter);

  // --- Обработка ошибок ---
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
