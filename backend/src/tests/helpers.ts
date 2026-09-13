/**
 * Базовые утилиты для тестов: фабрики тестовых данных, очистка БД.
 */
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, Difficulty, Status } from '@prisma/client';

/** Полностью очищает все таблицы между тестами. */
export async function cleanDatabase(): Promise<void> {
  const tablenames = [
    'refresh_tokens',
    'event_bookings',
    'bookings',
    'events',
    'master_classes',
    '_DishPlaces',
    'dishes',
    'places',
    'users',
  ];
  for (const name of tablenames) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
  }
}

/** Создаёт пользователя с указанной ролью и возвращает его с id. */
export async function createUser(
  opts: {
    email?: string;
    password?: string;
    name?: string;
    role?: Role;
    isBlocked?: boolean;
  } = {},
) {
  const email = opts.email ?? `test-${Date.now()}-${Math.random()}@test.ru`;
  const passwordHash = await bcrypt.hash(opts.password ?? 'Password1', 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      name: opts.name ?? 'Тестовый пользователь',
      role: opts.role ?? Role.USER,
      isBlocked: opts.isBlocked ?? false,
    },
  });
}

/** Создаёт тестовое блюдо. */
export async function createDish(
  overrides: Partial<{ id: string; name: string; difficulty: Difficulty }> = {},
) {
  return prisma.dish.create({
    data: {
      name: overrides.name ?? 'Тестовое блюдо',
      description: 'Описание тестового блюда достаточной длины',
      difficulty: overrides.difficulty ?? Difficulty.EASY,
      cookingTimeMin: 30,
      ...overrides,
    },
  });
}

/** Создаёт тестовое заведение. */
export async function createPlace(overrides: Partial<{ id: string; name: string }> = {}) {
  return prisma.place.create({
    data: {
      name: overrides.name ?? 'Тестовое заведение',
      address: 'г. Тест, ул. Тестовая, 1',
      latitude: 61.0,
      longitude: 50.0,
      ...overrides,
    },
  });
}

/** Создаёт тестовый мастер-класс. */
export async function createMasterClass(
  overrides: Partial<{
    id: string;
    title: string;
    description: string;
    date: Date;
    maxParticipants: number;
    price: number;
    status: Status;
    dishId: string;
    placeId: string;
  }> = {},
) {
  const date = overrides.date ?? new Date(Date.now() + 7 * 86_400_000);
  return prisma.masterClass.create({
    data: {
      title: overrides.title ?? 'Тестовый мастер-класс',
      description: overrides.description ?? 'Описание тестового мастер-класса достаточной длины',
      date,
      durationMin: 120,
      price: overrides.price ?? 1000,
      maxParticipants: overrides.maxParticipants ?? 10,
      status: overrides.status ?? Status.ACTIVE,
      dishId: overrides.dishId,
      placeId: overrides.placeId,
    },
  });
}

/** Создаёт тестовое мероприятие. */
export async function createEvent(
  overrides: Partial<{
    id: string;
    title: string;
    description: string;
    location: string;
    startDate: Date;
    price: number;
    maxVisitors: number | null;
    status: Status;
  }> = {},
) {
  return prisma.event.create({
    data: {
      title: overrides.title ?? 'Тестовое мероприятие',
      description: overrides.description ?? 'Описание тестового мероприятия',
      startDate: overrides.startDate ?? new Date(Date.now() + 14 * 86_400_000),
      location: overrides.location ?? 'г. Тест',
      price: overrides.price ?? 0,
      maxVisitors: overrides.maxVisitors ?? 100,
      status: overrides.status ?? Status.ACTIVE,
    },
  });
}
