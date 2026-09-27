import { z } from 'zod';
import { Role } from '@prisma/client';
import { emailSchema } from '../utils/validation';

const passwordSchema = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .max(100)
  .regex(/[A-Za-z]/, 'Пароль должен содержать буквы')
  .regex(/\d/, 'Пароль должен содержать цифры');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]{7,20}$/, 'Некорректный телефон')
    .optional()
    .or(z.literal('')),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Пароль обязателен'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Некорректный refresh-токен'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s-]{7,20}$/)
    .optional()
    .nullable(),
  password: passwordSchema.optional(),
});

export const roleSchema = z.object({
  role: z.enum([Role.ADMIN, Role.MODERATOR, Role.USER]),
});
