import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { JwtPayload, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';
import { Role } from '@prisma/client';

/**
 * AuthService — бизнес-логика аутентификации:
 * регистрация, вход, обновление токенов, выход.
 */
export class AuthService {
  /** Регистрация нового пользователя. */
  static async register(input: { email: string; password: string; name: string; phone?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict('Пользователь с таким email уже существует');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name, phone: input.phone || null },
      select: { id: true, email: true, name: true, role: true },
    });

    return this.issueTokens(user.id, user.email, user.role, user.name);
  }

  /** Вход пользователя по email и паролю. */
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.unauthorized('Неверный email или пароль');
    if (user.isBlocked) throw ApiError.forbidden('Учётная запись заблокирована');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Неверный email или пароль');

    return this.issueTokens(user.id, user.email, user.role, user.name);
  }

  /** Обновление пары токенов по refresh-токену. */
  static async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Недействительный refresh-токен');
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh-токен отозван или истёк');
    }

    // Ротация: старый токен отзываем
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    if (user.isBlocked) throw ApiError.forbidden('Учётная запись заблокирована');

    return this.issueTokens(user.id, user.email, user.role, user.name);
  }

  /** Выход — отзыв всех refresh-токенов пользователя. */
  static async logout(userId: string) {
    await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
  }

  /** Генерирует access + refresh токены и сохраняет refresh в БД. */
  private static async issueTokens(
    id: string,
    email: string,
    role: Role,
    name: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: JwtPayload }> {
    const payload: JwtPayload = { sub: id, email, role, name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(id);

    // Срок жизни refresh из строки вида "7d" — в миллисекунды
    const ms = this.parseDuration(env.JWT_REFRESH_EXPIRES_IN);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: id, expiresAt: new Date(Date.now() + ms) },
    });

    return { accessToken, refreshToken, user: payload };
  }

  /** Преобразует строку длительности (15m, 7d, 1h) в миллисекунды. */
  private static parseDuration(d: string): number {
    const match = /^(\d+)([smhd])$/.exec(d);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const n = Number(match[1]);
    const unit = match[2];
    const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
    return n * mult;
  }
}
