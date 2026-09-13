import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * asyncHandler — обёртка над асинхронными контроллерами.
 * Позволяет не дублировать try/catch и передаёт ошибки в централизованный ErrorHandler.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
