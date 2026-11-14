import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import { afterEach, beforeEach, vi } from 'vitest';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Recharts sizes charts through ResizeObserver, which jsdom never fires. Render
// every ResponsiveContainer at a fixed size so the SVG is deterministic.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) =>
      cloneElement(children as ReactElement<{ width?: number; height?: number }>, {
        width: 640,
        height: 176,
      }),
  };
});

// jsdom does not implement printing. Every test gets a mock so components can
// call window.print() and assert on it.
if (typeof window !== 'undefined') {
  window.print = vi.fn();
}

if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  let counter = 0;
  Object.defineProperty(crypto, 'randomUUID', {
    configurable: true,
    value: () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
  });
}

beforeEach(() => {
  vi.mocked(window.print).mockClear();
});

afterEach(() => {
  cleanup();
});
