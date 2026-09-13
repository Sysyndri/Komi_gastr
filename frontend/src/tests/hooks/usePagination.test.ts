/**
 * Unit-тесты для usePagination.
 */
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination', () => {
  it('возвращает начальные значения', () => {
    const { result } = renderHook(() => usePagination(1, 12));
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(12);
  });

  it('переходит на следующую страницу', () => {
    const { result } = renderHook(() => usePagination(1, 12));
    act(() => result.current.nextPage());
    expect(result.current.page).toBe(2);
  });

  it('переходит на предыдущую страницу и не уходит ниже 1', () => {
    const { result } = renderHook(() => usePagination(1, 12));
    act(() => result.current.prevPage());
    expect(result.current.page).toBe(1);

    act(() => result.current.nextPage());
    act(() => result.current.nextPage());
    act(() => result.current.prevPage());
    expect(result.current.page).toBe(2);
  });

  it('переходит на конкретную страницу', () => {
    const { result } = renderHook(() => usePagination(1, 12));
    act(() => result.current.goToPage(5));
    expect(result.current.page).toBe(5);
  });

  it('goToPage не позволяет перейти ниже 1', () => {
    const { result } = renderHook(() => usePagination(1, 12));
    act(() => result.current.goToPage(0));
    expect(result.current.page).toBe(1);
  });

  it('reset возвращает на первую страницу', () => {
    const { result } = renderHook(() => usePagination(1, 12));
    act(() => result.current.goToPage(4));
    act(() => result.current.reset());
    expect(result.current.page).toBe(1);
  });
});