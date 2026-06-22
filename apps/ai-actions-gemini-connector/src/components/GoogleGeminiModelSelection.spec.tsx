import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import '@testing-library/jest-dom'
import { GoogleGeminiModelSelection } from './GoogleGeminiModelSelection'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mockSdk } from '../../test/mocks'
import { AppActionProps } from 'contentful-management/types'
import { SelectedModel } from '../schemas/selectedModels'
import { useSDK } from '@contentful/react-apps-toolkit'
import { ConfigAppSDK } from '@contentful/app-sdk'

// Mock the useSDK hook
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}))

describe('GoogleGeminiModelSelection', () => {
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

  const mockModelDiscoveryAction: AppActionProps = {
    sys: {
      id: 'test-action-id',
      type: 'AppAction',
      appDefinition: { sys: { id: 'test-app-id', type: 'Link', linkType: 'AppDefinition' } },
      organization: { sys: { id: 'test-org-id', type: 'Link', linkType: 'Organization' } },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    name: 'Model Discovery',
    description: 'Discovers available Gemini models',
    category: 'Custom',
    type: 'function-invocation',
    function: { sys: { id: 'test-function-id', type: 'Link', linkType: 'Function' } },
    parameters: [],
  }

  const defaultProps = {
    isLoading: false,
    modelDiscoveryAction: mockModelDiscoveryAction,
    modelProvider: 'google-gemini' as const,
    apiKey: 'test-api-key',
    credentials: undefined,
    location: undefined,
    selectedModels: [] as SelectedModel[],
    setSelectedModels: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSDK).mockReturnValue(mockSdk)
  })

  it('renders nothing when API key is not set', () => {
    const { container } = renderWithQueryClient(<GoogleGeminiModelSelection {...defaultProps} apiKey={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows loading state when isLoading is true', () => {
    const { container } = renderWithQueryClient(<GoogleGeminiModelSelection {...defaultProps} isLoading={true} />)
    expect(screen.getByText(/Selected models will be able to be configured/)).toBeInTheDocument()
    expect(container.querySelector('[data-test-id="cf-ui-skeleton-form"]')).toBeInTheDocument()
  })

  it('shows error message when model discovery fails', async () => {
    // Mock the app action call to return an error
    const mockAppActionCall = {
      createWithResponse: vi.fn().mockResolvedValue({
        response: {
          body: JSON.stringify({ error: 'Failed to discover models' }),
        },
      }),
    }

    // Extend the mock SDK type for testing
    const extendedMockSdk = {
      ...mockSdk,
      cma: {
        ...mockSdk.cma,
        appActionCall: mockAppActionCall,
      },
    } as unknown as ConfigAppSDK

    vi.mocked(useSDK).mockReturnValue(extendedMockSdk)

    renderWithQueryClient(<GoogleGeminiModelSelection {...defaultProps} />)

    const errorMessage = await screen.findByText(
      'An error occurred while fetching available models. Please check your API key and try again.',
    )
    expect(errorMessage).toBeInTheDocument()
  })

  it('renders model checkboxes when models are discovered', async () => {
    // Mock the app action call to return successful response with models
    const mockAppActionCall = {
      createWithResponse: vi.fn().mockResolvedValue({
        response: {
          body: JSON.stringify({
            models: [
              { name: 'gemini-pro', displayName: 'gemini-pro', description: 'Gemini Pro model' },
              { name: 'gemini-pro-vision', displayName: 'gemini-pro-vision', description: 'Gemini Pro Vision model' },
            ],
          }),
        },
      }),
    }

    // Extend the mock SDK type for testing
    const extendedMockSdk = {
      ...mockSdk,
      cma: {
        ...mockSdk.cma,
        appActionCall: mockAppActionCall,
      },
    } as unknown as ConfigAppSDK

    vi.mocked(useSDK).mockReturnValue(extendedMockSdk)

    renderWithQueryClient(<GoogleGeminiModelSelection {...defaultProps} />)

    const model1 = await screen.findByText('gemini-pro')
    const model2 = await screen.findByText('gemini-pro-vision')
    expect(model1).toBeInTheDocument()
    expect(model2).toBeInTheDocument()
  })

  it('handles model selection correctly', async () => {
    // Mock the app action call to return successful response with models
    const mockAppActionCall = {
      createWithResponse: vi.fn().mockResolvedValue({
        response: {
          body: JSON.stringify({
            models: [{ name: 'gemini-pro', displayName: 'gemini-pro', description: 'Gemini Pro model' }],
          }),
        },
      }),
    }

    // Extend the mock SDK type for testing
    const extendedMockSdk = {
      ...mockSdk,
      cma: {
        ...mockSdk.cma,
        appActionCall: mockAppActionCall,
      },
    } as unknown as ConfigAppSDK

    vi.mocked(useSDK).mockReturnValue(extendedMockSdk)

    const setSelectedModels = vi.fn()
    renderWithQueryClient(<GoogleGeminiModelSelection {...defaultProps} setSelectedModels={setSelectedModels} />)

    const checkbox = await screen.findByRole('checkbox', { name: 'gemini-pro' })
    fireEvent.click(checkbox)

    expect(setSelectedModels).toHaveBeenCalled()
    const result = getSetSelectedModelsResult(setSelectedModels, [])
    expect(result).toEqual([
      {
        entity: 'app',
        entityId: mockSdk.ids.app,
        modelId: 'gemini-pro',
        modelName: 'gemini-pro',
        modelVendor: 'Google',
        modelProvider: 'google-gemini',
      },
    ])
  })

  it('does not make API call when modelDiscoveryAction is undefined', () => {
    // Mock the app action call
    const mockAppActionCall = {
      createWithResponse: vi.fn(),
    }

    // Extend the mock SDK type for testing
    const extendedMockSdk = {
      ...mockSdk,
      cma: {
        ...mockSdk.cma,
        appActionCall: mockAppActionCall,
      },
    } as unknown as ConfigAppSDK

    vi.mocked(useSDK).mockReturnValue(extendedMockSdk)

    renderWithQueryClient(<GoogleGeminiModelSelection {...defaultProps} modelDiscoveryAction={undefined} />)

    // Verify that the API call was never made
    expect(mockAppActionCall.createWithResponse).not.toHaveBeenCalled()
  })

  it('removes model from selection when checkbox is unchecked', async () => {
    // Mock the app action call to return successful response with models
    const mockAppActionCall = {
      createWithResponse: vi.fn().mockResolvedValue({
        response: {
          body: JSON.stringify({
            models: [{ name: 'gemini-pro', displayName: 'gemini-pro', description: 'Gemini Pro model' }],
          }),
        },
      }),
    }

    // Extend the mock SDK type for testing
    const extendedMockSdk = {
      ...mockSdk,
      cma: {
        ...mockSdk.cma,
        appActionCall: mockAppActionCall,
      },
    } as unknown as ConfigAppSDK

    vi.mocked(useSDK).mockReturnValue(extendedMockSdk)

    const setSelectedModels = vi.fn()
    const initialSelectedModels: SelectedModel[] = [
      {
        entity: 'app',
        entityId: mockSdk.ids.app,
        modelId: 'gemini-pro',
        modelName: 'gemini-pro',
        modelVendor: 'Google',
        modelProvider: 'google-gemini',
      },
    ]

    renderWithQueryClient(
      <GoogleGeminiModelSelection
        {...defaultProps}
        setSelectedModels={setSelectedModels}
        selectedModels={initialSelectedModels}
      />,
    )

    const checkbox = await screen.findByRole('checkbox', { name: 'gemini-pro' })
    fireEvent.click(checkbox)

    expect(setSelectedModels).toHaveBeenCalled()
    const result = getSetSelectedModelsResult(setSelectedModels, initialSelectedModels)
    expect(result).toEqual([])
  })
})

// Helper to get the result from the last call to setSelectedModels
function getSetSelectedModelsResult(mockFn: Mock, prevValue: SelectedModel[]): SelectedModel[] {
  const lastCall = mockFn.mock.calls.at(-1)
  if (!lastCall) throw new Error('No calls to setSelectedModels')
  const arg = lastCall[0]
  if (typeof arg === 'function') {
    // Add a type guard to ensure arg is callable
    return (arg as (prev: SelectedModel[]) => SelectedModel[])(prevValue)
  }
  return arg
}
