# ============================================================================
# Dockerfile — frontend «Гастрономия Коми» (Next.js 14, App Router)
# Multi-stage: deps → build (output: standalone) → минимальный runtime.
#
# NEXT_PUBLIC_* вшиваются в бандл на этапе сборки: после изменения любого из
# них образ нужно пересобрать (docker compose build --no-cache frontend).
# ============================================================================

# ---------- Stage 1: зависимости ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# ---------- Stage 2: сборка ----------
FROM node:20-alpine AS build
WORKDIR /app

# Публичные адреса обязательны: небезопасного значения по умолчанию нет.
# Пример для сервера 85.192.20.218:
#   NEXT_PUBLIC_API_URL=http://85.192.20.218:4000/api
#   NEXT_PUBLIC_SITE_URL=http://85.192.20.218:3000
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY=
ARG NEXT_PUBLIC_SITE_NAME=Гастрономия Коми
ARG NEXT_PUBLIC_SITE_TAGLINE=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_SITE_TAGLINE=$NEXT_PUBLIC_SITE_TAGLINE
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Stage 3: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

# Non-root: процесс Next.js не должен работать под root в контейнере
RUN addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production
# standalone-сервер читает HOSTNAME/PORT; без HOSTNAME=0.0.0.0 он bind'ится
# на localhost и снаружи недоступен
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Только то, что нужно серверу: standalone-бандл, статика, публичные файлы
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public

USER app
EXPOSE 3000

# Healthcheck: используется compose (depends_on: service_healthy) и мониторингом
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
