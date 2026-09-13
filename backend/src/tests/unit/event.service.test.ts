/**
 * Unit-тесты для EventService.
 */
import { EventService } from '../../services/EventService';
import { cleanDatabase, createEvent, createPlace } from '../helpers';
import { Status } from '@prisma/client';

describe('EventService', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  describe('list', () => {
    it('возвращает только активные по умолчанию', async () => {
      await createEvent({ title: 'Активное', status: Status.ACTIVE });
      await createEvent({ title: 'Черновик', status: Status.DRAFT });

      const result = await EventService.list({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Активное');
    });

    it('фильтрует по цене', async () => {
      await createEvent({ title: 'Бесплатное', price: 0 });
      await createEvent({ title: 'Платное', price: 5000 });

      const result = await EventService.list({ priceMax: 0, page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Бесплатное');
    });

    it('ищет по названию', async () => {
      await createEvent({ title: 'Фестиваль шаньги' });
      await createEvent({ title: 'Выставка' });

      const result = await EventService.list({ search: 'фестиваль', page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
    });

    it('фильтрует по диапазону дат', async () => {
      await createEvent({ title: 'Скоро', startDate: new Date(Date.now() + 5 * 86_400_000) });
      await createEvent({ title: 'Позже', startDate: new Date(Date.now() + 40 * 86_400_000) });

      const result = await EventService.list({
        dateFrom: new Date(Date.now() + 3 * 86_400_000),
        dateTo: new Date(Date.now() + 10 * 86_400_000),
        page: 1,
        limit: 10,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Скоро');
    });

    it('показывает черновики при явном статусе', async () => {
      await createEvent({ title: 'Черновик', status: Status.DRAFT });
      const result = await EventService.list({ status: Status.DRAFT, page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('возвращает детали с количеством мест', async () => {
      const event = await createEvent({ title: 'Детальное', maxVisitors: 100 });
      const found = await EventService.getById(event.id);
      expect(found.title).toBe('Детальное');
      expect(found.availableSeats).toBe(100);
    });

    it('бросает 404', async () => {
      await expect(EventService.getById('clqnonexistent000000000000001')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('CRUD', () => {
    it('создаёт, обновляет и удаляет мероприятие', async () => {
      const place = await createPlace();
      const event = await EventService.create({
        title: 'Новое мероприятие',
        description: 'Описание',
        startDate: new Date(Date.now() + 10 * 86_400_000),
        location: 'г. Новый',
        price: 0,
        status: Status.ACTIVE,
        place: { connect: { id: place.id } },
      } as never);

      expect(event.id).toBeDefined();

      const updated = await EventService.update(event.id, { title: 'Обновлённое' });
      expect(updated.title).toBe('Обновлённое');

      await EventService.remove(event.id);
      await expect(EventService.getById(event.id)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
