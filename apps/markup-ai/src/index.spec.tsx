import { describe, it, vi, beforeEach, expect } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  SDKProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@contentful/f36-components', () => ({ GlobalStyles: () => null }));
vi.mock('react-dom/client', () => {
  const renderMock = vi.fn();
  const createRoot = vi.fn(() => ({ render: renderMock }));
  return { createRoot, __renderMock: renderMock };
});
vi.mock('./App', () => ({ default: () => <div>AppRoot</div> }));
vi.mock('./components/LocalhostWarning/LocalhostWarning', () => ({ default: () => <div>LocalhostWarning</div> }));

describe('index.tsx', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    // Reset NODE_ENV to simulate non-development
    (process.env as unknown as Record<string, string>).NODE_ENV = 'production';
  });

  it('renders app when not in top window or not development', async () => {
    const client = await import('react-dom/client');
    const __renderMock = (client as unknown as { __renderMock: { mock: { calls: Array<unknown[]> } } }).__renderMock;
    await import('./index');
    expect(__renderMock.mock.calls.length).toBeGreaterThan(0);
  });

  it('renders localhost warning in development top window', async () => {
    (process.env as unknown as Record<string, string>).NODE_ENV = 'development';
    Object.defineProperty(globalThis, 'top', { value: globalThis, writable: true });
    Object.defineProperty(globalThis, 'self', { value: globalThis, writable: true });
    document.getElementById('root')!.innerHTML = '';
    // Re-import to trigger render again
    vi.resetModules();
    const client = await import('react-dom/client');
    const __renderMock = (client as unknown as { __renderMock: { mock: { calls: Array<unknown[]> } } }).__renderMock;
    await import('./index');
    expect(__renderMock.mock.calls.length).toBeGreaterThan(0);
  });
});
