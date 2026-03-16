import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mockSdk } from '../../test/mocks'
import ConfigScreen from './ConfigScreen'
import { vi, describe, it, expect } from 'vitest'
import '@testing-library/jest-dom'

// Mock the useSDK hook
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}))

describe('ConfigScreen', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const renderWithQueryClient = (component: React.ReactNode) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>)
  }

  it('shows install message when app is not installed', async () => {
    // Mock the app.isInstalled query to return false
    const mockIsInstalled = vi.fn().mockResolvedValue(false)
    mockSdk.app.isInstalled = mockIsInstalled

    renderWithQueryClient(<ConfigScreen />)

    // Wait for the text to appear
    const installMessage = await screen.findByText(
      'Click "Install" in the top-right corner to begin configuration of the Google Gemini connector.',
    )

    expect(installMessage).toBeInTheDocument()
  })

  it('shows config UI when app is installed', async () => {
    // Mock the app.isInstalled query to return true
    const mockIsInstalled = vi.fn().mockResolvedValue(true)
    mockSdk.app.isInstalled = mockIsInstalled
    // Mock modelDiscoveryAction to minimal valid value
    mockSdk.cma.appAction = {
      getMany: vi.fn().mockResolvedValue({
        items: [
          {
            name: 'Model Discovery',
            sys: {
              appDefinition: { sys: { id: mockSdk.ids.app } },
              app: { sys: { id: mockSdk.ids.app } },
              id: 'action-id',
            },
          },
        ],
      }),
      get: vi.fn(),
      getManyForEnvironment: vi.fn(),
    }
    // Mock getParameters to return an API key and selectedModels
    mockSdk.app.getParameters = vi.fn().mockResolvedValue({ apiKey: 'test-key', selectedModels: '[]' })
    // Mock setReady to resolve immediately
    mockSdk.app.setReady = vi.fn().mockResolvedValue(undefined)

    renderWithQueryClient(<ConfigScreen />)

    // Wait for the heading and config text to appear
    const heading = await screen.findByRole('heading', { name: /connect to google gemini/i })
    const configText = await screen.findByText(/to connect this app to the gemini api, please enter your api key/i)
    expect(heading).toBeInTheDocument()
    expect(configText).toBeInTheDocument()
  })

  it('handles invalid selectedModels format that fails validation', async () => {
    // Mock the app.isInstalled query to return true
    const mockIsInstalled = vi.fn().mockResolvedValue(true)
    mockSdk.app.isInstalled = mockIsInstalled
    // Mock modelDiscoveryAction to minimal valid value
    mockSdk.cma.appAction = {
      getMany: vi.fn().mockResolvedValue({
        items: [
          {
            name: 'Model Discovery',
            sys: {
              appDefinition: { sys: { id: mockSdk.ids.app } },
              app: { sys: { id: mockSdk.ids.app } },
              id: 'action-id',
            },
          },
        ],
      }),
      get: vi.fn(),
      getManyForEnvironment: vi.fn(),
    }
    // Mock getParameters to return an API key and invalid selectedModels format
    mockSdk.app.getParameters = vi.fn().mockResolvedValue({
      apiKey: 'test-key',
      selectedModels: JSON.stringify([{ modelId: 'invalid-model' }]), // Missing required fields
    })
    // Mock setReady to resolve immediately
    mockSdk.app.setReady = vi.fn().mockResolvedValue(undefined)

    renderWithQueryClient(<ConfigScreen />)

    // Wait for the heading and config text to appear
    const heading = await screen.findByRole('heading', { name: /connect to google gemini/i })
    const configText = await screen.findByText(/to connect this app to the gemini api, please enter your api key/i)
    expect(heading).toBeInTheDocument()
    expect(configText).toBeInTheDocument()
  })

  it('handles malformed JSON in selectedModels', async () => {
    // Mock the app.isInstalled query to return true
    const mockIsInstalled = vi.fn().mockResolvedValue(true)
    mockSdk.app.isInstalled = mockIsInstalled
    // Mock modelDiscoveryAction to minimal valid value
    mockSdk.cma.appAction = {
      getMany: vi.fn().mockResolvedValue({
        items: [
          {
            name: 'Model Discovery',
            sys: {
              appDefinition: { sys: { id: mockSdk.ids.app } },
              app: { sys: { id: mockSdk.ids.app } },
              id: 'action-id',
            },
          },
        ],
      }),
      get: vi.fn(),
      getManyForEnvironment: vi.fn(),
    }
    // Mock getParameters to return an API key and malformed JSON
    mockSdk.app.getParameters = vi.fn().mockResolvedValue({
      apiKey: 'test-key',
      selectedModels: 'not-a-valid-json-string',
    })
    // Mock setReady to resolve immediately
    mockSdk.app.setReady = vi.fn().mockResolvedValue(undefined)

    renderWithQueryClient(<ConfigScreen />)

    // Wait for the heading and config text to appear
    const heading = await screen.findByRole('heading', { name: /connect to google gemini/i })
    const configText = await screen.findByText(/to connect this app to the gemini api, please enter your api key/i)
    expect(heading).toBeInTheDocument()
    expect(configText).toBeInTheDocument()
  })
})
