import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { Status } from '@prisma/client';

/**
 * EventService — CRUD для мероприятий и фестивалей.
 */
export class EventService {
  /** Список мероприятий с фильтрами и пагинацией. */
  static async list(query: {
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    priceMax?: number;
    status?: Status;
    page: number;
    limit: number;
  }) {
    const { search, dateFrom, dateTo, priceMax, status, page, limit } = query;
    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      where.startDate = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) };
    }
    if (priceMax !== undefined) where.price = { lte: priceMax };
    where.status = status ?? Status.ACTIVE;

    const [items, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          place: { select: { id: true, name: true, address: true } },
          _count: { select: { eventBookings: { where: { status: 'CONFIRMED' } } } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /** Получение мероприятия по id. */
  static async getById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        place: true,
        eventBookings: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!event) throw ApiError.notFound('Мероприятие не найдено');

    const confirmedCount = event.eventBookings.filter((b) => b.status === 'CONFIRMED').length;
    const { eventBookings, ...rest } = event;
    return {
      ...rest,
      bookingsCount: confirmedCount,
      availableSeats: event.maxVisitors != null ? event.maxVisitors - confirmedCount : null,
    };
  }

  /** Создание мероприятия. */
  static async create(input: Prisma.EventCreateInput) {
    return prisma.event.create({ data: input });
  }

  /** Обновление мероприятия. */
  static async update(id: string, input: Prisma.EventUpdateInput) {
    await this.exists(id);
    return prisma.event.update({ where: { id }, data: input });
  }

  /** Удаление мероприятия. */
  static async remove(id: string) {
    await this.exists(id);
    await prisma.event.delete({ where: { id } });
  }

  /** Проверка существования. */
  static async exists(id: string) {
    const count = await prisma.event.count({ where: { id } });
    if (!count) throw ApiError.notFound('Мероприятие не найдено');
  }
}
