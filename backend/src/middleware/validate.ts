import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * ValidationMiddleware — валидация входных данных через Zod-схему.
 * Валидированные и преобразованные данные заменяют оригинальные.
 * При ошибке ZodError пробрасывается в errorHandler (код VALIDATION_ERROR).
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(result.error);
      return;
    }
    req[target] = result.data;
    next();
  };
}
