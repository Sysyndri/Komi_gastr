/**
 * Unit-тесты для утилит: csv, ApiError, asyncHandler.
 */
import { toCsv } from '../../utils/csv';
import { ApiError } from '../../utils/ApiError';

describe('csv utils', () => {
  it('преобразует массив в CSV', () => {
    const rows = [{ a: 1, b: 'hello' }, { a: 2, b: 'world' }];
    const csv = toCsv(rows, [{ header: 'A', key: 'a' }, { header: 'B', key: 'b' }]);
    expect(csv).toBe('A,B\r\n1,hello\r\n2,world');
  });

  it('экранирует запятые и кавычки', () => {
    const rows = [{ a: 'text, with comma', b: 'quote "here"' }];
    const csv = toCsv(rows, [{ header: 'A', key: 'a' }, { header: 'B', key: 'b' }]);
    expect(csv).toContain('"text, with comma"');
    expect(csv).toContain('"quote ""here"""');
  });

  it('экранирует переносы строк', () => {
    const rows = [{ a: 'line1\nline2' }];
    const csv = toCsv(rows, [{ header: 'A', key: 'a' }]);
    expect(csv).toContain('"line1\nline2"');
  });

  it('обрабатывает null и undefined', () => {
    const rows = [{ a: null, b: undefined }];
    const csv = toCsv(rows, [{ header: 'A', key: 'a' }, { header: 'B', key: 'b' }]);
    expect(csv).toBe('A,B\r\n,');
  });
});

describe('ApiError', () => {
  it('создаёт ошибку с правильным статусом и кодом', () => {
    const err = ApiError.badRequest('test');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('test');
  });

  it('создаёт unauthorized', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
  });

  it('создаёт forbidden', () => {
    const err = ApiError.forbidden();
    expect(err.statusCode).toBe(403);
  });

  it('создаёт notFound', () => {
    const err = ApiError.notFound();
    expect(err.statusCode).toBe(404);
  });

  it('создаёт conflict', () => {
    const err = ApiError.conflict('dup');
    expect(err.statusCode).toBe(409);
  });

  it('создаёт tooManyRequests', () => {
    const err = ApiError.tooManyRequests();
    expect(err.statusCode).toBe(429);
  });

  it('создаёт internal', () => {
    const err = ApiError.internal();
    expect(err.statusCode).toBe(500);
  });

  it('создаёт с деталями', () => {
    const err = ApiError.badRequest('test', { field: 'email' });
    expect(err.details).toEqual({ field: 'email' });
  });
});
