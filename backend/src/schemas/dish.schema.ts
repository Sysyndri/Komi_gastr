import { z } from 'zod';
import { Difficulty } from '@prisma/client';

export const createDishSchema = z.object({
  name: z.string().min(2).max(150),
  nameKomi: z.string().max(150).optional().nullable(),
  description: z.string().min(10, 'Описание должно быть не короче 10 символов').max(2000),
  history: z.string().max(3000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  difficulty: z.enum([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]).default(Difficulty.MEDIUM),
  cookingTimeMin: z.coerce.number().int().min(1).max(1440),
  recipe: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
  imageUrl: z.string().url().optional().nullable(),
  isPinned: z.boolean().optional().default(false),
  placeIds: z.array(z.string().cuid()).max(20).optional().default([]),
});

export const updateDishSchema = createDishSchema.partial();

export const dishQuerySchema = z.object({
  search: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum([Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]).optional(),
  sort: z.enum(['popular', 'newest', 'name']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const idParamSchema = z.object({
  id: z.string().cuid('Некорректный идентификатор'),
});
