import { z } from 'zod';
import { Status } from '@prisma/client';

export const createMasterClassSchema = z.object({
  title: z.string().min(3).max(200),
  shortDescription: z.string().max(300).optional().nullable(),
  description: z.string().min(10).max(5000),
  date: z.coerce.date().refine((d) => d.getTime() > Date.now() - 5 * 60 * 1000, {
    message: 'Дата мастер-класса не может быть в прошлом',
  }),
  durationMin: z.coerce.number().int().min(15).max(600),
  price: z.coerce.number().min(0).max(1_000_000),
  maxParticipants: z.coerce.number().int().min(1).max(1000),
  status: z.enum([Status.DRAFT, Status.ACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
  imageUrl: z.string().url().optional().nullable(),
  dishId: z.string().cuid().optional().nullable(),
  placeId: z.string().cuid().optional().nullable(),
});

export const updateMasterClassSchema = createMasterClassSchema.partial();

export const masterClassQuerySchema = z.object({
  search: z.string().max(100).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  priceMax: z.coerce.number().min(0).optional(),
  dishId: z.string().cuid().optional(),
  status: z.enum([Status.DRAFT, Status.ACTIVE, Status.ARCHIVED]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
