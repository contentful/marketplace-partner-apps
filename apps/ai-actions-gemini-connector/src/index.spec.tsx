import { describe, it, expect, vi, Mock, beforeEach, afterEach } from 'vitest'
import * as ReactDOM from 'react-dom/client'
import { isValidElement } from 'react'
import { render, screen } from '@testing-library/react'

type MockRoot = {
  render: Mock
}

// Mock document.getElementById
const mockRootElement = document.createElement('div')
mockRootElement.id = 'root'
document.body.appendChild(mockRootElement)

// Mock the createRoot function
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}))

describe('index.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Remove the module from the cache so we can re-import with new globals
    vi.resetModules()
  })

  afterEach(() => {
    // Clean up the stubbed global
    // @ts-expect-error: cleaning up stubbed import.meta
    delete globalThis.import
  })

  it('renders LocalhostWarning in development mode when window.self equals window.top', async () => {
    // Mock window.self and window.top to be equal
    Object.defineProperty(window, 'self', {
      value: window,
      writable: true,
    })
    Object.defineProperty(window, 'top', {
      value: window,
      writable: true,
    })

    // Stub import.meta.env before importing the module
    vi.stubGlobal('import', { meta: { env: { DEV: true } } })

    // Import the file to trigger the rendering logic
    await import('./index')

    // Verify that createRoot was called with the correct element
    expect(ReactDOM.createRoot).toHaveBeenCalledWith(mockRootElement)

    // Get the mock render function
    const mockRoot = (ReactDOM.createRoot as Mock).mock.results[0]?.value as MockRoot
    expect(mockRoot).toBeDefined()
    const mockRender = mockRoot.render

    // Verify that LocalhostWarning was rendered
    const renderArg = mockRender.mock.calls[0]?.[0] as React.ReactElement
    expect(isValidElement(renderArg)).toBe(true)
    expect(typeof renderArg.type === 'function' && renderArg.type.name).toBe('LocalhostWarning')

    // Render the component to verify its content
    render(renderArg)

    // Verify the component's content
    expect(
      screen.getByText(/Contentful Apps need to run inside the Contentful web app to function properly/),
    ).toBeInTheDocument()
  })

  it('renders App in production mode or when window.self does not equal window.top', async () => {
    // Mock window.self and window.top to be different
    Object.defineProperty(window, 'self', {
      value: window,
      writable: true,
    })
    Object.defineProperty(window, 'top', {
      value: {},
      writable: true,
    })

    // Stub import.meta.env before importing the module
    vi.stubGlobal('import', { meta: { env: { DEV: false } } })

    // Import the file to trigger the rendering logic
    await import('./index')

    // Get the mock render function
    const mockRoot = (ReactDOM.createRoot as Mock).mock.results[0]?.value as MockRoot
    expect(mockRoot).toBeDefined()
    const mockRender = mockRoot.render

    // Verify that App was rendered
    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(Function), // SDKProvider
        props: expect.objectContaining({
          children: expect.any(Object),
        }),
      }),
    )
  })
})
