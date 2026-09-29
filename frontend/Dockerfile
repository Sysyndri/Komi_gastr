# ============================================================================
# Dockerfile — frontend «Гастрономия Коми»
# Multi-stage: сборка Next.js, затем запуск production-сервера.
# ============================================================================

# ---------- Stage 1: сборка ----------
FROM node:20-alpine AS build
WORKDIR /app

# NEXT_PUBLIC_* переменные фиксируются на этапе сборки
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ARG NEXT_PUBLIC_SITE_NAME=
ARG NEXT_PUBLIC_SITE_TAGLINE=
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_NAME=$NEXT_PUBLIC_SITE_NAME
ENV NEXT_PUBLIC_SITE_TAGLINE=$NEXT_PUBLIC_SITE_TAGLINE
ENV NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$NEXT_PUBLIC_YANDEX_MAPS_API_KEY

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./next.config.js

EXPOSE 3000

CMD ["npm", "run", "start"]