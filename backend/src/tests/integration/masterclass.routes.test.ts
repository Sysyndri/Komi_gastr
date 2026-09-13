/**
 * Integration-тесты для CRUD мастер-классов и записи на МК.
 * Проверяют: создание (admin), чтение (public), запись, ошибки 403/404.
 */
import request from 'supertest';
import { createApp } from '../../app';
import { cleanDatabase, createDish, createMasterClass, createPlace, createUser } from '../helpers';
import { AuthService } from '../../services/AuthService';
import { Role, Status } from '@prisma/client';

const app = createApp();

async function getAdminToken() {
  const r = await AuthService.register({ email: `admin-${Date.now()}@test.ru`, password: 'Password1', name: 'Админ' });
  // Повышаем роль до ADMIN напрямую в БД
  const { prisma } = await import('../../lib/prisma');
  await prisma.user.update({ where: { id: r.user.sub }, data: { role: Role.ADMIN } });
  return { token: r.accessToken, id: r.user.sub };
}

async function getUserToken() {
  const r = await AuthService.register({ email: `user-${Date.now()}@test.ru`, password: 'Password1', name: 'Юзер' });
  return { token: r.accessToken, id: r.user.sub };
}

describe('GET /api/masterclasses', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('200 — возвращает список активных МК', async () => {
    await createMasterClass({ title: 'Публичный МК', status: Status.ACTIVE });
    await createMasterClass({ title: 'Черновик', status: Status.DRAFT });

    const res = await request(app).get('/api/masterclasses');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe('Публичный МК');
  });

  it('200 — пагинация работает', async () => {
    for (let i = 0; i < 3; i++) {
      await createMasterClass({ title: `МК ${i}` });
    }
    const res = await request(app).get('/api/masterclasses?limit=2&page=1');
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.total).toBe(3);
  });
});

describe('GET /api/masterclasses/:id', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('200 — детали МК', async () => {
    const mc = await createMasterClass({ title: 'Детальный МК' });
    const res = await request(app).get(`/api/masterclasses/${mc.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Детальный МК');
    expect(res.body.data.availableSeats).toBeDefined();
  });

  it('404 — МК не найден', async () => {
    const res = await request(app).get('/api/masterclasses/clqnonexistent000000000000001');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/masterclasses (admin)', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('201 — админ создаёт МК', async () => {
    const admin = await getAdminToken();
    const dish = await createDish();
    const place = await createPlace();

    const res = await request(app)
      .post('/api/masterclasses')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Новый МК через API',
        description: 'Создан через integration тест',
        date: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        durationMin: 120,
        price: 1500,
        maxParticipants: 10,
        dishId: dish.id,
        placeId: place.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Новый МК через API');
  });

  it('403 — обычный пользователь не может создать', async () => {
    const user = await getUserToken();
    const res = await request(app)
      .post('/api/masterclasses')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        title: 'Запрещённый МК',
        description: 'Не должно создаться',
        date: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        durationMin: 120,
        price: 0,
        maxParticipants: 5,
      });
    expect(res.status).toBe(403);
  });

  it('401 — без токена', async () => {
    const res = await request(app).post('/api/masterclasses').send({
      title: 'Без токена',
      description: 'Не должно создаться',
      date: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      durationMin: 120,
      price: 0,
      maxParticipants: 5,
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/bookings/masterclass/:id', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('201 — успешная запись', async () => {
    const user = await getUserToken();
    const mc = await createMasterClass({ maxParticipants: 10 });

    const res = await request(app)
      .post(`/api/bookings/masterclass/${mc.id}`)
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('409 — повторная запись', async () => {
    const user = await getUserToken();
    const mc = await createMasterClass({ maxParticipants: 10 });

    await request(app)
      .post(`/api/bookings/masterclass/${mc.id}`)
      .set('Authorization', `Bearer ${user.token}`);

    const res = await request(app)
      .post(`/api/bookings/masterclass/${mc.id}`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(409);
  });

  it('400 — все места заняты', async () => {
    const mc = await createMasterClass({ maxParticipants: 1 });
    const u1 = await getUserToken();
    await request(app)
      .post(`/api/bookings/masterclass/${mc.id}`)
      .set('Authorization', `Bearer ${u1.token}`);

    const u2 = await getUserToken();
    const res = await request(app)
      .post(`/api/bookings/masterclass/${mc.id}`)
      .set('Authorization', `Bearer ${u2.token}`);
    expect(res.status).toBe(400);
  });

  it('401 — без токена', async () => {
    const mc = await createMasterClass();
    const res = await request(app).post(`/api/bookings/masterclass/${mc.id}`);
    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/bookings/masterclass/:id', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('200 — отмена записи', async () => {
    const user = await getUserToken();
    const mc = await createMasterClass();

    const bookRes = await request(app)
      .post(`/api/bookings/masterclass/${mc.id}`)
      .set('Authorization', `Bearer ${user.token}`);

    const res = await request(app)
      .delete(`/api/bookings/masterclass/${bookRes.body.data.id}`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });
});
