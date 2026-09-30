import { Response } from 'express';
import { env } from '../config/env';

/**
 * Cookie с access-токеном.
 *
 * Её читает серверный middleware фронтенда (проверка доступа к /profile и
 * /admin), поэтому флаг HttpOnly обязателен: из JavaScript значение cookie
 * недоступно, значит XSS не может ни украсть токен, ни подделать роль.
 */
export const ACCESS_TOKEN_COOKIE = 'gk_access_token';

/**
 * Выставляет cookie сессии. Без maxAge — это session cookie: живёт до закрытия
 * браузера, а срок самого токена всё равно ограничен JWT_EXPIRES_IN.
 *
 * Secure включается только когда публичный адрес API отдаётся по HTTPS —
 * иначе браузер отбросил бы cookie на http-стенке (localhost и сервер по IP).
 */
export function setAccessTokenCookie(res: Response, accessToken: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isSecure,
    path: '/',
  });
}

/** Удаляет cookie сессии (выход из системы). */
export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isSecure,
    path: '/',
  });
}
