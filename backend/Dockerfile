# ============================================================================
# Dockerfile — backend «Гастрономия Коми»
# Multi-stage: сборка TypeScript + Prisma, затем компактный runtime.
# ============================================================================

# ---------- Stage 1: сборка ----------
FROM node:20-slim AS build
WORKDIR /app

# Необходимые системные библиотеки для Prisma (openssl, libssl)
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Сначала только зависимости — кэширование слоёв
# Контекст сборки — корень монорепозитория (см. docker-compose.yml)
COPY backend/package*.json ./
RUN npm ci --no-audit --no-fund

COPY backend/ .

# OpenAPI-спецификация для Swagger UI (лежит в docs/docs/api корня монорепозитория)
COPY docs/docs/api/openapi.yaml ./docs/api/openapi.yaml

# Генерация Prisma-клиента и компиляция TypeScript
RUN npx prisma generate && npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# openssl нужен и в runtime для Prisma Client
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# node_modules полностью (нужен prisma CLI для migrate deploy)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/docs ./docs

EXPOSE 4000

# Применение миграций и запуск API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]