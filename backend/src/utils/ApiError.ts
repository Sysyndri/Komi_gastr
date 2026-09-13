/**
 * ApiError — кастомная ошибка приложения с HTTP-статусом и кодом.
 * Используется в сервисном слое и обрабатывается централизованно в ErrorHandler.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Требуется авторизация'): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Недостаточно прав'): ApiError {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Ресурс не найден'): ApiError {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message, 'CONFLICT');
  }

  static tooManyRequests(message = 'Слишком много запросов'): ApiError {
    return new ApiError(429, message, 'RATE_LIMIT');
  }

  static internal(message = 'Внутренняя ошибка сервера'): ApiError {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}
