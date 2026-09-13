/**
 * Unit-тесты для UI-компонентов: Button, Badge, Spinner, Card.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

describe('Button', () => {
  it('рендерит текст кнопки', () => {
    render(<Button>Нажми меня</Button>);
    expect(screen.getByRole('button', { name: 'Нажми меня' })).toBeInTheDocument();
  });

  it('вызывает onClick', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Клик</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('блокируется при disabled', () => {
    render(<Button disabled>Отключено</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('показывает спиннер при isLoading и блокирует клик', () => {
    const handleClick = jest.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Загрузка
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});

describe('Badge', () => {
  it('рендерит текст с tone-классом', () => {
    render(<Badge tone="green">Активен</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('Активен');
    expect(badge.className).toContain('bg-green-100');
  });
});

describe('Spinner', () => {
  it('показывает label', () => {
    render(<Spinner label="Загрузка данных" />);
    expect(screen.getByText('Загрузка данных')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
});

describe('Card', () => {
  it('оборачивает контент', () => {
    render(<Card>Контент карточки</Card>);
    expect(screen.getByTestId('card')).toHaveTextContent('Контент карточки');
  });
});

describe('Input', () => {
  it('рендерит label и error', () => {
    render(<Input label="Email" name="email" error="Некорректный email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Некорректный email');
  });
});