import { PrismaClient } from '@prisma/client';

/**
 * DatabaseService — единый экземпляр PrismaClient для всего приложения.
 * В тестовом окружении используется отдельный экземпляр (см. tests/setup.ts).
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export { Prisma } from '@prisma/client';
