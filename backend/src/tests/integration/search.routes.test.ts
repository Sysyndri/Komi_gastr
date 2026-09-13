/**
 * Integration-тесты для поиска, блюд и 404/health.
 */
import request from 'supertest';
import { createApp } from '../../app';
import { cleanDatabase, createDish, createMasterClass, createEvent } from '../helpers';

const app = createApp();

describe('GET /api/health', () => {
  it('200 — сервис работает', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('GET /api/search', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('200 — поиск по блюдам', async () => {
    await createDish({ name: 'Шаньга' });
    await createDish({ name: 'Черинянь' });

    const res = await request(app).get('/api/search?q=шаньга');
    expect(res.status).toBe(200);
    expect(res.body.data.dishes).toHaveLength(1);
  });

  it('200 — поиск по мастер-классам', async () => {
    await createMasterClass({ title: 'МК по шаньге', description: 'Описание' });

    const res = await request(app).get('/api/search?q=шаньге');
    expect(res.body.data.masterClasses).toHaveLength(1);
  });

  it('200 — поиск по мероприятиям', async () => {
    await createEvent({ title: 'Фестиваль шаньги', location: 'Сыктывкар' });

    const res = await request(app).get('/api/search?q=фестиваль');
    expect(res.body.data.events).toHaveLength(1);
  });

  it('200 — пустой запрос возвращает пустые массивы', async () => {
    const res = await request(app).get('/api/search?q=');
    expect(res.status).toBe(200);
    expect(res.body.data.dishes).toHaveLength(0);
  });
});

describe('GET /api/dishes', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('200 — список блюд', async () => {
    await createDish({ name: 'Блюдо 1' });
    await createDish({ name: 'Блюдо 2' });

    const res = await request(app).get('/api/dishes');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
  });

  it('200 — фильтрация по сложности', async () => {
    await createDish({ name: 'Лёгкое', difficulty: 'EASY' });
    await createDish({ name: 'Сложное', difficulty: 'HARD' });

    const res = await request(app).get('/api/dishes?difficulty=HARD');
    expect(res.body.data.items).toHaveLength(1);
  });
});

describe('404 handling', () => {
  it('404 — неизвестный маршрут', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
