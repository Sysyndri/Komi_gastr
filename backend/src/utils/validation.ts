import { z } from 'zod';

/**
 * Единое поле email для всех схем.
 *
 * Нормализует значение (обрезка пробелов и перевод в нижний регистр) до
 * проверки формата, поэтому "Admin@Example.RU " и "admin@example.ru"
 * считаются одним и тем же адресом на уровне валидации.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email обязателен")
  .max(254, "Email слишком длинный")
  .email("Некорректный email");

/** Нормализация email вне zod-схем (тесты, сервисы). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}