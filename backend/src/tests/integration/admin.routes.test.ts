/**
 * Integration-тесты для admin и stats эндпоинтов.
 */
import request from 'supertest';
import { createApp } from '../../app';
import { cleanDatabase, createMasterClass, createUser } from '../helpers';
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

async function getUserToken() {
  const r = await AuthService.register({
    email: `user-${Date.now()}-${Math.random()}@test.ru`,
    password: 'Password1',
    name: 'Юзер',
  });
  return { token: r.accessToken, id: r.user.sub };
}

describe('Admin endpoints', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/admin/users', () => {
    it('200 — админ видит список пользователей', async () => {
      const admin = await getAdminToken();
      await createUser({ email: 'listed@test.ru' });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('403 — обычный пользователь не имеет доступа', async () => {
      const user = await getUserToken();
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(403);
    });

    it('200 — фильтрация по поиску и роли', async () => {
      const admin = await getAdminToken();
      await createUser({ email: 'findme@test.ru', name: 'Ищем этого' });

      const res = await request(app)
        .get('/api/admin/users?search=findme&role=USER')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('401 — без токена', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/admin/users/:id/role', () => {
    it('200 — админ меняет роль', async () => {
      const admin = await getAdminToken();
      const target = await createUser({ email: 'target@test.ru' });

      const res = await request(app)
        .patch(`/api/admin/users/${target.id}/role`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ role: 'MODERATOR' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('MODERATOR');
    });
  });

  describe('PATCH /api/admin/users/:id/block', () => {
    it('200 — блокировка пользователя', async () => {
      const admin = await getAdminToken();
      const target = await createUser({ email: 'block@test.ru' });

      const res = await request(app)
        .patch(`/api/admin/users/${target.id}/block`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isBlocked).toBe(true);
    });

    it('400 — нельзя заблокировать админа', async () => {
      const admin = await getAdminToken();
      const otherAdmin = await createUser({ email: 'admin2@test.ru', role: Role.ADMIN });

      const res = await request(app)
        .patch(`/api/admin/users/${otherAdmin.id}/block`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(400);
    });

    it('404 — пользователь не найден', async () => {
      const admin = await getAdminToken();
      const res = await request(app)
        .patch('/api/admin/users/clqnonexistent000000000000001/block')
        .set('Authorization', `Bearer ${admin.token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/admin/masterclasses/export', () => {
    it('200 — экспорт CSV', async () => {
      const admin = await getAdminToken();
      await createMasterClass({ title: 'МК для экспорта' });

      const res = await request(app)
        .get('/api/admin/masterclasses/export')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('МК для экспорта');
    });
  });

  describe('GET /api/admin/bookings/export', () => {
    it('200 — экспорт бронирований CSV', async () => {
      const admin = await getAdminToken();
      const res = await request(app)
        .get('/api/admin/bookings/export')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });
  });
});

describe('Stats endpoints', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('200 — GET /api/stats (admin)', async () => {
    const admin = await getAdminToken();
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('users');
    expect(res.body.data).toHaveProperty('revenue');
  });

  it('200 — GET /api/stats/users (admin)', async () => {
    const admin = await getAdminToken();
    const res = await request(app)
      .get('/api/stats/users')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('admins');
  });

  it('200 — GET /api/stats с периодом', async () => {
    const admin = await getAdminToken();
    const res = await request(app)
      .get(
        `/api/stats?from=${encodeURIComponent(new Date(Date.now() - 30 * 86_400_000).toISOString())}`,
      )
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('users');
  });

  it('403 — обычный пользователь не видит статистику', async () => {
    const user = await getUserToken();
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${user.token}`);
    expect(res.status).toBe(403);
  });
});
