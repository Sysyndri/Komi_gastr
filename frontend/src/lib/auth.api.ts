/**
 * API-методы аутентификации.
 */
import { apiFetch, setTokens, clearTokens } from "@/lib/api-client";
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Role,
  User,
} from "@/types";

export const authApi = {
  async login(input: LoginRequest): Promise<AuthResponse> {
    const res = await apiFetch<ApiResponse<AuthResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  },

  async register(input: RegisterRequest): Promise<AuthResponse> {
    const res = await apiFetch<ApiResponse<AuthResponse>>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data;
  },

  async me(): Promise<User> {
    const res = await apiFetch<ApiResponse<User>>("/auth/me");
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      clearTokens();
    }
  },

  role: (): Role | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("gk_user_role");
      return raw as Role | null;
    } catch {
      return null;
    }
  },
};
