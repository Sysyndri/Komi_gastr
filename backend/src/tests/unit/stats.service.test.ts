/**
 * Unit-тесты для StatsService.
 */
import { StatsService } from '../../services/StatsService';
import { cleanDatabase, createDish, createEvent, createMasterClass, createPlace, createUser } from '../helpers';
import { BookingService } from '../../services/BookingService';

describe('StatsService', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('getStats возвращает агрегированные метрики', async () => {
    await createUser({ email: 'u1@test.ru' });
    await createUser({ email: 'u2@test.ru' });
    await createDish({ name: 'Блюдо 1' });
    await createDish({ name: 'Блюдо 2' });
    await createPlace({ name: 'Заведение 1' });
    const mc = await createMasterClass({ title: 'МК 1', price: 1000 });
    await createEvent({ title: 'Событие 1' });

    const user = await createUser({ email: 'booker@test.ru' });
    await BookingService.bookMasterClass(user.id, mc.id);

    const stats = await StatsService.getStats();
    expect(stats.users).toBeGreaterThanOrEqual(3);
    expect(stats.dishes).toBe(2);
    expect(stats.places).toBe(1);
    expect(stats.masterClasses).toBe(1);
    expect(stats.events).toBe(1);
    expect(stats.bookings).toBe(1);
    expect(stats.revenue).toBe(1000);
    expect(stats.topMasterClasses).toHaveLength(1);
  });

  it('getUserStats возвращает статистику по ролям', async () => {
    await createUser({ email: 'admin@test.ru', role: 'ADMIN' });
    await createUser({ email: 'mod@test.ru', role: 'MODERATOR' });
    await createUser({ email: 'usr@test.ru', role: 'USER' });

    const stats = await StatsService.getUserStats();
    expect(stats.admins).toBeGreaterThanOrEqual(1);
    expect(stats.moderators).toBeGreaterThanOrEqual(1);
    expect(stats.users).toBeGreaterThanOrEqual(1);
    expect(stats.total).toBeGreaterThanOrEqual(3);
  });
});
