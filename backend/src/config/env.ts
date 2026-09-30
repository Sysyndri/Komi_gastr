import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/** Локальные адреса: в production они недопустимы как публичные URL. */
const LOCAL_HOST_RE = /localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/;

/** Разбор «1 | true | yes | on» в булево значение. */
const truthy = (value: string): boolean => ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());

/**
 * Схема валидации переменных окружения.
 * Приложение не стартует, если обязательные переменные отсутствуют.
 *
 * Отдельный слой проверок для production: публичные адреса не должны смотреть
 * на localhost, секреты — быть короче 32 символов. Это ловит типичную ошибку
 * деплоя «забыли переопределить значения из .env.example».
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    /** Интерфейс, на котором слушать API. В контейнере нужен 0.0.0.0. */
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL обязателен'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET должен быть не короче 32 символов'),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    /** Разрешённые origin для CORS, через запятую. */
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    /** Публичный адрес API, например http://85.192.20.218:4000/api. */
    API_PUBLIC_URL: z.string().default(''),
    /** 1/true — API за reverse-proxy: доверять X-Forwarded-* заголовкам. */
    TRUST_PROXY: z.string().default(''),
    /** Доступность Swagger UI. По умолчанию выключена в production. */
    SWAGGER_ENABLED: z.string().default(''),
    /**
     * Разрешить localhost в публичных адресах при NODE_ENV=production.
     * Нужно локальному прогону production-сборки (docker compose на своей
     * машине): ALLOW_LOCALHOST=true. На реальном сервере переменную оставляют
     * пустой — тогда проверки публичных адресов работают в полную силу.
     */
    ALLOW_LOCALHOST: z.string().default(''),
    /** Общий лимит запросов: окно (мс) и число на IP. См. middleware/rateLimiter.ts */
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    /** Лимит на вход/регистрацию — защита от брутфорса. */
    RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
    SEED_ADMIN_EMAIL: z.string().email().optional(),
    SEED_ADMIN_PASSWORD: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV !== 'production') return;

    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    if (!truthy(val.ALLOW_LOCALHOST)) {
      if (!val.CORS_ORIGIN || LOCAL_HOST_RE.test(val.CORS_ORIGIN)) {
        fail(
          'CORS_ORIGIN',
          'в production нужен публичный адрес фронтенда, например http://85.192.20.218:3000 (localhost запрещён; для локального docker compose задайте ALLOW_LOCALHOST=true)',
        );
      }
      if (!val.API_PUBLIC_URL) {
        fail(
          'API_PUBLIC_URL',
          'в production задайте публичный адрес API, например http://85.192.20.218:4000/api',
        );
      } else if (LOCAL_HOST_RE.test(val.API_PUBLIC_URL)) {
        fail(
          'API_PUBLIC_URL',
          'в production адрес API не может быть локальным (localhost / 127.0.0.1); для локального docker compose задайте ALLOW_LOCALHOST=true',
        );
      }
    }
    if (val.JWT_REFRESH_SECRET.length < 32) {
      fail('JWT_REFRESH_SECRET', 'в production секрет refresh-токенов должен быть не короче 32 символов');
    }
    if (val.JWT_SECRET === val.JWT_REFRESH_SECRET) {
      fail('JWT_SECRET', 'секреты access- и refresh-токенов должны различаться');
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Некорректные переменные окружения:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

/**
 * Окружение приложения: проверенные переменные + производные флаги.
 * Источники происхождения валидируются через Zod, логика «что включено в
 * production» живёт здесь, а не размазана по middleware.
 */
export const env = {
  ...raw,
  /** Нормализованный список origin, которым разрешён CORS. */
  CORS_ORIGINS: raw.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** API за reverse-proxy — брать клиентский IP из X-Forwarded-For. */
  trustProxy: truthy(raw.TRUST_PROXY),
  /** Публичные адреса указывают на localhost (локальный стенд). */
  allowLocalhost: truthy(raw.ALLOW_LOCALHOST),
  /** Публичный адрес отдаётся по HTTPS (включает HSTS и secure-куки). */
  isSecure: raw.API_PUBLIC_URL.startsWith('https://'),
  /**
   * Swagger UI (/api-docs). В production по умолчанию выключен: публичная
   * схема API облегчает подбор параметров для атак. Включается явно —
   * SWAGGER_ENABLED=true.
   */
  swaggerEnabled: raw.SWAGGER_ENABLED ? truthy(raw.SWAGGER_ENABLED) : raw.NODE_ENV !== 'production',
};

export type Env = typeof env;
