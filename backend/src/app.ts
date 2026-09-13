import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
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
import { logger } from './lib/logger';

/**
 * Создаёт и настраивает Express-приложение.
 * Вынесено в отдельную функцию для интеграционных тестов (Supertest).
 */
export function createApp(): Express {
  const app = express();

  // --- Базовая безопасность и middleware ---
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(compression());
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // --- Общий rate limiter для API ---
  app.use('/api', apiLimiter);

  // --- Health check ---
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
  });

  // --- Документация OpenAPI (Swagger UI) ---
  const possiblePaths = [
    path.join(__dirname, '../docs/api/openapi.yaml'), // dev (src)
    path.join(__dirname, '../../docs/api/openapi.yaml'), // prod (dist) / root docs
    path.join(process.cwd(), 'docs/api/openapi.yaml'), // Docker (/app/docs/api)
    path.join(process.cwd(), '../docs/api/openapi.yaml'), // локальный запуск из backend/
  ];
  const yamlPath = possiblePaths.find((p) => {
    try {
      return require('fs').existsSync(p);
    } catch {
      return false;
    }
  });
  if (yamlPath) {
    const swaggerDocument = YAML.load(yamlPath);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
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

  app.use(
    (err: unknown, _req: express.Request, _res: express.Response, next: express.NextFunction) => {
      if (err instanceof SyntaxError) {
        logger.warn('Некорректный JSON в теле запроса');
        next();
        return;
      }
      next(err);
    },
  );

  return app;
}
