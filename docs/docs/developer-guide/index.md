# Руководство разработчика

## Требования

- Node.js >= 20
- Docker (для PostgreSQL)
- Python >= 3.10 (только для локального запуска документации)

## Запуск проекта

### 1. База данных

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # DATABASE_URL, JWT_*, SEED_* (см. .env.example)
npm install
npx prisma migrate dev
npm run seed
npm run dev                 # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:3000
```

Запросы браузера уходят на `/api` (тот же origin), а `src/middleware.ts`
проксирует их на backend по `API_INTERNAL_URL` — по умолчанию
`http://localhost:4000/api`. Поэтому CORS в разработке не нужен и поведение
совпадает с docker-стендом.

Переменные окружения фронтенда:

| Переменная                        | Описание                                                                                                                                                                                                                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`             | Базовый URL API. Всегда относительный `/api`: браузер обращается к тому же origin, а `src/middleware.ts` проксирует запрос на backend (`API_INTERNAL_URL`). Один и тот же образ работает и локально, и на сервере. Для локального `npm run dev` значение то же — `/api` из `frontend/.env` |
| `API_INTERNAL_URL`                | Внутренний адрес backend для прокси middleware: локально `http://localhost:4000/api`, в `docker-compose.yml` — `http://backend:4000/api` |
| `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` | Ключ JS API Яндекс.Карт 3.0 (получить в [Кабинете разработчика](https://developer.tech.yandex.com/), сервис «JavaScript API и HTTP Геокодер»). Без ключа карта заменяется списком заведений                                                                                                                        |

#### Настройка ключа Яндекс.Карт (обязательно)

JS API 3.0 работает **только** с ключами, у которых заполнено поле
«Ограничение по HTTP Referer». Иначе API отвечает `403 Forbidden` и карта не грузится.

1. Зайдите в [Кабинет разработчика](https://developer.tech.yandex.ru/).
2. Выберите ключ → **Изменить**.
3. В поле «Ограничение по HTTP Referer» укажите домены, каждый с новой строки:

   ```
   localhost
   127.0.0.1
   85.192.20.218
   ```

   Для продакшена добавьте домен сайта и/или IP сервера (например
   `85.192.20.218`), поддерживаются маски вроде `*.mydomain.ru`. **Список должен
   совпадать с тем, как реально открывают сайт** — если сервер доступен по IP,
   одного `localhost` в ключе недостаточно.

4. Сохраните — изменения вступают в силу **через 15 минут**.

Частые причины ошибки 403:

- не заполнено ограничение по Referer (обязательное требование JS API 3.0);
- открыт `http://127.0.0.1:3000`, а в ограничениях указан только `localhost`;
- сайт открывают по IP/домену сервера, которого нет в ограничениях (типичная
  причина «локально карта есть, на сервере нет»);
- в образ вшит старый/чужой ключ (например, сервер собран с ключом из другого
  окружения): проверьте, что значение ключа на сервере совпадает с тем, что
  указано в кабинете;
- ключ создан менее 15 минут назад (время активации);
- ключ не из пакета «JavaScript API и HTTP Геокодер».

**Как это выглядит в браузере:** в ответ на загрузчик Яндекс присылает JSON с
ошибкой `403`, а браузер блокирует его как не-JS — в консоли видно
`net::ERR_BLOCKED_BY_ORB`. Это следствие запрета по Referer, а не проблема CSP
(хосты `api-maps.yandex.ru`/`yastatic.net` в `next.config.js` уже разрешены).

После изменения `NEXT_PUBLIC_*`-переменных контейнер frontend нужно пересобрать:
`docker-compose up -d --build frontend` (значения вшиваются на этапе сборки).
Смена только ограничений ключа в кабинете пересборки не требует.

## Архитектура

```
┌─────────────────┐        ┌──────────────────┐        ┌────────────┐
│    Frontend     │  HTTP  │     Backend      │  Prisma │ PostgreSQL │
│ Next.js 14 + TS │ ─────▶ │ Express + Zod    │ ──────▶ │            │
└─────────────────┘        └──────────────────┘        └────────────┘
```

### Backend

```
backend/src/
├── app.ts                 # Express-приложение (middleware, роуты)
├── index.ts               # Точка входа
├── config/env.ts          # Валидация переменных окружения (Zod)
├── middleware/            # errorHandler, auth, requireRoles, validate, rateLimiter
├── routes/                # auth, dishes, places, masterclasses, events, bookings, search, admin, stats
├── services/              # бизнес-логика (AuthService, BookingService, ...)
├── controllers/           # HTTP-слой
├── schemas/               # Zod-схемы запросов
└── utils/                 # JWT, API-ответы, логгер
```

**Ключевые решения:**

- `validate` использует `safeParse` → единый код ошибки `VALIDATION_ERROR`;
- `requireRoles()` — гибкая проверка ролей;
- refresh-токены хранятся в БД с уникальным `jti`;
- централизованный `errorHandler` различает Prisma / Zod / API ошибки;
- экспорт CSV в `/api/admin/*/export`.

### Frontend

```
frontend/src/
├── app/                   # Next.js App Router (страницы)
├── components/
│   ├── ui/                # атомы (Button, Input, Card, Modal, Badge, ...)
│   ├── molecules/         # карточки, формы, поиск
│   └── organisms/         # Navigation, списки, админ-меню, карта
├── hooks/                 # useAuth, useDishes, useMasterClasses, ...
└── lib/                   # api-client (fetch + refresh), сервисы API
```

**Ключевые решения:**

- клиент API автоматически подставляет Bearer-токен и обновляет его при `401`;
- backend дополнительно ставит HttpOnly cookie с access-токеном: её читает
  `middleware.ts`, из JavaScript значение недоступно;
- TanStack Query: кэширование 5 минут, инвалидация после мутаций;
- `middleware.ts` защищает `/profile` и `/admin` на уровне сервера, причём роль
  для `/admin` подтверждается запросом к API (`/auth/me`), а не клиентской cookie;
- палитра Tailwind: `primary` (тёмно-зелёный), `nordic` (синий), `accent` (янтарный).

### Карта (Yandex Maps JS API 3.0)

Работа с картой вынесена в `frontend/src/lib/yandex-map.ts` и реализована
строго по [официальной документации](https://yandex.ru/maps-api/docs/js-api/dg/concepts/load.html):

- API подключается динамически скриптом `https://api-maps.yandex.ru/v3/?apikey=KEY&lang=ru_RU`
  (один раз на страницу, повторные вызовы возвращают кэшированный промис);
- компоненты доступны после резолва `ymaps3.ready`;
- карта — `new YMap(container, { location: { center, zoom } })` со слоями
  `YMapDefaultSchemeLayer` + `YMapDefaultFeaturesLayer` и контролем зума из
  пакета `@yandex/ymaps3-controls`;
- метки — `new YMapMarker({ coordinates }, htmlElement)` с кастомным DOM.

Добавление/удаление точек:

```ts
const placesMap = new PlacesMap(container, { onClick: (point) => {...} });
await placesMap.init();               // загрузка API + создание карты

placesMap.setPoints(points);          // добавить новые метки
placesMap.setPoints(points.filter(/* ... */)); // убрать часть меток
placesMap.setPoints([]);              // убрать все метки
placesMap.panTo(lon, lat);            // плавно центрировать по точке
```

`setPoints` сам вычисляет разницу с текущими метками (по `id`) и добавляет/удаляет
только изменённые — компоненту `MapComponent` достаточно передать новый массив `places`.
Типизация — официальный пакет `@yandex/ymaps3-types` (подключён через `compilerOptions.types`).

## Деплой в production (сервер 85.192.20.218)

```bash
cp .env.example .env    # заполнить секреты и публичные адреса, ALLOW_LOCALHOST=false
bash deploy.sh          # сборка → запуск → health-check → наполнение базы
```

`deploy.sh` проверяет Docker и обязательные переменные, применяет миграции
(их выполняет контейнер backend при старте), дожидается `/api/health`, а затем
запускает `npm run seed` в контейнере backend — без этого шага в базе нет ни
пользователей, ни администратора. Пропустить наполнение: `SKIP_SEED=1 bash deploy.sh`.

### Контракт адресов

| Переменная       | Пример для сервера              | Что делает                                                 |
| ---------------- | ------------------------------- | ---------------------------------------------------------- |
| `SITE_URL`       | `http://85.192.20.218:3000`     | публичный адрес фронтенда: `metadataBase`, флаг HTTPS/HSTS |
| `CORS_ORIGIN`    | `http://85.192.20.218:3000`     | разрешённые origin в backend (список через запятую)        |
| `API_PUBLIC_URL` | `http://85.192.20.218:4000/api` | публичный адрес API: логи запуска, HSTS, ссылка на Swagger |

`NEXT_PUBLIC_API_URL` в `.env` не задаётся: фронтенд собирается с относительным
`/api`, а `frontend/src/middleware.ts` проксирует запросы на backend по
`API_INTERNAL_URL` (`http://backend:4000/api` в compose). Поэтому один и тот же
образ работает и локально, и на сервере, а при переезде пересборка не нужна.

`SITE_URL`, `CORS_ORIGIN` и `API_PUBLIC_URL` обязательны. При
`NODE_ENV=production` backend отвергает `localhost` / `127.0.0.1` / `0.0.0.0` в
`CORS_ORIGIN` и `API_PUBLIC_URL` (`backend/src/config/env.ts`) — так ловится
деплой с забытыми адресами. Для локального стенда без домена проверка
отключается флагом `ALLOW_LOCALHOST=true` (см. `.env.example`).

### Что важно знать

1. **`NEXT_PUBLIC_*` фиксируются при сборке образа** (`NEXT_PUBLIC_SITE_NAME`,
   `NEXT_PUBLIC_SITE_TAGLINE`, ключ Яндекс.Карт). Сменили их — пересоберите
   frontend (`docker compose build --no-cache frontend`), перезапуск не поможет.
   Адресов это не касается: API ходит через относительный `/api`.
2. **Порты.** Frontend — `3000`, API — `4000`, PostgreSQL — **только `127.0.0.1`**
   (извне закрыт), документация MkDocs — **только `127.0.0.1`**.
3. **Swagger UI в production выключен** (`SWAGGER_ENABLED=false`). Включить для
   отладки: `SWAGGER_ENABLED=true docker compose up -d backend` — он открывается на
   порту API (`http://85.192.20.218:4000/api-docs`), а не на 3000.
4. **Заголовки безопасности.** Frontend отдаёт CSP из `next.config.js` (разрешены
   origin API и хосты Яндекс.Карт), backend — CSP из `helmet` в `src/app.ts`.
   `upgrade-insecure-requests` намеренно не включён: сервер работает по HTTP без
   TLS. HSTS отдаётся только если адрес начинается с `https://`.
5. **Остановку контейнеров приложение переносит корректно**: SIGTERM →
   `server.close()` → отключение Prisma, максимум 15 секунд
   (`backend/src/index.ts`).
6. **Логгирование ограничено** `json-file` с ротацией 10 МБ × 3 файла, поэтому диск
   на сервере не переполняется.

### Резервные копии

```bash
# Дамп базы (пароль берётся из .env — POSTGRES_PASSWORD)
set -a; . ./.env; set +a
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > backup.sql.gz

# Восстановление
gunzip -c backup.sql.gz | docker compose exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" --single-transaction -q
```

`backup.sql.gz` и `.env` (секреты) вместе с репозиторием — всё, что нужно для
восстановления сервиса на новом сервере.

## Тестирование

### Backend (coverage ≥ 80/75/80/80)

```bash
cd backend
npm run test:unit           # юнит-тесты сервисов
npm run test:integration    # интеграционные тесты API
npm test                    # все + coverage
```

### Frontend (coverage ≥ 70/50/70/70)

```bash
cd frontend
npm test                    # Jest + React Testing Library
npx playwright test         # E2E (требуется запущенное приложение)
```

### Структура тестов

```
backend/tests/
├── unit/                   # AuthService, BookingService, utils, errorHandler
└── integration/            # auth, masterclasses, bookings, admin, search, content

frontend/src/tests/
├── hooks/                  # usePagination, useSearch
├── components/             # ui, molecules, organisms, modal, ErrorBoundary
└── pages/                  # login (RTL)
```

## API

- Swagger UI (в dev): `http://localhost:4000/api-docs`
- OpenAPI-спецификация: `docs/api/openapi.yaml`
- Документация по API: раздел **API** этого сайта.

## Полезные команды

```bash
# Backend
npm run prisma:generate     # сгенерировать Prisma Client
npm run prisma:deploy       # применить миграции (production)
npm run db:reset            # сброс БД (только dev!)
npm run seed                # наполнение демо-данными

# Frontend
npm run lint                # ESLint
npm run typecheck           # проверка типов
npm run build               # production-сборка

# Docker
docker compose up -d --build          # весь стек
docker compose down                   # остановить (без -v: том с БД сохраняется)
docker compose exec backend npm run seed   # пере-наполнить базу демо-данными
```
