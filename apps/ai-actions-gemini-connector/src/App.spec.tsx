import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { locations } from '@contentful/app-sdk'

// Create a properly typed mock
const mockUseSDK = vi.fn()

// Mock the useSDK hook
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockUseSDK(),
}))

// Mock the ConfigScreen component
vi.mock('./locations/ConfigScreen', () => ({
  default: () => <div data-testid="config-screen">Config Screen</div>,
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mock return value
    mockUseSDK.mockReturnValue({
      location: {
        is: () => false,
      },
    })
  })

  it('renders ConfigScreen when location is APP_CONFIG', () => {
    mockUseSDK.mockReturnValue({
      location: {
        is: (location: string) => location === locations.LOCATION_APP_CONFIG,
      },
    })

    render(<App />)
    expect(screen.getByTestId('config-screen')).toBeInTheDocument()
  })

  it('renders null when location is not recognized', () => {
    mockUseSDK.mockReturnValue({
      location: {
        is: () => false,
      },
    })

    const { container } = render(<App />)
    expect(container).toBeEmptyDOMElement()
  })

  it('caches component selection with useMemo', () => {
    const mockIs = vi.fn().mockReturnValue(true)
    mockUseSDK.mockReturnValue({
      location: {
        is: mockIs,
      },
    })

    const { rerender } = render(<App />)

    // First render should call is() once
    expect(mockIs).toHaveBeenCalledTimes(1)

    // Rerender should not call is() again due to useMemo
    rerender(<App />)
    expect(mockIs).toHaveBeenCalledTimes(1)
  })
})
