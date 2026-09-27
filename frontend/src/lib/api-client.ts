/**
 * Базовый API-клиент с интерцепторами.
 * - Автоматически добавляет Authorization: Bearer из localStorage
 * - При 401 пытается обновить access-токен через refresh
 * - Преобразует ошибки API в понятный формат
 */
import { ApiErrorResponse } from "@/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const ACCESS_TOKEN_KEY = "gk_access_token";
const REFRESH_TOKEN_KEY = "gk_refresh_token";

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/** Записывает cookie (для серверного middleware). */
function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
}

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  setCookie(ACCESS_TOKEN_KEY, access);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("gk_user_role");
  clearCookie(ACCESS_TOKEN_KEY);
  clearCookie("gk_user_role");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Ошибки валидации по полям: { email: "Значение должно быть не длиннее..." }. */
export type FieldErrors = Record<string, string>;

/**
 * Извлекает полевые ошибки из ответа API.
 * Zod отдаёт details в виде [{ path, message }], Express-validator — [{ param, msg }].
 */
export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiClientError) || !Array.isArray(error.details)) {
    return {};
  }
  const result: FieldErrors = {};
  for (const item of error.details as Record<string, unknown>[]) {
    const field = item.path ?? item.param;
    const message = item.message ?? item.msg;
    if (typeof field === "string" && typeof message === "string") {
      result[field] = message;
    }
  }
  return result;
}

/** Выполняет запрос с автоматической подстановкой токена. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  {
    auth = true,
    retryOn401 = true,
  }: { auth?: boolean; retryOn401?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiClientError(0, "NETWORK_ERROR", "Нет соединения с сервером");
  }

  // Попытка обновить токен при 401
  if (res.status === 401 && auth && retryOn401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, options, { auth, retryOn401: false });
    }
  }

  if (!res.ok) {
    let payload: ApiErrorResponse | null = null;
    try {
      payload = (await res.json()) as ApiErrorResponse;
    } catch {
      /* пусто */
    }
    throw new ApiClientError(
      res.status,
      payload?.error.code ?? "HTTP_ERROR",
      payload?.error.message ?? `Ошибка запроса (${res.status})`,
      payload?.error.details,
    );
  }

  return (await res.json()) as T;
}

/** Пытается обновить access-токен через refresh-токен. */
export async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const payload = (await res.json()) as {
      data: { accessToken: string; refreshToken: string };
    };
    setTokens(payload.data.accessToken, payload.data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}
