import { forwardRef, InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Подсказка под полем (требования к значению). Скрыта при наличии ошибки. */
  hint?: string;
}

/**
 * Атомарное поле ввода с подписью, подсказкой и сообщением об ошибке.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className = "", id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition
          focus:ring-2 focus:ring-primary-500
          ${error ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-primary-500"}
          ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
});
