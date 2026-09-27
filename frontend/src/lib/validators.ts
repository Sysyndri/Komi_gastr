/**
 * Полевые валидаторы форм.
 *
 * Правила сознательно дублируют zod-схемы backend, чтобы пользователь видел
 * ошибку до запроса, а не после 400-го ответа. Каждый валидатор возвращает
 * текст ошибки или пустую строку, если значение корректно.
 */

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

/** Значение корректно (ошибок нет). */
export const OPTIONAL_OK = "";

/** Совпадает с backend: телефон — 6-20 цифр, допускается «+», пробелы, скобки. */
export const PHONE_REGEX = /^\+?[\d\s\-()]{6,20}$/;
export const PHONE_HINT =
  "Телефон: от 6 до 20 цифр, можно «+», пробелы и скобки";

/** Совпадает с backend: минимальная длина пароля. */
export const PASSWORD_MIN = 8;
export const PASSWORD_HINT = `Минимум ${PASSWORD_MIN} символов`;

/** Поле обязательно и не должно состоять только из пробелов. */
export function required(value: string, message = "Обязательное поле"): string {
  return value.trim() ? OPTIONAL_OK : message;
}

/** Диапазон длины текста (без учёта пробелов по краям). */
export function length(
  value: string,
  min: number,
  max: number,
  unit = "символов",
): string {
  const v = value.trim();
  if (v.length < min) return `Минимум ${min} ${unit}`;
  if (v.length > max) return `Максимум ${max} ${unit}`;
  return OPTIONAL_OK;
}

/** Целое число в диапазоне. */
export function numberRange(
  value: string,
  min: number,
  max: number,
  isRequired = true,
): string {
  if (!value.trim())
    return isRequired ? `Укажите значение от ${min} до ${max}` : OPTIONAL_OK;
  const num = Number(value);
  if (!Number.isFinite(num)) return "Введите число";
  if (!Number.isInteger(num)) return "Введите целое число";
  if (num < min || num > max) return `Значение должно быть от ${min} до ${max}`;
  return OPTIONAL_OK;
}

/** Дата в будущем (значения input type="datetime-local"). */
export function futureDate(value: string): string {
  if (!value.trim()) return "Укажите дату и время";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Некорректная дата";
  if (date.getTime() <= Date.now()) return "Дата должна быть в будущем";
  return OPTIONAL_OK;
}

export const validators = {
  /** Имя гостя / ФИО пользователя. */
  fullName: (v: string) => required(v) || length(v, 2, 100),

  email: (v: string) =>
    required(v, "Укажите e-mail") ||
    (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? OPTIONAL_OK
      : "Некорректный e-mail"),

  password: (v: string) =>
    required(v, "Укажите пароль") ||
    (v.length < PASSWORD_MIN
      ? `Минимум ${PASSWORD_MIN} символов`
      : OPTIONAL_OK),

  /** Пароль в форме входа: не подсказываем правила для старых аккаунтов. */
  loginPassword: (v: string) => required(v, "Укажите пароль"),

  passwordConfirm: (v: string, password = ""): string =>
    required(v, "Повторите пароль") ||
    (v === password ? OPTIONAL_OK : "Пароли не совпадают"),

  /** Телефон необязателен, но если указан — только в корректном формате. */
  phone: (v: string) =>
    !v.trim()
      ? OPTIONAL_OK
      : PHONE_REGEX.test(v.trim())
        ? OPTIONAL_OK
        : PHONE_HINT,

  title: (v: string) => required(v, "Укажите название") || length(v, 3, 120),

  description: (v: string) => required(v) || length(v, 10, 5000),

  shortDescription: (v: string) => (v.trim() ? length(v, 3, 160) : OPTIONAL_OK),

  address: (v: string) => required(v) || length(v, 5, 200),

  capacity: (v: string) => numberRange(v, 1, 1000),

  date: futureDate,

  durationMin: (v: string) => numberRange(v, 15, 600),

  price: (v: string) => numberRange(v, 0, 10000000),

  maxParticipants: (v: string) => numberRange(v, 1, 1000),

  coordinates: (v: string) => {
    const trimmed = v.trim();
    if (!trimmed) return OPTIONAL_OK;
    const parts = trimmed.split(",");
    if (parts.length !== 2) return "Формат: широта, долгота (через запятую)";
    const [lat, lng] = parts.map((part) => Number(part.trim()));
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
      return "Широта и долгота — числа";
    if (Math.abs(lat) > 90) return "Широта: от -90 до 90";
    if (Math.abs(lng) > 180) return "Долгота: от -180 до 180";
    return OPTIONAL_OK;
  },
} as const;

export type ValidatorFn = (value: string) => string;

export type ValidatorSpec<T extends string> = Array<{
  field: T;
  validate: ValidatorFn;
}>;

/**
 * Проверка набора полей: в карту попадают только поля с ошибками.
 */
export function validateFields<T extends string>(
  values: Record<T, string>,
  spec: ValidatorSpec<T>,
): FieldErrors<T> {
  const errors: FieldErrors<T> = {};
  for (const { field, validate } of spec) {
    const error = validate(values[field] ?? "");
    if (error) errors[field] = error;
  }
  return errors;
}

/** Есть ли хотя бы одна ошибка. */
export function hasErrors<T extends string>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}
