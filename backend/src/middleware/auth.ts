import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../lib/prisma';
import { ACCESS_TOKEN_COOKIE } from '../utils/authCookies';

/**
 * Достаёт access-токен из cookie, которую backend выставляет при входе.
 * Нужна как запасной источник токена: браузер присылает её автоматически,
 * поэтому защищённые страницы фронтенда и SSR-запросы работают без
 * ручной подстановки заголовка Authorization.
 */
function tokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    const name = part.slice(0, separator).trim();
    if (name !== ACCESS_TOKEN_COOKIE) continue;
    const value = part.slice(separator + 1).trim();
    return value ? decodeURIComponent(value) : null;
  }
  return null;
}

/**
 * AuthMiddleware — проверяет наличие и валидность JWT access-токена.
 * Токен берётся из заголовка Authorization: Bearer <token>, а если заголовка
 * нет — из HttpOnly cookie (gk_access_token).
 * Помещает декодированные данные пользователя в req.user.
 *
 * @param required если false — токен опционален (для публичных эндпоинтов).
 */
export function authenticate(required = true) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      const token = header?.startsWith('Bearer ')
        ? header.slice(7)
        : tokenFromCookie(req.headers.cookie);

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
