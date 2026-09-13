import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { logger } from '../lib/logger';

/**
 * Централизованная обработка ошибок — последний middleware в цепочке.
 * Преобразует известные ошибки в JSON-ответ, неизвестные — в 500.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Некорректные входные данные',
        details: err.flatten(),
      },
    });
    return;
  }

  // Prisma известные ошибки
  const prismaErr = err as { code?: string; meta?: unknown; message: string };
  if (prismaErr.code === 'P2002') {
    res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'Нарушение уникальности данных', details: prismaErr.meta },
    });
    return;
  }
  if (prismaErr.code === 'P2025') {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Запись не найдена' },
    });
    return;
  }

  logger.error('Необработанная ошибка', { message: (err as Error).message, stack: (err as Error).stack });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
  });
}

/**
 * 404 для неизвестных маршрутов.
 */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Маршрут не найден' },
  });
}
