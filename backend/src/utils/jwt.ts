import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

/**
 * Полезная нагрузка JWT-токена.
 */
export interface JwtPayload {
  sub: string; // id пользователя
  email: string;
  role: string;
  name: string;
}

/**
 * Подписывает access-токен (короткоживущий).
 */
export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Подписывает refresh-токен (долгоживущий).
 * jti гарантирует уникальность токена даже при повторном вызове в одну секунду.
 */
export function signRefreshToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as SignOptions['expiresIn'],
    jwtid: randomUUID(),
  };
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, options);
}

/**
 * Верифицирует access-токен.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

/**
 * Верифицирует refresh-токен.
 */
export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}
