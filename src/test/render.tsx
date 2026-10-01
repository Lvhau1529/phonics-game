/**
 * Dựng component React trong test (Vitest + jsdom) không cần testing-library: `createRoot` + `act`.
 */
import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface Rendered {
  container: HTMLElement;
  rerender: (element: ReactNode) => void;
  unmount: () => void;
}

export function render(element: ReactNode): Rendered {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return {
    container,
    rerender: (next) => act(() => root.render(next)),
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

/** Bấm một phần tử trong `act` (React xử lý xong state mới trả về) */
export function click(element: Element | null): void {
  if (!(element instanceof HTMLElement)) throw new Error('Element not found');
  act(() => element.click());
}
