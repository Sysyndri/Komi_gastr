/**
 * Тесты Modal и ErrorBoundary.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';
import { ErrorBoundary } from '@/components/ErrorBoundary';

describe('Modal', () => {
  it('не рендерится при open=false', () => {
    render(
      <Modal open={false} onClose={jest.fn()}>
        <p>Содержимое</p>
      </Modal>,
    );
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('рендерит содержимое при open=true', () => {
    render(
      <Modal open title="Заголовок" onClose={jest.fn()}>
        <p>Содержимое</p>
      </Modal>,
    );
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Заголовок')).toBeInTheDocument();
    expect(screen.getByText('Содержимое')).toBeInTheDocument();
  });

  it('вызывает onClose при клике по фону', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose}>
        <p>Содержимое</p>
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('вызывает onClose при нажатии Escape', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose}>
        <p>Содержимое</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ErrorBoundary', () => {
  function Boom(): never {
    throw new Error('Тестовая ошибка');
  }

  it('показывает fallback при ошибке потомка', () => {
    // Подавляем console.error в тесте
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByText('Тестовая ошибка')).toBeInTheDocument();
    jest.restoreAllMocks();
  });

  it('рендерит детей, когда ошибок нет', () => {
    render(
      <ErrorBoundary>
        <p>Ок</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Ок')).toBeInTheDocument();
  });
});