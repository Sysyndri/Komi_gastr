import { z } from 'zod';

export const createPlaceSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().min(5).max(300),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  phone: z.string().regex(/^\+?[\d\s-]{7,20}$/).optional().nullable(),
  website: z.string().url().optional().nullable(),
  workHours: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  dishIds: z.array(z.string().cuid()).max(50).optional().default([]),
});

export const updatePlaceSchema = createPlaceSchema.partial();
