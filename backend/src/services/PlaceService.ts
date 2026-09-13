import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';

/**
 * PlaceService — CRUD для заведений.
 */
export class PlaceService {
  static async list(search?: string) {
    const where: Prisma.PlaceWhereInput = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { address: { contains: search, mode: 'insensitive' } }] }
      : {};
    return prisma.place.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { dishes: true, masterClasses: true } } },
    });
  }

  static async getById(id: string) {
    const place = await prisma.place.findUnique({
      where: { id },
      include: { dishes: true, masterClasses: { where: { status: 'ACTIVE' } }, events: { where: { status: 'ACTIVE' } } },
    });
    if (!place) throw ApiError.notFound('Заведение не найдено');
    return place;
  }

  static async create(input: Prisma.PlaceCreateInput & { dishIds?: string[] }) {
    const { dishIds, ...data } = input;
    return prisma.place.create({
      data: {
        ...data,
        ...(dishIds && dishIds.length ? { dishes: { connect: dishIds.map((id) => ({ id })) } } : {}),
      },
    });
  }

  static async update(id: string, input: Partial<Prisma.PlaceUpdateInput> & { dishIds?: string[] }) {
    const { dishIds, ...data } = input;
    await this.exists(id);
    return prisma.place.update({
      where: { id },
      data: {
        ...data,
        ...(dishIds ? { dishes: { set: dishIds.map((did) => ({ id: did })) } } : {}),
      },
    });
  }

  static async remove(id: string) {
    await this.exists(id);
    await prisma.place.delete({ where: { id } });
  }

  static async exists(id: string) {
    const count = await prisma.place.count({ where: { id } });
    if (!count) throw ApiError.notFound('Заведение не найдено');
  }
}
