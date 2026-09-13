import { prisma } from '../lib/prisma';

/**
 * SearchService — полнотекстовый поиск по блюдам, мастер-классам и
 * мероприятиям с ограничением результатов.
 *
 * Поиск ведётся по названию и описанию (без учёта регистра).
 */
export class SearchService {
  static async search(query: string, limit = 10) {
    const q = query.trim();
    if (!q) {
      return { dishes: [], masterClasses: [], events: [] };
    }

    const [dishes, masterClasses, events] = await prisma.$transaction([
      prisma.dish.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { nameKomi: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } },
          ],
        },
        take: limit,
        include: { places: { select: { id: true, name: true } } },
      }),
      prisma.masterClass.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { dish: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take: limit,
        include: {
          dish: { select: { id: true, name: true } },
          place: { select: { id: true, name: true } },
        },
      }),
      prisma.event.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        include: { place: { select: { id: true, name: true } } },
      }),
    ]);

    return { dishes, masterClasses, events };
  }
}
