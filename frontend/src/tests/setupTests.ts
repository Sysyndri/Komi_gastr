/**
 * Глобальная настройка Jest для frontend.
 */
import '@testing-library/jest-dom';

// Мок fetch для изоляции от реального API
global.fetch = jest.fn();

// Мок localStorage
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

if (!global.localStorage) {
  Object.defineProperty(global, 'localStorage', { value: new LocalStorageMock(), writable: true });
}

// Полифилл для window.matchMedia (используется некоторыми UI-библиотеками)
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// Мок IntersectionObserver
if (!(global as { IntersectionObserver?: unknown }).IntersectionObserver) {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(global, 'IntersectionObserver', { value: IntersectionObserverMock, writable: true });
}

export {};