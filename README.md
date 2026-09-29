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
# 1. Скопируйте шаблон и заполните значения (пароли БД, JWT-секреты, seed-аккаунты)
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # для JWT_SECRET

# 2. Запуск всей инфраструктуры
docker-compose up --build
```

Без заполненного `.env` стек не стартует: `docker-compose.yml` не содержит
значений секретов по умолчанию. Тестовые и административные учётные записи
в репозитории не публикуются — они заводятся переменными `SEED_*` и
описаны во внутренних заметках `DEVELOPER_NOTES.md` (файл в git не попадает).

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Swagger UI: http://localhost:4000/api-docs
- Документация MkDocs: http://localhost:8000

## Локальная разработка

Требования: Node.js >= 20, Docker (для PostgreSQL).

```bash
# База данных
docker-compose up -d postgres

# Backend (порт 4000)
cd backend
npm install
cp .env.example .env           # заполните DATABASE_URL, JWT_*, SEED_*
npx prisma migrate dev
npm run seed                   # требует SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
npm run dev

# Frontend (порт 3000)
cd frontend
npm install
npm run dev
```

## Документация

| Раздел               | Путь                    |
| -------------------- | ----------------------- |
| Пользовательская     | `docs/user-guide/`      |
| Административная     | `docs/admin-guide/`     |
| Для разработчиков    | `docs/developer-guide/` |
| OpenAPI спецификация | `docs/api/openapi.yaml` |

## Тесты

```bash
# Backend: unit + integration, coverage >= 80% (факт: 94% stmts / 78% branch / 91% func / 96% lines)
cd backend && npm test

# Frontend: unit + component, coverage >= 70% (факт: 78% stmts / 73% branch / 74% func / 80% lines)
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

GitHub Actions workflow: `.github/workflows/ci.yml`
— линтеры → тесты → сборка Docker-образов → деплой документации.

## Роли

- `USER` — обычный пользователь (запись на мастер-классы и мероприятия)
- `ADMIN` — полный доступ к админ-панели и управлению контентом
- `MODERATOR` — управление контентом без прав на пользователей
