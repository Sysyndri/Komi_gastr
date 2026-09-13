import rateLimit from 'express-rate-limit';

/**
 * Общий лимитер для всех API-запросов.
 * 100 запросов за 15 минут на IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Слишком много запросов, попробуйте позже' },
  },
});

/**
 * Жёсткий лимитер для эндпоинтов аутентификации (защита от брутфорса).
 * 10 запросов за 15 минут на IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Слишком много попыток входа, попробуйте позже' },
  },
});
