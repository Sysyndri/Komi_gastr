import { z } from 'zod';
import { Status } from '@prisma/client';

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  location: z.string().min(3).max(300),
  price: z.coerce.number().min(0).max(1_000_000).default(0),
  maxVisitors: z.coerce.number().int().min(1).max(100_000).optional().nullable(),
  status: z.enum([Status.DRAFT, Status.ACTIVE, Status.ARCHIVED]).default(Status.ACTIVE),
  imageUrl: z.string().url().optional().nullable(),
  placeId: z.string().cuid().optional().nullable(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventQuerySchema = z.object({
  search: z.string().max(100).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  priceMax: z.coerce.number().min(0).optional(),
  status: z.enum([Status.DRAFT, Status.ACTIVE, Status.ARCHIVED]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
