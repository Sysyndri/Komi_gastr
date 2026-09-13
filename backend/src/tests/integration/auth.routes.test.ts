/**
 * Integration-тесты для эндпоинтов аутентификации.
 * Проверяют: регистрацию, вход, /me, refresh, ошибки валидации.
 */
import request from 'supertest';
import { createApp } from '../../app';
import { cleanDatabase } from '../helpers';
import { AuthService } from '../../services/AuthService';

const app = createApp();

describe('POST /api/auth/register', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('201 — успешная регистрация', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'integration@test.ru',
      password: 'Password1',
      name: 'Интеграционный тест',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('integration@test.ru');
  });

  it('400 — невалидный email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'Password1',
      name: 'Тест',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('400 — короткий пароль', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'short@test.ru',
      password: '123',
      name: 'Тест',
    });
    expect(res.status).toBe(400);
  });

  it('409 — дублирующий email', async () => {
    await AuthService.register({ email: 'dup@test.ru', password: 'Password1', name: 'Дубль' });

    const res = await request(app).post('/api/auth/register').send({
      email: 'dup@test.ru',
      password: 'Password1',
      name: 'Дубль 2',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('200 — успешный вход', async () => {
    await AuthService.register({ email: 'login@test.ru', password: 'Password1', name: 'Логин' });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.ru',
      password: 'Password1',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('401 — неверный пароль', async () => {
    await AuthService.register({ email: 'login2@test.ru', password: 'Password1', name: 'Логин 2' });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login2@test.ru',
      password: 'WrongPassword1',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('200 — с валидным токеном', async () => {
    const result = await AuthService.register({
      email: 'me@test.ru',
      password: 'Password1',
      name: 'Я',
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${result.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@test.ru');
  });

  it('401 — без токена', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('200 — обновление токенов', async () => {
    const result = await AuthService.register({
      email: 'refresh@test.ru',
      password: 'Password1',
      name: 'Рефреш',
    });

    const res = await request(app).post('/api/auth/refresh').send({
      refreshToken: result.refreshToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('401 — невалидный refresh-токен', async () => {
    const res = await request(app).post('/api/auth/refresh').send({
      refreshToken: 'invalid-token',
    });
    expect(res.status).toBe(401);
  });
});
