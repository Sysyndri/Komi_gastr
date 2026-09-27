"use client";

/**
 * Страница регистрации.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  PASSWORD_HINT,
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "@/lib/validation";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    phone: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    phone: validatePhone(phone),
  };
  const showError = (field: keyof typeof touched) =>
    touched[field] ? errors[field] : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched({ name: true, email: true, password: true, phone: true });
    if (errors.name || errors.email || errors.password || errors.phone) return;
    setIsLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      toast.success("Регистрация успешна!");
      router.push("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="p-8">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Регистрация
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid="register-form"
          noValidate
        >
          <Input
            label="Имя"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            error={showError("name")}
            autoComplete="name"
            placeholder="Иван Иванов"
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={showError("email")}
            autoComplete="email"
            placeholder="you@example.ru"
            required
          />
          <Input
            label={`Пароль (минимум ${PASSWORD_MIN_LENGTH} символов)`}
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={showError("password")}
            autoComplete="new-password"
            placeholder="Минимум 8 символов: буквы и цифры"
            hint={PASSWORD_HINT}
            required
            minLength={PASSWORD_MIN_LENGTH}
          />
          <Input
            label="Телефон (необязательно)"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            error={showError("phone")}
            autoComplete="tel"
            placeholder="+7 912 345-67-89"
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
            Зарегистрироваться
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Войти
          </Link>
        </p>
      </Card>
    </div>
  );
}
