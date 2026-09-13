'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MasterClass } from '@/types';

export interface BookingFormProps {
  masterClass: MasterClass;
  isAlreadyBooked?: boolean;
  isAuthenticated: boolean;
  onSubmit: () => Promise<void>;
  onCancel?: () => Promise<void>;
}

/**
 * Молекула: форма записи на мастер-класс с подтверждением.
 */
export function BookingForm({
  masterClass,
  isAlreadyBooked = false,
  isAuthenticated,
  onSubmit,
  onCancel,
}: BookingFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (masterClass.availableSeats === 0 && !isAlreadyBooked) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-amber-800" data-testid="booking-full">
        Все места заняты. Следите за новыми датами мастер-классов.
      </div>
    );
  }

  if (isAlreadyBooked) {
    return (
      <div className="space-y-3" data-testid="booking-done">
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          Вы записаны на этот мастер-класс! Ждём вас.
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Отменить запись
          </Button>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg bg-blue-50 p-4 text-blue-800" data-testid="booking-auth-required">
        Для записи на мастер-класс необходимо{' '}
        <a href="/login" className="font-medium underline">
          войти в систему
        </a>
        .
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="booking-form">
      <Input label="Ваше имя" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        label="Телефон (необязательно)"
        name="phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
        Записаться ({masterClass.price === 0 ? 'бесплатно' : `${masterClass.price} ₽`})
      </Button>
    </form>
  );
}