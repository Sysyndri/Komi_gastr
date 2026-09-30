import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Общий лимитер для всех API-запросов.
 * Значения по умолчанию — 100 запросов за 15 минут на IP; настраиваются
 * переменными RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX (см. backend/.env.example).
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Слишком много запросов, попробуйте позже' },
  },
});

/**
 * Жёсткий лимитер для эндпоинтов аутентификации (защита от брутфорса).
 * По умолчанию — 10 запросов за 15 минут на IP; настраивается переменными
 * RATE_LIMIT_AUTH_WINDOW_MS / RATE_LIMIT_AUTH_MAX.
 */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Слишком много попыток входа, попробуйте позже' },
  },
});

