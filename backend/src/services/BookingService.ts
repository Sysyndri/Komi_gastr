import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { BookingStatus } from '@prisma/client';

/**
 * BookingService — запись на мастер-классы и мероприятия, отмена записей.
 */
export class BookingService {
  /** Запись пользователя на мастер-класс. */
  static async bookMasterClass(userId: string, masterClassId: string) {
    const mc = await prisma.masterClass.findUnique({
      where: { id: masterClassId },
      include: { _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } } },
    });

    if (!mc) throw ApiError.notFound('Мастер-класс не найден');
    if (mc.status !== 'ACTIVE') throw ApiError.badRequest('Мастер-класс недоступен для записи');
    if (mc.date.getTime() < Date.now()) throw ApiError.badRequest('Мастер-класс уже завершился');

    const alreadyBooked = await prisma.booking.findUnique({
      where: { userId_masterClassId: { userId, masterClassId } },
    });
    if (alreadyBooked && alreadyBooked.status === 'CONFIRMED') {
      throw ApiError.conflict('Вы уже записаны на этот мастер-класс');
    }

    const confirmed = mc._count.bookings;
    if (confirmed >= mc.maxParticipants) {
      throw ApiError.badRequest('Все места на мастер-класс заняты');
    }

    // Если ранее была отменённая запись — реактивируем, иначе создаём новую
    if (alreadyBooked && alreadyBooked.status === 'CANCELLED') {
      return prisma.booking.update({
        where: { id: alreadyBooked.id },
        data: { status: BookingStatus.CONFIRMED },
      });
    }
    return prisma.booking.create({ data: { userId, masterClassId } });
  }

  /** Запись пользователя на мероприятие. */
  static async bookEvent(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { eventBookings: { where: { status: 'CONFIRMED' } } } } },
    });

    if (!event) throw ApiError.notFound('Мероприятие не найдено');
    if (event.status !== 'ACTIVE') throw ApiError.badRequest('Мероприятие недоступно для записи');
    if (event.startDate.getTime() < Date.now()) throw ApiError.badRequest('Мероприятие уже завершилось');

    const alreadyBooked = await prisma.eventBooking.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (alreadyBooked && alreadyBooked.status === 'CONFIRMED') {
      throw ApiError.conflict('Вы уже записаны на это мероприятие');
    }

    if (event.maxVisitors != null && event._count.eventBookings >= event.maxVisitors) {
      throw ApiError.badRequest('Все места на мероприятие заняты');
    }

    if (alreadyBooked && alreadyBooked.status === 'CANCELLED') {
      return prisma.eventBooking.update({
        where: { id: alreadyBooked.id },
        data: { status: BookingStatus.CONFIRMED },
      });
    }
    return prisma.eventBooking.create({ data: { userId, eventId } });
  }

  /** Отмена записи на мастер-класс. */
  static async cancelBooking(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Запись не найдена');
    if (booking.userId !== userId) throw ApiError.forbidden('Нельзя отменить чужую запись');

    return prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.CANCELLED } });
  }

  /** Отмена записи на мероприятие. */
  static async cancelEventBooking(userId: string, bookingId: string) {
    const booking = await prisma.eventBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw ApiError.notFound('Запись не найдена');
    if (booking.userId !== userId) throw ApiError.forbidden('Нельзя отменить чужую запись');

    return prisma.eventBooking.update({ where: { id: bookingId }, data: { status: BookingStatus.CANCELLED } });
  }

  /** Записи пользователя (МК и мероприятия) с деталями. */
  static async getMyBookings(userId: string) {
    const [masterClasses, events] = await prisma.$transaction([
      prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          masterClass: { include: { dish: { select: { id: true, name: true } }, place: true } },
        },
      }),
      prisma.eventBooking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { event: true },
      }),
    ]);
    return { masterClasses, events };
  }
}
