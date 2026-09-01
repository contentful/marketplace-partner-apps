import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppInstallationParameters, handler } from './model-discovery'
import { FunctionTypeEnum, AppActionRequest, FunctionEventContext } from '@contentful/node-apps-toolkit'

// Mock the JWT generation and token exchange
const mocks = vi.hoisted(() => {
  return {
    generateJWT: vi.fn(),
    exchangeJWTForAccessToken: vi.fn(),
  }
})
vi.mock('./vendor/google-auth-library', () => ({
  generateJWT: mocks.generateJWT,
  exchangeJWTForAccessToken: mocks.exchangeJWTForAccessToken,
}))

describe('model-discovery', () => {
  const mockApiKey = 'test-api-key'
  const mockModelsResponse = {
    models: [
      // This model is available for Vertex AI and Gemini API
      {
        name: 'models/gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash',
        description: 'Gemini 2.0 Flash model',
        supportedGenerationMethods: ['generateContent'],
      },
      // However, these two models are only available for Gemini API
      {
        name: 'models/gemini-pro',
        displayName: 'Gemini Pro',
        description: 'Gemini Pro model',
        supportedGenerationMethods: ['generateContent'],
      },
      {
        name: 'models/gemini-pro-vision',
        displayName: 'Gemini Pro Vision',
        description: 'Gemini Pro Vision model',
        supportedGenerationMethods: ['generateContent'],
      },
      {
        name: 'models/model-without-description',
        displayName: 'Model Without Description',
        supportedGenerationMethods: ['generateContent'],
      },
    ],
  }
  const mockModelsPermissionDeniedResponse = {
    error: {
      code: 403,
      message:
        "Method doesn't allow unregistered callers (callers without established identity). Please use API Key or other form of API consumer identity to call this API.",
      status: 'PERMISSION_DENIED',
    },
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return available models when valid API key is provided', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockModelsResponse),
    })

    const event = {
      body: {
        modelProvider: 'google-gemini',
        apiKey: mockApiKey,
      },
      type: FunctionTypeEnum.AppActionCall,
      headers: {},
    } as AppActionRequest<'Custom', { modelProvider: 'google-gemini'; apiKey: string }>
    const result = await invokeHandler(event)

    expect(result).toEqual({
      models: [
        {
          name: 'gemini-2.0-flash',
          displayName: 'Gemini 2.0 Flash',
          description: 'Gemini 2.0 Flash model',
        },
        {
          name: 'gemini-pro',
          displayName: 'Gemini Pro',
          description: 'Gemini Pro model',
        },
        {
          name: 'gemini-pro-vision',
          displayName: 'Gemini Pro Vision',
          description: 'Gemini Pro Vision model',
        },
        {
          name: 'model-without-description',
          displayName: 'Model Without Description',
        },
      ],
    })
  })

  it('should return error when API request fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'))

    const event = {
      body: {
        modelProvider: 'google-gemini',
        apiKey: mockApiKey,
      },
      type: FunctionTypeEnum.AppActionCall,
      headers: {},
    } as AppActionRequest<'Custom', { modelProvider: 'google-gemini'; apiKey: string }>

    const result = await invokeHandler(event)

    expect(result).toEqual({
      errorMessage: 'API Error',
    })
  })

  it('should handle HTTP error response with invalid API key', async () => {
    const errorResponse = {
      error: {
        code: 400,
        message: 'API key not valid. Please pass a valid API key.',
        status: 'INVALID_ARGUMENT',
      },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve(errorResponse),
    })

    const event = {
      body: {
        modelProvider: 'google-gemini',
        apiKey: 'invalid-api-key',
      },
      type: FunctionTypeEnum.AppActionCall,
      headers: {},
    } as AppActionRequest<'Custom', { modelProvider: 'google-gemini'; apiKey: string }>

    const result = await invokeHandler(event)

    expect(result).toEqual({
      errorMessage: 'Invalid models response',
    })
  })

  it('should handle pagination with nextPageToken', async () => {
    const firstPageResponse = {
      models: [
        {
          name: 'models/gemini-pro',
          displayName: 'Gemini Pro',
          description: 'Gemini Pro model',
          supportedGenerationMethods: ['generateContent'],
        },
      ],
      nextPageToken: 'next-page-token',
    }

    const secondPageResponse = {
      models: [
        {
          name: 'models/gemini-pro-vision',
          displayName: 'Gemini Pro Vision',
          description: 'Gemini Pro Vision model',
          supportedGenerationMethods: ['generateContent'],
        },
      ],
    }

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve(firstPageResponse),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve(secondPageResponse),
      })

    const event = {
      body: {
        modelProvider: 'google-gemini',
        apiKey: mockApiKey,
      },
      type: FunctionTypeEnum.AppActionCall,
      headers: {},
    } as AppActionRequest<'Custom', { modelProvider: 'google-gemini'; apiKey: string }>

    const result = await invokeHandler(event)

    expect(result).toEqual({
      models: [
        {
          name: 'gemini-pro',
          displayName: 'Gemini Pro',
          description: 'Gemini Pro model',
        },
        {
          name: 'gemini-pro-vision',
          displayName: 'Gemini Pro Vision',
          description: 'Gemini Pro Vision model',
        },
      ],
    })
  })

  it('should handle non-Error objects in error handling', async () => {
    global.fetch = vi.fn().mockRejectedValue('Kaboom')

    const event = {
      body: {
        modelProvider: 'google-gemini',
        apiKey: mockApiKey,
      },
      type: FunctionTypeEnum.AppActionCall,
      headers: {},
    } as AppActionRequest<'Custom', { modelProvider: 'google-gemini'; apiKey: string }>

    const result = await invokeHandler(event)

    expect(result).toEqual({
      errorMessage: 'Kaboom',
    })
  })

  it('should return error for invalid model provider', async () => {
    const event = {
      body: {
        modelProvider: 'invalid-provider',
        apiKey: mockApiKey,
      },
      type: FunctionTypeEnum.AppActionCall,
      headers: {},
    } as unknown as AppActionRequest<'Custom', { modelProvider: 'google-gemini' | 'google-vertex-ai'; apiKey: string }>

    const result = await invokeHandler(event)

    expect(result).toEqual({
      errorMessage: 'Invalid model provider',
    })
  })

  it('should handle masked API key for google-gemini provider', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockModelsResponse),
    })

    const event = {
      body: {
        modelProvider: 'google-gemini',
        apiKey: '********',
      },
      type: FunctionTypeEnum.AppActionCall,
      headers: {},
    } as AppActionRequest<'Custom', { modelProvider: 'google-gemini'; apiKey: string }>
    const context = {
      appInstallationParameters: {
        modelProvider: 'google-gemini',
        apiKey: mockApiKey,
      },
    } as FunctionEventContext<AppInstallationParameters>

    const result = await invokeHandler(event, context)

    expect(result).toEqual({
      models: [
        {
          name: 'gemini-2.0-flash',
          displayName: 'Gemini 2.0 Flash',
          description: 'Gemini 2.0 Flash model',
        },
        {
          name: 'gemini-pro',
          displayName: 'Gemini Pro',
          description: 'Gemini Pro model',
        },
        {
          name: 'gemini-pro-vision',
          displayName: 'Gemini Pro Vision',
          description: 'Gemini Pro Vision model',
        },
        {
          name: 'model-without-description',
          displayName: 'Model Without Description',
        },
      ],
    })
  })

  // NB: This is an edge case just to get to 100% branch coverage..
  it('should error when masked API key is provided but app has no install params for google-gemini provider', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockModelsPermissionDeniedResponse),
    })

    const event = {
      body: {
        modelProvider: 'google-gemini',
        apiKey: '********',
      },
      type: FunctionTypeEnum.AppActionCall,
      headers: {},
    } as AppActionRequest<'Custom', { modelProvider: 'google-gemini'; apiKey: string }>
    const context = {
      appInstallationParameters: {},
    } as FunctionEventContext<AppInstallationParameters>

    const result = await invokeHandler(event, context)

    expect(result).toEqual({
      errorMessage: 'Invalid models response',
    })
  })

  describe('google-vertex-ai provider', () => {
    const mockCredentials = JSON.stringify({
      client_email: 'test@example.com',
      private_key: 'test-key',
    })

    beforeEach(() => {
      vi.resetAllMocks()
    })

    it('should return available models when valid credentials are provided', async () => {
      const mockToken = 'mock-access-token'

      mocks.generateJWT.mockResolvedValue('mock-jwt')
      mocks.exchangeJWTForAccessToken.mockResolvedValue(mockToken)

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockModelsResponse),
      })

      const event = {
        body: {
          modelProvider: 'google-vertex-ai',
          credentials: mockCredentials,
          location: 'us-central1',
        },
        type: FunctionTypeEnum.AppActionCall,
        headers: {},
      } as AppActionRequest<'Custom', { modelProvider: 'google-vertex-ai'; credentials: string }>

      const result = await invokeHandler(event)

      expect(result).toEqual({
        models: [
          {
            name: 'gemini-2.0-flash',
            displayName: 'Gemini 2.0 Flash',
            description: 'Gemini 2.0 Flash model',
          },
        ],
      })

      // Verify the fetch was called with the correct headers
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://generativelanguage.googleapis.com/v1beta/models'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
            'content-type': 'application/json',
          }),
        }),
      )
    })

    it('should handle invalid credentials format', async () => {
      const event = {
        body: {
          modelProvider: 'google-vertex-ai',
          credentials: 'invalid-json',
        },
        type: FunctionTypeEnum.AppActionCall,
        headers: {},
      } as AppActionRequest<'Custom', { modelProvider: 'google-vertex-ai'; credentials: string }>

      const result = await invokeHandler(event)

      expect(result).toEqual({
        errorMessage: 'Unexpected token \'i\', "invalid-json" is not valid JSON',
      })
    })

    it('should handle token generation failure', async () => {
      // Mock the JWT generation to fail
      const error = new Error('Token generation failed')
      mocks.generateJWT.mockRejectedValue(error)

      const event = {
        body: {
          modelProvider: 'google-vertex-ai',
          credentials: mockCredentials,
        },
        type: FunctionTypeEnum.AppActionCall,
        headers: {},
      } as AppActionRequest<'Custom', { modelProvider: 'google-vertex-ai'; credentials: string }>

      const result = await invokeHandler(event)

      expect(result).toEqual({
        errorMessage: error.message,
      })
    })

    it('should handle API request failure after token generation', async () => {
      mocks.generateJWT.mockResolvedValue('mock-jwt')
      mocks.exchangeJWTForAccessToken.mockResolvedValue('mock-access-token')

      global.fetch = vi.fn().mockRejectedValue(new Error('API request failed'))

      const event = {
        body: {
          modelProvider: 'google-vertex-ai',
          credentials: mockCredentials,
          location: 'us-central1',
        },
        type: FunctionTypeEnum.AppActionCall,
        headers: {},
      } as AppActionRequest<'Custom', { modelProvider: 'google-vertex-ai'; credentials: string }>

      const result = await invokeHandler(event)

      expect(result).toEqual({
        errorMessage: 'API request failed',
      })
    })

    it('should filter out deprecated models and models without generateContent support', async () => {
      const mockToken = 'mock-access-token'
      mocks.generateJWT.mockResolvedValue('mock-jwt')
      mocks.exchangeJWTForAccessToken.mockResolvedValue(mockToken)

      const mockResponseWithDeprecatedModels = {
        models: [
          {
            name: 'models/gemini-2.0-flash-lite-001',
            displayName: 'Gemini 2.0 Flash Lite',
            description: 'Gemini 2.0 Flash Lite model',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'models/deprecated-model',
            displayName: 'Deprecated Model',
            description: 'This model is deprecated',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'models/no-content-model',
            displayName: 'No Content Model',
            description: 'This model does not support content generation',
            supportedGenerationMethods: ['otherMethod'],
          },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponseWithDeprecatedModels),
      })

      const event = {
        body: {
          modelProvider: 'google-vertex-ai',
          credentials: mockCredentials,
          location: 'us-central1',
        },
        type: FunctionTypeEnum.AppActionCall,
        headers: {},
      } as AppActionRequest<'Custom', { modelProvider: 'google-vertex-ai'; credentials: string; location: string }>

      const result = await invokeHandler(event)

      expect(result).toEqual({
        models: [
          {
            name: 'gemini-2.0-flash-lite-001',
            displayName: 'Gemini 2.0 Flash Lite',
            description: 'Gemini 2.0 Flash Lite model',
          },
        ],
      })
    })

    it('should handle models with missing location', async () => {
      const mockToken = 'mock-access-token'
      mocks.generateJWT.mockResolvedValue('mock-jwt')
      mocks.exchangeJWTForAccessToken.mockResolvedValue(mockToken)

      const mockResponse = {
        models: [
          {
            name: 'models/gemini-2.0-flash-lite-001',
            displayName: 'Gemini 2.0 Flash Lite',
            description: 'Gemini 2.0 Flash Lite model',
            supportedGenerationMethods: ['generateContent'],
          },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      const event = {
        body: {
          modelProvider: 'google-vertex-ai',
          credentials: mockCredentials,
          location: '', // Empty location
        },
        type: FunctionTypeEnum.AppActionCall,
        headers: {},
      } as AppActionRequest<'Custom', { modelProvider: 'google-vertex-ai'; credentials: string; location: string }>

      const result = await invokeHandler(event)

      expect(result).toEqual({
        errorMessage: 'Location is required for Google Vertex AI',
      })
    })

    it('should handle unknown location', async () => {
      const mockToken = 'mock-access-token'
      mocks.generateJWT.mockResolvedValue('mock-jwt')
      mocks.exchangeJWTForAccessToken.mockResolvedValue(mockToken)

      const mockResponse = {
        models: [
          {
            name: 'models/gemini-pro',
            displayName: 'Gemini Pro',
            description: 'Gemini Pro model',
            supportedGenerationMethods: ['generateContent'],
          },
        ],
      }

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      const event = {
        body: {
          modelProvider: 'google-vertex-ai',
          credentials: mockCredentials,
          location: 'unknown-location',
        },
        type: FunctionTypeEnum.AppActionCall,
        headers: {},
      } as AppActionRequest<'Custom', { modelProvider: 'google-vertex-ai'; credentials: string; location: string }>

      const result = await invokeHandler(event)

      expect(result).toEqual({
        models: [], // Should return empty array for unknown location
      })
    })

    it('should handle masked credentials for google-vertex-ai provider', async () => {
      const mockToken = 'mock-access-token'

      mocks.generateJWT.mockResolvedValue('mock-jwt')
      mocks.exchangeJWTForAccessToken.mockResolvedValue(mockToken)

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockModelsResponse),
      })

      const event = {
        body: {
          modelProvider: 'google-vertex-ai',
          credentials: '********',
          location: 'us-central1',
        },
        type: FunctionTypeEnum.AppActionCall,
        headers: {},
      } as AppActionRequest<'Custom', { modelProvider: 'google-vertex-ai'; credentials: string; location: string }>
      const context = {
        appInstallationParameters: {
          modelProvider: 'google-vertex-ai',
          credentials: mockCredentials,
          location: 'us-central1',
        },
      } as FunctionEventContext<AppInstallationParameters>

      const result = await invokeHandler(event, context)

      expect(result).toEqual({
        models: [
          {
            name: 'gemini-2.0-flash',
            displayName: 'Gemini 2.0 Flash',
            description: 'Gemini 2.0 Flash model',
          },
        ],
      })
    })
  })
})

async function invokeHandler(
  event: AppActionRequest<
    'Custom',
    { modelProvider: 'google-gemini' | 'google-vertex-ai'; apiKey?: string; credentials?: string }
  >,
  context?: FunctionEventContext<AppInstallationParameters>,
) {
  context ??= {
    appInstallationParameters: {},
  } as FunctionEventContext<AppInstallationParameters>

  return await handler(event as AppActionRequest<never, never>, context)
}
