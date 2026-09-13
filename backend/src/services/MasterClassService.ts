import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { Status } from '@prisma/client';

/**
 * MasterClassService — CRUD для мастер-классов.
 */
export class MasterClassService {
  /** Список мастер-классов с фильтрами, сортировкой и пагинацией. */
  static async list(query: {
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    priceMax?: number;
    dishId?: string;
    status?: Status;
    page: number;
    limit: number;
  }) {
    const { search, dateFrom, dateTo, priceMax, dishId, status, page, limit } = query;
    const where: Prisma.MasterClassWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) where.date = { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) };
    if (priceMax !== undefined) where.price = { lte: priceMax };
    if (dishId) where.dishId = dishId;
    // Публичный контекст видит только активные; админ передаёт status явно
    where.status = status ?? Status.ACTIVE;

    const [items, total] = await prisma.$transaction([
      prisma.masterClass.findMany({
        where,
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          dish: { select: { id: true, name: true, imageUrl: true } },
          place: { select: { id: true, name: true, address: true } },
          _count: { select: { bookings: { where: { status: 'CONFIRMED' } } } },
        },
      }),
      prisma.masterClass.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /** Получение мастер-класса по id с числом свободных мест. */
  static async getById(id: string) {
    const mc = await prisma.masterClass.findUnique({
      where: { id },
      include: {
        dish: true,
        place: true,
        bookings: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });
    if (!mc) throw ApiError.notFound('Мастер-класс не найден');

    const confirmedCount = mc.bookings.filter((b) => b.status === 'CONFIRMED').length;
    const { bookings, ...rest } = mc;
    return {
      ...rest,
      bookingsCount: confirmedCount,
      availableSeats: mc.maxParticipants - confirmedCount,
    };
  }

  /** Создание мастер-класса. */
  static async create(input: Prisma.MasterClassCreateInput) {
    return prisma.masterClass.create({ data: input });
  }

  /** Обновление мастер-класса. */
  static async update(id: string, input: Prisma.MasterClassUpdateInput) {
    await this.exists(id);
    return prisma.masterClass.update({ where: { id }, data: input });
  }

  /** Удаление мастер-класса (физическое). */
  static async remove(id: string) {
    await this.exists(id);
    await prisma.masterClass.delete({ where: { id } });
  }

  /** Проверка существования. */
  static async exists(id: string) {
    const count = await prisma.masterClass.count({ where: { id } });
    if (!count) throw ApiError.notFound('Мастер-класс не найден');
  }
}
