import type { ReactElement } from 'react';
import type { Root } from 'react-dom/client';

export const VARIANTS = ['Radix', 'Base UI'] as const;
export type Variant = (typeof VARIANTS)[number];

/**
 * The React lifecycle of a behaviour suite: it mounts elements in roots on `document.body`, collects what they log
 * to `console.error`, and unmounts everything on cleanup. The suite installs the DOM, then calls `load` before it
 * mounts anything.
 */
export function createReactMount() {
  const roots: Root[] = [];
  const originalConsoleError = console.error;
  let act: typeof import('react').act;
  let createRoot: typeof import('react-dom/client').createRoot;

  /** Loads React once the DOM is installed. */
  async function load() {
    const react = await import('react');
    ({ createRoot } = await import('react-dom/client'));
    act = react.act;
    return { act: react.act, createElement: react.createElement };
  }

  async function cleanup(): Promise<void> {
    await act(async () => {
      for (const root of roots.splice(0)) root.unmount();
    });
    document.body.innerHTML = '';
    console.error = originalConsoleError;
  }

  /** Opens a root and returns what it logs to `console.error`, and a `render` that shows an element in it. */
  function mount() {
    const errors: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      errors.push(args);
    };
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);
    const render = (element: ReactElement) =>
      act(async () => {
        root.render(element);
      });
    return { errors, render };
  }

  return { load, cleanup, mount };
}
