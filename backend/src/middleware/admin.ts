import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

/**
 * AdminMiddleware — проверяет, что пользователь имеет роль ADMIN.
 * Должен использоваться ПОСЛЕ authenticate.
 *
 * @param roles разрешённые роли (по умолчанию только ADMIN)
 */
export function requireRoles(roles: Role[] = [Role.ADMIN]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Требуются права администратора'));
    }
    next();
  };
}
