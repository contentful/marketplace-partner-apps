import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import { GoogleGeminiConfig } from './GoogleGeminiConfig'

describe('GoogleGeminiConfig', () => {
  const mockSetApiKey = vi.fn()
  const mockSetModelProvider = vi.fn()
  const defaultProps = {
    apiKey: '',
    setApiKey: mockSetApiKey,
    isLoading: false,
    modelProvider: 'google-gemini' as const,
    setModelProvider: mockSetModelProvider,
    credentials: undefined,
    setCredentials: vi.fn(),
    location: undefined,
    setLocation: vi.fn(),
  }

  beforeEach(() => {
    vi.useFakeTimers()
    mockSetApiKey.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with initial props', () => {
    render(<GoogleGeminiConfig {...defaultProps} />)

    expect(screen.getByText(/To connect this app to the Gemini API/)).toBeInTheDocument()
    expect(screen.getByLabelText(/API key/)).toBeInTheDocument()
  })

  it('shows validation error when API key is empty', async () => {
    vi.useRealTimers() // Use real timers for this test
    render(<GoogleGeminiConfig {...defaultProps} />)

    const input = screen.getByLabelText(/API key/)

    // First type something to mark the input as dirty
    act(() => {
      fireEvent.change(input, { target: { value: 'some-value' } })
    })

    // Then clear it and blur to trigger validation
    act(() => {
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.blur(input)
    })

    // Wait for validation message
    const validationMessage = await screen.findByText('API key is required.', {}, { timeout: 1000 })
    expect(validationMessage).toBeInTheDocument()
  })

  it('updates API key after debounce period', () => {
    render(<GoogleGeminiConfig {...defaultProps} />)

    const input = screen.getByLabelText(/API key/)
    act(() => {
      fireEvent.change(input, { target: { value: 'new-api-key' } })
      vi.advanceTimersByTime(2000)
    })

    expect(mockSetApiKey).toHaveBeenCalledWith('new-api-key')
  })

  it('updates API key immediately on blur', () => {
    render(<GoogleGeminiConfig {...defaultProps} />)

    const input = screen.getByLabelText(/API key/)
    act(() => {
      fireEvent.change(input, { target: { value: 'new-api-key' } })
      fireEvent.blur(input)
    })

    expect(mockSetApiKey).toHaveBeenCalledWith('new-api-key')
  })

  it('disables input when loading', () => {
    render(<GoogleGeminiConfig {...defaultProps} isLoading={true} />)

    const input = screen.getByLabelText(/API key/)
    expect(input).toBeDisabled()
  })

  it('initializes with provided API key', () => {
    render(<GoogleGeminiConfig {...defaultProps} apiKey="initial-key" />)

    const input = screen.getByLabelText(/API key/)
    expect(input).toHaveValue('initial-key')
  })

  it('clears API key when input is cleared', () => {
    render(<GoogleGeminiConfig {...defaultProps} apiKey="initial-key" />)

    const input = screen.getByLabelText(/API key/)
    act(() => {
      fireEvent.change(input, { target: { value: '' } })
      fireEvent.blur(input)
    })

    expect(mockSetApiKey).toHaveBeenCalledWith('')
  })
})
