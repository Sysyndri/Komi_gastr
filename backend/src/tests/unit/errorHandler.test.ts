/**
 * Unit-тесты для errorHandler (различные типы ошибок).
 * Middleware вызывается напрямую с mock-объектами — без HTTP-сервера.
 */
import { errorHandler } from '../../middleware/errorHandler';
import { ApiError } from '../../utils/ApiError';
import { ZodError } from 'zod';
import { Request, Response } from 'express';

function callErrorHandler(err: unknown) {
  const json = jest.fn();
  // status() должен возвращать объект с json() для цепочки res.status(...).json(...)
  const status = jest.fn(() => ({ json }));
  const res = { status, json } as unknown as Response;
  errorHandler(err, {} as Request, res, jest.fn());
  return { status, json };
}

describe('errorHandler', () => {
  it('возвращает ApiError с кодом и статусом', () => {
    const { status, json } = callErrorHandler(ApiError.notFound('Нет такого'));
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Нет такого' },
    });
  });

  it('включает details при их наличии', () => {
    const { json } = callErrorHandler(ApiError.badRequest('bad', { field: 'email' }));
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'bad', details: { field: 'email' } },
    });
  });

  it('возвращает 500 для неизвестных ошибок', () => {
    const { status, json } = callErrorHandler(new Error('что-то сломалось'));
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' },
    });
  });

  it('возвращает 400 для ZodError', () => {
    const { status, json } = callErrorHandler(new ZodError([]));
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      }),
    );
  });

  it('возвращает 409 для Prisma P2002', () => {
    const { status, json } = callErrorHandler({
      code: 'P2002',
      meta: { target: ['email'] },
      message: 'unique',
    });
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'CONFLICT' }),
      }),
    );
  });

  it('возвращает 404 для Prisma P2025', () => {
    const { status, json } = callErrorHandler({ code: 'P2025', message: 'record not found' });
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'NOT_FOUND' }),
      }),
    );
  });
});
