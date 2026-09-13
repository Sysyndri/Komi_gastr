/**
 * Integration-тесты для блюд, заведений и мероприятий (публичные + admin).
 */
import request from 'supertest';
import { createApp } from '../../app';
import { cleanDatabase, createDish, createEvent, createMasterClass, createPlace } from '../helpers';
import { AuthService } from '../../services/AuthService';
import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';

const app = createApp();

async function getAdminToken() {
  const r = await AuthService.register({
    email: `admin-${Date.now()}-${Math.random()}@test.ru`,
    password: 'Password1',
    name: 'Админ',
  });
  await prisma.user.update({ where: { id: r.user.sub }, data: { role: Role.ADMIN } });
  return { token: r.accessToken, id: r.user.sub };
}

describe('Dishes API', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('GET /api/dishes/:id — 200 детали блюда', async () => {
    const dish = await createDish({ name: 'Детальное блюдо' });
    const res = await request(app).get(`/api/dishes/${dish.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Детальное блюдо');
  });

  it('GET /api/dishes/:id — 404', async () => {
    const res = await request(app).get('/api/dishes/clqnonexistent000000000000001');
    expect(res.status).toBe(404);
  });

  it('POST /api/dishes — 201 админ создаёт блюдо', async () => {
    const admin = await getAdminToken();
    const res = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Новое блюдо',
        description: 'Описание нового блюда достаточной длины',
        difficulty: 'EASY',
        cookingTimeMin: 30,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Новое блюдо');
  });

  it('PUT /api/dishes/:id — 200 обновление', async () => {
    const admin = await getAdminToken();
    const dish = await createDish({ name: 'Старое' });
    const res = await request(app)
      .put(`/api/dishes/${dish.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Новое название' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Новое название');
  });

  it('DELETE /api/dishes/:id — 200 удаление', async () => {
    const admin = await getAdminToken();
    const dish = await createDish();
    const res = await request(app)
      .delete(`/api/dishes/${dish.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
  });

  it('POST /api/dishes — 403 без прав', async () => {
    const r = await AuthService.register({
      email: `u-${Date.now()}@test.ru`,
      password: 'Password1',
      name: 'U',
    });
    const res = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${r.accessToken}`)
      .send({ name: 'X', description: 'Описание достаточной длины', cookingTimeMin: 30 });
    expect(res.status).toBe(403);
  });
});

describe('Places API', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('GET /api/places — 200 список', async () => {
    await createPlace({ name: 'Заведение А' });
    const res = await request(app).get('/api/places');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /api/places/:id — 200', async () => {
    const place = await createPlace();
    const res = await request(app).get(`/api/places/${place.id}`);
    expect(res.status).toBe(200);
  });

  it('POST /api/places — 201 админ', async () => {
    const admin = await getAdminToken();
    const res = await request(app)
      .post('/api/places')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Новое заведение',
        address: 'г. Тест, ул. Тестовая, 5',
        latitude: 61.0,
        longitude: 50.0,
      });
    expect(res.status).toBe(201);
  });

  it('PUT /api/places/:id — 200 обновление', async () => {
    const admin = await getAdminToken();
    const place = await createPlace({ name: 'Старое название' });
    const res = await request(app)
      .put(`/api/places/${place.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Новое название', workHours: 'Круглосуточно' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Новое название');
  });

  it('DELETE /api/places/:id — 200', async () => {
    const admin = await getAdminToken();
    const place = await createPlace();
    const res = await request(app)
      .delete(`/api/places/${place.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
  });
});

describe('Events API', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('GET /api/events — 200 список', async () => {
    await createEvent({ title: 'Событие 1' });
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it('GET /api/events/:id — 200', async () => {
    const event = await createEvent({ title: 'Детальное' });
    const res = await request(app).get(`/api/events/${event.id}`);
    expect(res.status).toBe(200);
  });

  it('POST /api/events — 201 админ', async () => {
    const admin = await getAdminToken();
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Новое событие',
        description: 'Описание нового события',
        startDate: new Date(Date.now() + 10 * 86_400_000).toISOString(),
        location: 'г. Сыктывкар',
      });
    expect(res.status).toBe(201);
  });

  it('PUT /api/events/:id — 200', async () => {
    const admin = await getAdminToken();
    const event = await createEvent();
    const res = await request(app)
      .put(`/api/events/${event.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Обновлённое' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/events/:id — 200', async () => {
    const admin = await getAdminToken();
    const event = await createEvent();
    const res = await request(app)
      .delete(`/api/events/${event.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
  });
});
