# API «Гастрономия Коми»

Базовый URL: `http://localhost:4000/api`

## Аутентификация

Большинство эндпоинтов требуют заголовок:

```
Authorization: Bearer <access_token>
```

Access-токен живёт 15 минут, refresh-токен — 7 дней. При истечении
access-токена используйте `POST /auth/refresh`.

## Краткая справка по эндпоинтам

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| `POST` | `/auth/register` | публичный | Регистрация |
| `POST` | `/auth/login` | публичный | Вход, выдаёт токены |
| `POST` | `/auth/refresh` | публичный | Обновление токенов |
| `POST` | `/auth/logout` | авторизованный | Отзыв refresh-токена |
| `GET` | `/auth/me` | авторизованный | Текущий пользователь |
| `GET` | `/dishes` | публичный | Список блюд (фильтры, пагинация) |
| `GET` | `/dishes/:id` | публичный | Детали блюда |
| `GET` | `/places` | публичный | Список заведений |
| `GET` | `/masterclasses` | публичный | Список мастер-классов |
| `GET` | `/masterclasses/:id` | публичный | Детали мастер-класса |
| `POST` | `/bookings/masterclass/:id` | авторизованный | Запись на МК |
| `DELETE` | `/bookings/masterclass/:id` | авторизованный | Отмена записи |
| `GET` | `/bookings/my` | авторизованный | Мои записи |
| `GET` | `/events` | публичный | Список мероприятий |
| `POST` | `/bookings/event/:id` | авторизованный | Участие в мероприятии |
| `GET` | `/search?q=` | публичный | Полнотекстовый поиск |
| `GET` | `/stats` | админ | Статистика платформы |
| `GET` | `/admin/*` | админ | Управление контентом и пользователями |

## Формат ответов

Успех:

```json
{ "success": true, "data": { ... } }
```

Ошибка:

```json
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

Коды ошибок: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## Интерактивная документация

Полная спецификация OpenAPI (все эндпоинты, схемы, примеры):

- файл: [`openapi.yaml`](openapi.yaml)
- Swagger UI: `http://localhost:4000/api-docs`
