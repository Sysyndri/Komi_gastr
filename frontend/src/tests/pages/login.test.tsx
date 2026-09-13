/**
 * Integration-тест страницы входа.
 * Изолирован от сети: useAuth мокается, submit проверяет вызов login.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/(auth)/login/page';

// Мокаем useAuth и next/navigation
const mockLogin = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => '/' }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin, user: null }),
}));

// Toaster не должен падать в jsdom
jest.mock('react-hot-toast', () => ({
  Toaster: () => null,
  success: jest.fn(),
  error: jest.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockPush.mockReset();
  });

  it('рендерит форму входа', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
  });

  it('вызывает login при отправке с данными', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'demo@test.ru');
    await userEvent.type(screen.getByLabelText('Пароль'), 'Password1');
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'demo@test.ru', password: 'Password1' });
    });
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('показывает ошибку при неудачном входе', async () => {
    mockLogin.mockRejectedValue(new Error('Неверный email или пароль'));
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'demo@test.ru');
    await userEvent.type(screen.getByLabelText('Пароль'), 'Wrong');
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Неверный email или пароль');
    });
  });
});