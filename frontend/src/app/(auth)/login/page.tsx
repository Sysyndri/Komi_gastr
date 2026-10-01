"use client";

/**
 * Страница входа.
 */
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { validateEmail, validateLoginPassword } from "@/lib/validation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailError = validateEmail(email);
  const passwordError = validateLoginPassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched({ email: true, password: true });
    // Клиентская проверка выполняется до запроса к API
    if (emailError || passwordError) return;
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      toast.success("Добро пожаловать!");
      router.push(redirect);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-5 sm:p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Вход в систему
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid="login-form"
          noValidate
        >
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={touched.email ? emailError : undefined}
            autoComplete="email"
            placeholder="you@example.ru"
            required
          />
          <Input
            label="Пароль"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={touched.password ? passwordError : undefined}
            autoComplete="current-password"
            placeholder="Введите пароль"
            required
          />

          {error && (
            <p
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Войти
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Зарегистрироваться
          </Link>
        </p>
      </Card>
    </div>
  );
}
