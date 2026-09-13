import { z } from 'zod';

export const bookingParamSchema = z.object({
  id: z.string().cuid('Некорректный идентификатор мастер-класса'),
});
