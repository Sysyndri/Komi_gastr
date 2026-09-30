import { NextResponse, NextRequest } from "next/server";

/**
 * Middleware: API-прокси + защита маршрутов.
 *
 * 1. /api/* → backend: rewrite на внутренний адрес (http://backend:4000/api).
 *    Браузер ходит на тот же origin, что и сайт → CORS не нужен, CSP 'self'
 *    остаётся корректной, а образ фронтенда не зависит от публичного адреса
 *    API: при переезде на сервер достаточно поменять API_INTERNAL_URL.
 * 2. /profile и /admin требуют активной сессии. Cookie с access-токеном ставит
 *    backend с флагом HttpOnly — из JavaScript её значение не подделать.
 *    Роль для /admin подтверждает сам API (/auth/me), поэтому UI-гейт
 *    согласован с реальными правами, а клиентская cookie роли не используется.
 *
 * Security-заголовки (CSP, HSTS, X-Frame-Options…) собираются в next.config.js —
 * единая точка правды; здесь они намеренно не дублируются.
 */

/** Cookie с access-токеном: выставляется backend и доступна только серверу. */
const ACCESS_TOKEN_COOKIE = "gk_access_token";

/** Внутренний адрес backend; в docker-compose это http://backend:4000/api. */
const API_INTERNAL_URL = (
  process.env.API_INTERNAL_URL ?? "http://localhost:4000/api"
).replace(/\/+$/, "");

/** Редирект на форму входа с запоминанием исходного адреса. */
function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * Проверяет сессию на стороне backend и возвращает роль пользователя.
 * Возвращает null, если токен недействителен или API недоступен — в этом
 * случае доступ закрывается (fail closed).
 */
async function fetchUserRole(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_INTERNAL_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const payload = (await res.json()) as { data?: { role?: string } };
    return payload.data?.role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- 1. API-прокси: /api/* → backend --------------------------------
  if (pathname.startsWith("/api/")) {
    const target = new URL(
      `${API_INTERNAL_URL}${pathname.slice("/api".length)}${request.nextUrl.search}`,
    );
    const headers = new Headers(request.headers);
    headers.set("x-forwarded-host", request.nextUrl.host);
    const proxied = NextResponse.rewrite(target, { request: { headers } });
    // Ответы API не должны кэшироваться браузером
    proxied.headers.set("Cache-Control", "no-store");
    return proxied;
  }

  // --- 2. Защита маршрутов --------------------------------------------
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  // Профиль без сессии → форма входа с обратным адресом
  if (pathname.startsWith("/profile") && !accessToken) {
    return redirectToLogin(request);
  }

  // Админка: нужна сессия, роль подтверждает API, а не клиентская cookie
  if (pathname.startsWith("/admin")) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const role = await fetchUserRole(accessToken);
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Всё, кроме сборки Next, favicon и картинок из public; /api — отдельным шаблоном
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|images/).*)",
    "/api/:path*",
  ],
};
