import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../lib/prisma';

/**
 * AuthMiddleware — проверяет наличие и валидность JWT access-токена.
 * Токен передаётся в заголовке Authorization: Bearer <token>.
 * Помещает декодированные данные пользователя в req.user.
 *
 * @param required если false — токен опционален (для публичных эндпоинтов).
 */
export function authenticate(required = true) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        if (required) throw ApiError.unauthorized();
        return next();
      }

      const payload = verifyAccessToken(token);

      // Проверяем, что пользователь существует и не заблокирован
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, name: true, isBlocked: true },
      });

      if (!user) throw ApiError.unauthorized('Пользователь не найден');
      if (user.isBlocked) throw ApiError.forbidden('Учётная запись заблокирована');

      req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
      next();
    } catch (err) {
      if (err instanceof ApiError) return next(err);
      next(ApiError.unauthorized('Недействительный токен'));
    }
  };
}
