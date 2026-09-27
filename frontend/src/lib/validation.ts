/**
 * Клиентская валидация учётных данных.
 *
 * Правила повторяют серверные схемы (backend/src/schemas/auth.schema.ts),
 * чтобы пользователь видел ошибку до запроса к API.
 */

/** Минимальная длина пароля (совпадает с серверной схемой). */
export const PASSWORD_MIN_LENGTH = 8;
/** Максимальная длина пароля (совпадает с серверной схемой). */
export const PASSWORD_MAX_LENGTH = 100;

/**
 * Формат email: обязательны локальная часть, символ «@» и домен с точкой.
 * Совпадает по смыслу с zod `.email()`.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const ERROR_EMAIL_REQUIRED = "Укажите email";
export const ERROR_EMAIL_INVALID =
  "Некорректный email: нужен формат name@domain.ru";
export const ERROR_PASSWORD_REQUIRED = "Укажите пароль";
export const ERROR_PASSWORD_SHORT = `Пароль должен содержать минимум ${PASSWORD_MIN_LENGTH} символов`;
export const ERROR_PASSWORD_LONG = `Пароль должен содержать не более ${PASSWORD_MAX_LENGTH} символов`;
export const ERROR_PASSWORD_LETTERS = "Пароль должен содержать буквы";
export const ERROR_PASSWORD_DIGITS =
  "Пароль должен содержать хотя бы одну цифру";

/** Возвращает текст ошибки или undefined, если email корректен. */
export function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return ERROR_EMAIL_REQUIRED;
  if (!EMAIL_PATTERN.test(value)) return ERROR_EMAIL_INVALID;
  return undefined;
}

/**
 * Проверка пароля для входа: только факт заполнения.
 * Требования к сложности проверяются при регистрации и смене пароля.
 */
export function validateLoginPassword(password: string): string | undefined {
  if (!password) return ERROR_PASSWORD_REQUIRED;
  return undefined;
}

/**
 * Проверка пароля при регистрации/смене: длина, буквы и цифры.
 * Возвращает первую найденную ошибку или undefined.
 */
export function validatePassword(password: string): string | undefined {
  if (!password) return ERROR_PASSWORD_REQUIRED;
  if (password.length < PASSWORD_MIN_LENGTH) return ERROR_PASSWORD_SHORT;
  if (password.length > PASSWORD_MAX_LENGTH) return ERROR_PASSWORD_LONG;
  if (!/[A-Za-z]/.test(password)) return ERROR_PASSWORD_LETTERS;
  if (!/\d/.test(password)) return ERROR_PASSWORD_DIGITS;
  return undefined;
}

/** Требования к паролю — для подсказки под полем. */
export const PASSWORD_HINT = `Минимум ${PASSWORD_MIN_LENGTH} символов, обязательно буквы и цифры`;

/** Имя: минимум 2 символа, допускаются буквы (кириллица/латиница), дефис и пробел. */
export const NAME_PATTERN = /^[A-Za-zА-Яа-яЁё][-A-Za-zА-Яа-яЁё\s]{1,99}$/;

/** Телефон: необязательное поле в формате +7 912 345-67-89. */
export const PHONE_PATTERN = /^\+?[\d\s-]{7,20}$/;

export const ERROR_NAME_INVALID = "Имя должно содержать минимум 2 буквы";
export const ERROR_PHONE_INVALID =
  "Некорректный телефон: допустимы цифры, +, пробел и дефис";

/** Проверка имени. */
export function validateName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return ERROR_NAME_INVALID;
  if (!NAME_PATTERN.test(name)) return ERROR_NAME_INVALID;
  return undefined;
}

/** Проверка телефона (пустое значение допустимо — поле необязательное). */
export function validatePhone(value: string): string | undefined {
  const phone = value.trim();
  if (!phone) return undefined;
  if (!PHONE_PATTERN.test(phone)) return ERROR_PHONE_INVALID;
  return undefined;
}

/**
 * Обязательный текстовый поле заданной длины (название, описание, заголовок).
 * @param value проверяемое значение
 * @param field название поля для сообщения
 * @param min минимальная длина
 * @param max максимальная длина
 */
export function validateRequired(
  value: string,
  field: string,
  min = 1,
  max = Number.POSITIVE_INFINITY,
): string | undefined {
  const text = value.trim();
  if (!text) return `${field}: укажите значение`;
  if (text.length < min) return `${field}: минимум ${min} символов`;
  if (Number.isFinite(max) && text.length > max)
    return `${field}: максимум ${max} символов`;
  return undefined;
}

/** Цена: неотрицательное число с не более чем двумя знаками после запятой. */
export const PRICE_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

export function validatePrice(
  value: string,
  field = "Цена",
): string | undefined {
  const text = value.trim();
  if (!text) return `${field}: укажите значение`;
  if (!PRICE_PATTERN.test(text))
    return `${field}: допускается только положительное число с не более чем двумя знаками после запятой`;
  return undefined;
}

/** Число участников: целое положительное число. */
export const CAPACITY_PATTERN = /^[1-9]\d*$/;

export function validateCapacity(
  value: string,
  field = "Максимальное число участников",
): string | undefined {
  const text = value.trim();
  if (!text) return `${field}: укажите значение`;
  if (!CAPACITY_PATTERN.test(text))
    return `${field}: должно быть целым и больше нуля`;
  return undefined;
}

/**
 * Дата начала: не в прошлом и не дальше одного года вперёд.
 * @param value строка `datetime-local`
 * @param now текущий момент (для детерминированных тестов)
 */
export function validateEventDate(
  value: string,
  now: Date = new Date(),
): string | undefined {
  if (!value) return "Укажите дату";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Некорректная дата";
  if (date.getTime() < now.getTime()) return "Дата не может быть в прошлом";
  const maxMs = 365 * 24 * 60 * 60 * 1000;
  if (date.getTime() > now.getTime() + maxMs)
    return "Дата не может быть позже, чем через год";
  return undefined;
}

/**
 * Дата окончания позже даты начала.
 * @param end значение `datetime-local` окончания
 * @param start значение `datetime-local` начала
 */
export function validateEventDateEnd(
  end: string,
  start: string,
): string | undefined {
  if (!end) return "Укажите дату окончания";
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) return "Некорректная дата";
  if (!start) return undefined;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return undefined;
  if (endDate.getTime() <= startDate.getTime())
    return "Дата окончания должна быть позже даты начала";
  return undefined;
}

/**
 * Текст отзыва: от 10 до 1000 символов.
 * @param value текст отзыва
 */
export function validateReviewComment(value: string): string | undefined {
  const text = value.trim();
  if (!text) return "Введите текст отзыва";
  if (text.length < 10) return "Отзыв должен содержать минимум 10 символов";
  if (text.length > 1000)
    return "Отзыв должен содержать не более 1000 символов";
  return undefined;
}

/**
 * Оценка от 1 до 5.
 * @param value числовая оценка
 */
export function validateRating(value: number): string | undefined {
  if (!Number.isInteger(value) || value < 1 || value > 5)
    return "Оценка должна быть от 1 до 5";
  return undefined;
}

/**
 * Телефон для брони: 7–20 символов, разрешены цифры и `+ - ( )`.
 * @param value введённый телефон
 */
export function validateBookingPhone(value: string): string | undefined {
  const text = value.trim();
  if (!text) return "Введите контактный телефон";
  if (!/^\+?[\d\s()-]{7,20}$/.test(text))
    return "Телефон должен содержать от 7 до 20 символов: цифры и +7 () -";
  return undefined;
}
