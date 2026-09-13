/**
 * Unit-тесты для BookingService.
 * Проверяют: успешную запись, переполнение, дубликат, отмену.
 */
import { BookingService } from '../../services/BookingService';
import { cleanDatabase, createMasterClass, createEvent, createUser } from '../helpers';
import { BookingStatus } from '@prisma/client';

describe('BookingService', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  describe('bookMasterClass', () => {
    it('успешно записывает пользователя', async () => {
      const user = await createUser();
      const mc = await createMasterClass({ maxParticipants: 10 });

      const booking = await BookingService.bookMasterClass(user.id, mc.id);
      expect(booking.status).toBe(BookingStatus.CONFIRMED);
    });

    it('бросает Conflict при повторной записи', async () => {
      const user = await createUser();
      const mc = await createMasterClass({ maxParticipants: 10 });

      await BookingService.bookMasterClass(user.id, mc.id);
      await expect(BookingService.bookMasterClass(user.id, mc.id)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('бросает BadRequest при переполнении', async () => {
      const mc = await createMasterClass({ maxParticipants: 1 });
      const user1 = await createUser({ email: 'u1@test.ru' });
      const user2 = await createUser({ email: 'u2@test.ru' });

      await BookingService.bookMasterClass(user1.id, mc.id);
      await expect(BookingService.bookMasterClass(user2.id, mc.id)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('бросает BadRequest при записи на завершённый МК', async () => {
      const user = await createUser();
      const mc = await createMasterClass({ date: new Date(Date.now() - 86_400_000) });

      await expect(BookingService.bookMasterClass(user.id, mc.id)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('бросает NotFound для несуществующего МК', async () => {
      const user = await createUser();
      await expect(
        BookingService.bookMasterClass(user.id, 'clqnonexistent000000000000001'),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('позволяет реактивировать отменённую запись', async () => {
      const user = await createUser();
      const mc = await createMasterClass({ maxParticipants: 10 });

      const booking = await BookingService.bookMasterClass(user.id, mc.id);
      await BookingService.cancelBooking(user.id, booking.id);

      const reactivated = await BookingService.bookMasterClass(user.id, mc.id);
      expect(reactivated.status).toBe(BookingStatus.CONFIRMED);
    });
  });

  describe('cancelBooking', () => {
    it('отменяет запись', async () => {
      const user = await createUser();
      const mc = await createMasterClass();
      const booking = await BookingService.bookMasterClass(user.id, mc.id);

      const cancelled = await BookingService.cancelBooking(user.id, booking.id);
      expect(cancelled.status).toBe(BookingStatus.CANCELLED);
    });

    it('запрещает отмену чужой записи', async () => {
      const user1 = await createUser({ email: 'owner@test.ru' });
      const user2 = await createUser({ email: 'intruder@test.ru' });
      const mc = await createMasterClass();
      const booking = await BookingService.bookMasterClass(user1.id, mc.id);

      await expect(BookingService.cancelBooking(user2.id, booking.id)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('bookEvent', () => {
    it('успешно записывает на мероприятие', async () => {
      const user = await createUser();
      const event = await createEvent({ maxVisitors: 50 });

      const booking = await BookingService.bookEvent(user.id, event.id);
      expect(booking.status).toBe(BookingStatus.CONFIRMED);
    });

    it('бросает Conflict при повторной записи на мероприятие', async () => {
      const user = await createUser();
      const event = await createEvent({ maxVisitors: 50 });

      await BookingService.bookEvent(user.id, event.id);
      await expect(BookingService.bookEvent(user.id, event.id)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('бросает BadRequest при переполнении мероприятия', async () => {
      const event = await createEvent({ maxVisitors: 1 });
      const u1 = await createUser({ email: 'e1@test.ru' });
      const u2 = await createUser({ email: 'e2@test.ru' });

      await BookingService.bookEvent(u1.id, event.id);
      await expect(BookingService.bookEvent(u2.id, event.id)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('бросает BadRequest при записи на завершённое мероприятие', async () => {
      const user = await createUser();
      const event = await createEvent({ startDate: new Date(Date.now() - 86_400_000) });

      await expect(BookingService.bookEvent(user.id, event.id)).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('cancelEventBooking', () => {
    it('отменяет запись на мероприятие', async () => {
      const user = await createUser();
      const event = await createEvent();
      const booking = await BookingService.bookEvent(user.id, event.id);

      const cancelled = await BookingService.cancelEventBooking(user.id, booking.id);
      expect(cancelled.status).toBe(BookingStatus.CANCELLED);
    });

    it('запрещает отмену чужой записи на мероприятие', async () => {
      const u1 = await createUser({ email: 'owner2@test.ru' });
      const u2 = await createUser({ email: 'intruder2@test.ru' });
      const event = await createEvent();
      const booking = await BookingService.bookEvent(u1.id, event.id);

      await expect(BookingService.cancelEventBooking(u2.id, booking.id)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe('getMyBookings', () => {
    it('возвращает записи пользователя по МК и мероприятиям', async () => {
      const user = await createUser();
      const mc = await createMasterClass();
      const event = await createEvent();

      await BookingService.bookMasterClass(user.id, mc.id);
      await BookingService.bookEvent(user.id, event.id);

      const result = await BookingService.getMyBookings(user.id);
      expect(result.masterClasses).toHaveLength(1);
      expect(result.events).toHaveLength(1);
    });
  });
});
