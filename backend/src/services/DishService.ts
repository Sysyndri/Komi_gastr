import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { Difficulty } from '@prisma/client';

/**
 * DishService — CRUD для блюд национальной кухни.
 */
export class DishService {
  /** Список блюд с фильтрацией, сортировкой и пагинацией. */
  static async list(query: {
    search?: string;
    category?: string;
    difficulty?: Difficulty;
    sort?: string;
    page: number;
    limit: number;
  }) {
    const { search, category, difficulty, sort, page, limit } = query;
    const where: Prisma.DishWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameKomi: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = { equals: category, mode: 'insensitive' };
    if (difficulty) where.difficulty = difficulty;

    const orderBy: Prisma.DishOrderByWithRelationInput =
      sort === 'name' ? { name: 'asc' } : sort === 'newest' ? { createdAt: 'desc' } : { isPinned: 'desc' };

    const [items, total] = await prisma.$transaction([
      prisma.dish.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { places: { select: { id: true, name: true } } },
      }),
      prisma.dish.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /** Получение блюда по id. */
  static async getById(id: string) {
    const dish = await prisma.dish.findUnique({
      where: { id },
      include: { places: true, masterClasses: { where: { status: 'ACTIVE' } } },
    });
    if (!dish) throw ApiError.notFound('Блюдо не найдено');
    return dish;
  }

  /** Создание блюда. */
  static async create(input: Prisma.DishCreateInput & { placeIds?: string[] }) {
    const { placeIds, ...data } = input;
    return prisma.dish.create({
      data: {
        ...data,
        ...(placeIds && placeIds.length ? { places: { connect: placeIds.map((id) => ({ id })) } } : {}),
      },
      include: { places: { select: { id: true, name: true } } },
    });
  }

  /** Обновление блюда. */
  static async update(id: string, input: Partial<Prisma.DishUpdateInput> & { placeIds?: string[] }) {
    const { placeIds, ...data } = input;
    await this.exists(id);
    return prisma.dish.update({
      where: { id },
      data: {
        ...data,
        ...(placeIds ? { places: { set: placeIds.map((pid) => ({ id: pid })) } } : {}),
      },
      include: { places: { select: { id: true, name: true } } },
    });
  }

  /** Удаление блюда. */
  static async remove(id: string) {
    await this.exists(id);
    await prisma.dish.delete({ where: { id } });
  }

  /** Проверяет существование блюда, иначе 404. */
  static async exists(id: string) {
    const count = await prisma.dish.count({ where: { id } });
    if (!count) throw ApiError.notFound('Блюдо не найдено');
  }
}
