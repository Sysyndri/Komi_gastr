import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

/**
 * StatsService — агрегированная статистика для админ-дашборда.
 */
export class StatsService {
  /** Ключевые метрики платформы за период. */
  static async getStats(from?: Date, to?: Date) {
    const where = {
      ...(from || to
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    };

    const [users, activeUsers, dishes, places, masterClasses, events, bookings, eventBookings] =
      await prisma.$transaction([
        prisma.user.count(),
        prisma.user.count({ where: { isBlocked: false, ...where } }),
        prisma.dish.count(),
        prisma.place.count(),
        prisma.masterClass.count({ where: { status: 'ACTIVE' } }),
        prisma.event.count({ where: { status: 'ACTIVE' } }),
        prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        prisma.eventBooking.count({ where: { status: 'CONFIRMED' } }),
      ]);

    // Выручка от МК: цена * количество подтверждённых записей
    const revenueByMasterClass = await prisma.masterClass.findMany({
      select: {
        price: true,
        _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
      },
    });
    const revenue = revenueByMasterClass.reduce(
      (sum, mc) => sum + Number(mc.price) * mc._count.bookings,
      0,
    );
    const avgPrice =
      revenueByMasterClass.length > 0
        ? Math.round(
            (revenueByMasterClass.reduce((sum, mc) => sum + Number(mc.price), 0) /
              revenueByMasterClass.length) *
              100,
          ) / 100
        : 0;

    // Рост пользователей: сравниваем за два периода (последние 30 дней и предыдущие 30)
    const now = Date.now();
    const monthAgo = new Date(now - 30 * 86_400_000);
    const twoMonthsAgo = new Date(now - 60 * 86_400_000);
    const [usersLastMonth, usersPrevMonth] = await prisma.$transaction([
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: twoMonthsAgo, lt: monthAgo } } }),
    ]);
    const userGrowth =
      usersPrevMonth > 0
        ? Math.round(((usersLastMonth - usersPrevMonth) / usersPrevMonth) * 100)
        : 100;

    // Самые популярные мастер-классы
    const topMasterClasses = await prisma.masterClass.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { bookings: { _count: 'desc' } },
      take: 5,
      select: {
        id: true,
        title: true,
        date: true,
        price: true,
        _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
      },
    });

    return {
      users,
      activeUsers,
      usersLastMonth,
      userGrowth,
      dishes,
      places,
      masterClasses,
      events,
      bookings,
      eventBookings,
      totalBookings: bookings + eventBookings,
      revenue,
      avgPrice,
      topMasterClasses,
    };
  }

  /** Статистика по пользователям с ролями. */
  static async getUserStats() {
    const [admins, moderators, users, blocked] = await prisma.$transaction([
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.user.count({ where: { role: Role.MODERATOR } }),
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.user.count({ where: { isBlocked: true } }),
    ]);
    return { admins, moderators, users, blocked, total: admins + moderators + users + blocked };
  }
}
