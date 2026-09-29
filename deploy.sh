#!/usr/bin/env bash
#
# Деплой платформы «Гастрономия Коми»: проверка окружения, сборка образов,
# запуск стека.
#
# Использование:
#   cp .env.example .env   # и заполнить обязательные значения
#   bash deploy.sh         # обычная сборка и запуск
#   bash deploy.sh --build # принудительная пересборка без кэша
#
set -euo pipefail

cd "$(dirname "$0")"

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'; OFF=$'\033[0m'
fail() { echo "${RED}✗ $*${OFF}" >&2; exit 1; }
warn() { echo "${YELLOW}⚠ $*${OFF}"; }
ok()   { echo "${GREEN}✓ $*${OFF}"; }

# ── 1. Docker ───────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || fail "Docker не установлен"
docker compose version >/dev/null 2>&1 || docker-compose --version >/dev/null 2>&1 || fail "Нет docker compose"
docker info >/dev/null 2>&1 || fail "Docker-демон не запущен (или нет прав)"
ok "Docker доступен"

# ── 2. .env ─────────────────────────────────────────────────────────────────
[ -f .env ] || fail "Нет файла .env. Скопируйте: cp .env.example .env и заполните значения"

# Все обязательные переменные объявлены в compose через ${VAR:?}, поэтому
# проверка ниже — не единственная защита, а понятная диагностика до сборки.
get() { sed -n "s/^[[:space:]]*$1[[:space:]]*=[[:space:]]*//p" .env | tail -n1; }

require() { [ -n "$(get "$1")" ] || fail "В .env не задана обязательная переменная $1"; }

for var in SITE_URL CORS_ORIGIN DATABASE_URL POSTGRES_PASSWORD JWT_SECRET JWT_REFRESH_SECRET \
           NEXT_PUBLIC_API_URL SEED_ADMIN_EMAIL SEED_ADMIN_PASSWORD; do
  require "$var"
done
ok "Обязательные переменные заданы"

if [ "$(get NODE_ENV)" != "production" ]; then
  warn "NODE_ENV=$(get NODE_ENV): в контейнере должно быть production (иначе Next.js стартует в dev-режиме)"
fi

case "$(get SITE_URL)" in
  *localhost*|*127.0.0.1*) warn "SITE_URL указывает на localhost — для сервера нужен публичный адрес" ;;
esac

secret_len=$(printf '%s' "$(get JWT_SECRET)" | wc -c)
[ "$secret_len" -ge 32 ] || warn "JWT_SECRET короче 32 символов — сгенерируйте длиннее: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""

# ── 3. Сборка ───────────────────────────────────────────────────────────────
BUILD_ARGS=()
if [ "${1:-}" = "--build" ]; then
  BUILD_ARGS=(--no-cache)
  warn "Пересборка образов без кэша"
fi

echo "→ Сборка образов (это займёт несколько минут)…"
docker compose build "${BUILD_ARGS[@]+"${BUILD_ARGS[@]}"}" || fail "Сборка завершилась с ошибкой"
ok "Образы собраны"

# ── 4. Запуск ───────────────────────────────────────────────────────────────
docker compose up -d || fail "Не удалось поднять стек"

# ── 5. Ожидание API ─────────────────────────────────────────────────────────
# Проверка выполняется на самом сервере, поэтому обращаемся к loopback-адресу:
# наружу API публикуется тем же портом (BACKEND_PORT из .env).
api_port=$(get BACKEND_PORT)
api_port=${api_port:-4000}
health="http://127.0.0.1:${api_port}/api/health"
echo "→ Ожидание API: $health"
for _ in $(seq 1 40); do
  if curl -fsS "$health" >/dev/null 2>&1; then
    ok "API отвечает"
    break
  fi
  sleep 3
done
curl -fsS "$health" >/dev/null 2>&1 || fail "API не ответил за 2 минуты — смотрите: docker compose logs backend"

site=$(get SITE_URL)
echo
ok "Стек запущен. Сайт: ${site:-<SITE_URL не задан>}"
echo "   API: $health   Логи: docker compose logs -f   Статус: docker compose ps"
