/**
 * Unit-тесты для AuthService.
 * Проверяют: регистрацию, вход, обновление токенов, конфликты, невалидные данные.
 */
import { AuthService } from '../../services/AuthService';
import { prisma } from '../../lib/prisma';
import { cleanDatabase, createUser } from '../helpers';
describe('AuthService', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  describe('register', () => {
    it('регистрирует нового пользователя и возвращает токены', async () => {
      const result = await AuthService.register({
        email: 'newuser@test.ru',
        password: 'Password1',
        name: 'Новый пользователь',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('newuser@test.ru');
      expect(result.user.role).toBe('USER');

      // refresh-токен сохранён в БД
      const stored = await prisma.refreshToken.findUnique({
        where: { token: result.refreshToken },
      });
      expect(stored).toBeTruthy();
      expect(stored!.revoked).toBe(false);
    });

    it('бросает Conflict при повторной регистрации с тем же email', async () => {
      await AuthService.register({ email: 'dup@test.ru', password: 'Password1', name: 'Дубль' });

      await expect(
        AuthService.register({ email: 'dup@test.ru', password: 'Password1', name: 'Дубль 2' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('login', () => {
    it('входит с корректными данными', async () => {
      await AuthService.register({ email: 'login@test.ru', password: 'Password1', name: 'Логин' });

      const result = await AuthService.login('login@test.ru', 'Password1');
      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe('login@test.ru');
    });

    it('бросает Unauthorized при неверном пароле', async () => {
      await AuthService.register({
        email: 'login2@test.ru',
        password: 'Password1',
        name: 'Логин 2',
      });

      await expect(AuthService.login('login2@test.ru', 'WrongPass1')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('бросает Unauthorized при несуществующем email', async () => {
      await expect(AuthService.login('nobody@test.ru', 'Password1')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('бросает Forbidden при входе заблокированного пользователя', async () => {
      await createUser({ email: 'blocked@test.ru', isBlocked: true });

      await expect(AuthService.login('blocked@test.ru', 'Password1')).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('refresh', () => {
    it('выдаёт новую пару токенов по валидному refresh-токену', async () => {
      const first = await AuthService.register({
        email: 'refresh@test.ru',
        password: 'Password1',
        name: 'Рефреш',
      });

      const second = await AuthService.refresh(first.refreshToken);
      expect(second.accessToken).toBeDefined();
      expect(second.refreshToken).not.toBe(first.refreshToken);

      // Старый refresh-токен отозван
      const old = await prisma.refreshToken.findUnique({ where: { token: first.refreshToken } });
      expect(old!.revoked).toBe(true);
    });

    it('бросает Unauthorized при недействительном refresh-токене', async () => {
      await expect(AuthService.refresh('invalid-token-string')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('бросает Unauthorized при отозванном refresh-токене', async () => {
      const first = await AuthService.register({
        email: 'revoked@test.ru',
        password: 'Password1',
        name: 'Отозван',
      });
      await AuthService.logout(first.user.sub);

      await expect(AuthService.refresh(first.refreshToken)).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('logout', () => {
    it('отзывает все refresh-токены пользователя', async () => {
      const result = await AuthService.register({
        email: 'logout@test.ru',
        password: 'Password1',
        name: 'Логаут',
      });

      await AuthService.logout(result.user.sub);

      const tokens = await prisma.refreshToken.findMany({ where: { userId: result.user.sub } });
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every((t) => t.revoked)).toBe(true);
    });
  });
});
