/**
 * Unit-тесты для useSearch (debounce).
 */
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from '@/hooks/useSearch';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('возвращает значение сразу', () => {
    const { result } = renderHook(() => useDebouncedValue('тест'));
    expect(result.current).toBe('тест');
  });

  it('обновляет значение после задержки', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: 'первый' },
    });
    expect(result.current).toBe('первый');

    rerender({ value: 'второй' });
    expect(result.current).toBe('первый'); // ещё не обновилось

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('второй');
  });

  it('сбрасывает таймер при быстром вводе', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    rerender({ value: 'abc' });

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('a'); // таймер не сработал

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('abc');
  });
});