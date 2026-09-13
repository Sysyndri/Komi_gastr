/**
 * Unit-тесты для MasterClassService.
 */
import { MasterClassService } from '../../services/MasterClassService';
import { cleanDatabase, createDish, createMasterClass, createPlace, createUser } from '../helpers';
import { Status } from '@prisma/client';
import { BookingService } from '../../services/BookingService';

describe('MasterClassService', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  describe('list', () => {
    it('возвращает только активные по умолчанию', async () => {
      await createMasterClass({ title: 'Активный', status: Status.ACTIVE });
      await createMasterClass({ title: 'Черновик', status: Status.DRAFT });

      const result = await MasterClassService.list({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Активный');
    });

    it('админ видит все статусы при явном указании', async () => {
      await createMasterClass({ title: 'Активный', status: Status.ACTIVE });
      await createMasterClass({ title: 'Черновик', status: Status.DRAFT });

      const result = await MasterClassService.list({ page: 1, limit: 10, status: Status.DRAFT });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Черновик');
    });

    it('фильтрует по цене', async () => {
      await createMasterClass({ title: 'Дешёвый', price: 500 });
      await createMasterClass({ title: 'Дорогой', price: 5000 });

      const result = await MasterClassService.list({ priceMax: 1000, page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Дешёвый');
    });

    it('ищет по описанию', async () => {
      await createMasterClass({ title: 'МК 1', description: 'Учимся печь черинянь' });
      await createMasterClass({ title: 'МК 2', description: 'Готовим шаньгу' });

      const result = await MasterClassService.list({ search: 'черинянь', page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('МК 1');
    });

    it('фильтрует по диапазону дат', async () => {
      await createMasterClass({ title: 'Скоро', date: new Date(Date.now() + 5 * 86_400_000) });
      await createMasterClass({ title: 'Позже', date: new Date(Date.now() + 30 * 86_400_000) });

      const result = await MasterClassService.list({
        dateFrom: new Date(Date.now() + 3 * 86_400_000),
        dateTo: new Date(Date.now() + 10 * 86_400_000),
        page: 1,
        limit: 10,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Скоро');
    });

    it('фильтрует по dishId', async () => {
      const dish = await createDish({ name: 'Целевое блюдо' });
      await createMasterClass({ title: 'Связанный', dishId: dish.id });
      await createMasterClass({ title: 'Несвязанный' });

      const result = await MasterClassService.list({ dishId: dish.id, page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Связанный');
    });
  });

  describe('getById', () => {
    it('возвращает детали с количеством свободных мест', async () => {
      const dish = await createDish();
      const mc = await createMasterClass({
        title: 'МК с блюдом',
        maxParticipants: 5,
        dishId: dish.id,
      });

      const user = await createUser();
      await BookingService.bookMasterClass(user.id, mc.id);

      const details = await MasterClassService.getById(mc.id);
      expect(details.bookingsCount).toBe(1);
      expect(details.availableSeats).toBe(4);
    });

    it('бросает 404 при отсутствии', async () => {
      await expect(
        MasterClassService.getById('clqnonexistent000000000000001'),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('CRUD', () => {
    it('создаёт, обновляет и удаляет МК', async () => {
      const place = await createPlace();
      const mc = await MasterClassService.create({
        title: 'Новый МК',
        description: 'Описание нового мастер-класса',
        date: new Date(Date.now() + 10 * 86_400_000),
        durationMin: 90,
        price: 2000,
        maxParticipants: 15,
        status: Status.ACTIVE,
        place: { connect: { id: place.id } },
      } as never);

      expect(mc.id).toBeDefined();

      const updated = await MasterClassService.update(mc.id, { title: 'Обновлённый МК' });
      expect(updated.title).toBe('Обновлённый МК');

      await MasterClassService.remove(mc.id);
      await expect(MasterClassService.getById(mc.id)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
