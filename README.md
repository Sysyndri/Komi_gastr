# Гастрономия Коми 🥟

Цифровая платформа для популяризации национальной кухни Республики Коми:
каталог блюд, заведения, мастер-классы, мероприятия и запись на них.

## Состав монорепозитория

```
/
├── backend/          # REST API (Node.js + Express + Prisma + PostgreSQL)
├── frontend/         # Веб-приложение (Next.js 14 + TypeScript + TailwindCSS)
├── docs/             # Пользовательская, административная и техническая документация
├── docker-compose.yml
└── README.md
```

## Быстрый старт (Docker)

```bash
# 1. Скопируйте шаблон и заполните секреты (пароль БД, JWT-секреты, seed-аккаунты)
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_REFRESH_SECRET

# 2. Сборка, запуск и наполнение базы одной командой
bash deploy.sh
# либо вручную:
#   docker compose up -d --build
#   docker compose exec backend npm run seed
```

Без заполненного `.env` стек не стартует: `docker-compose.yml` не содержит
значений секретов по умолчанию. Учётные записи администратора и демо-пользователя
заводятся переменными `SEED_*` и описаны во внутренних заметках
`DEVELOPER_NOTES.md` (файл в git не попадает).

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:4000/api>
- Swagger UI: <http://localhost:4000/api-docs> — только при `SWAGGER_ENABLED=true`
  (в production по умолчанию выключен)
- Документация MkDocs: <http://localhost:8000>

### Один и тот же стек локально и на сервере

Compose-файл и docker-образы не меняются — отличается только блок «Публичные
адреса» в `.env`:

| Переменная       | Локально                    | На сервере      |
| ---------------- | --------------------------- | --------------- |
| `ALLOW_LOCALHOST`| `true`                      | `false`         |
| `SITE_URL`       | `http://localhost:3000`     | публичный адрес |
| `CORS_ORIGIN`    | `http://localhost:3000`     | = `SITE_URL`    |
| `API_PUBLIC_URL` | `http://localhost:4000/api` | публичный адрес |

`ALLOW_LOCALHOST=true` разрешает `localhost` в публичных адресах при
`NODE_ENV=production` — это нужно только локальному стенду. На сервере флаг
обязателен в положении `false`: тогда забытая замена адреса ловится при старте.

`NEXT_PUBLIC_API_URL` намеренно не задаётся: фронтенд собирается с относительным
`/api` и ходит через `middleware.ts` того же origin (адрес backend внутри сети
контейнеров — `API_INTERNAL_URL=http://backend:4000/api`). Поэтому образ не
зависит от адреса сервера, CORS не нужен, а переезд не требует пересборки.


## Локальная разработка

Требования: Node.js >= 20, Docker (для PostgreSQL).

```bash
# База данных
docker compose up -d postgres

# Backend (порт 4000)
cd backend
npm install
cp .env.example .env           # DATABASE_URL (пароль из POSTGRES_PASSWORD), JWT_*, SEED_*
npx prisma migrate dev
npm run seed                   # требует SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
npm run dev

# Frontend (порт 3000)
cd frontend
npm install
npm run dev
```

Фронтенд обращается к `/api` на своём же origin, а `src/middleware.ts` проксирует
запросы на backend по `API_INTERNAL_URL` (по умолчанию `http://localhost:4000/api`).
Поэтому CORS в разработке не нужен, а поведение совпадает с docker-стендом.

## Документация

| Раздел               | Путь                    |
| -------------------- | ----------------------- |
| Пользовательская     | `docs/user-guide/`      |
| Административная     | `docs/admin-guide/`     |
| Для разработчиков    | `docs/developer-guide/` |
| OpenAPI спецификация | `docs/api/openapi.yaml` |

## Тесты

```bash
# Backend: unit + integration — jest.config.js требует >= 80/75/80/80
# (последний прогон: 91.8% stmts / 75.4% branch / 90.6% func / 94.2% lines)
cd backend && npm test

# Frontend: unit + component — jest.config.js требует >= 70/50/70/70
# (последний прогон: 8 suites / 44 теста, все зелёные)
cd frontend && npm test

# Frontend: E2E (Playwright, требуется запущенный backend и frontend)
cd frontend && npx playwright test
```

## Возможности

- Каталог блюд с поиском, фильтрами и рецептами
- Запись на мастер-классы (лимиты, подтверждение, отмена)
- Участие в мероприятиях
- Личный кабинет с историей записей
- Админ-панель: контент, пользователи, статистика, экспорт CSV
- Интерактивная карта заведений Яндекс.Карты
- Swagger UI на `/api-docs`, документация MkDocs

## CI/CD

GitHub Actions workflow: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

| Job        | Что делает                                                              |
| ---------- | ----------------------------------------------------------------------- |
| `backend`  | lint → typecheck → тесты (unit + integration) на временном PostgreSQL    |
| `frontend` | lint → typecheck → тесты → production-сборка Next.js                     |
| `docs`     | сборка MkDocs (проверка, что документация собирается)                    |
| `docker`   | сборка образов backend и frontend (после успешных тестов)                |

Деплой выполняется вручную на сервере — `bash deploy.sh` (см. ниже).

## Роли

- `USER` — обычный пользователь (запись на мастер-классы и мероприятия)
- `ADMIN` — полный доступ к админ-панели и управлению контентом
- `MODERATOR` — управление контентом без прав на пользователей

## Перед продакшеном

1. **Сменить все секреты.** Значения из истории git считаются
   скомпрометированными: `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
   `SEED_ADMIN_PASSWORD`/`SEED_DEMO_PASSWORD`. Новые значения задаются в `.env`
   (файл в `.gitignore`), пароли seed применяются повторным
   `docker compose exec backend npm run seed`.
   Если том с БД уже создан, пароль роли нужно сменить в самой базе:
   ```bash
   docker compose exec -T postgres psql -U komi -d gastro_komi \
     -c "ALTER USER komi WITH PASSWORD '<новый пароль>';"
   ```
2. **Перевыпустить ключ Яндекс.Карт** — текущий попал в историю git.
3. **Проверить адреса:** `SITE_URL`, `CORS_ORIGIN`, `API_PUBLIC_URL` —
   публичные, `ALLOW_LOCALHOST=false`.
4. **Проверить доступ:** `/admin` открывается только под администратором, роль
   подтверждается сервером (`/auth/me`), а cookie сессии — `HttpOnly`.
