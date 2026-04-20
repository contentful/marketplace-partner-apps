import * as crypto from 'crypto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateJWT, exchangeJWTForAccessToken, JWTInput } from './google-auth-library'

describe('Google Auth Library', () => {
  const mockCredentials: JWTInput = {
    type: 'service_account',
    project_id: 'mock-project',
    private_key_id: 'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e',
    private_key: generateJunkPrivateKey(),
    client_email: 'service-account@mock-project.iam.gserviceaccount.com',
    client_id: '111111111111111111111',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/service-account%40mock-project.iam.gserviceaccount.com',
    universe_domain: 'googleapis.com',
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('generateJWT', () => {
    it('should generate a valid JWT token', async () => {
      const scope = 'https://www.googleapis.com/auth/generative-language'
      const jwt = await generateJWT(mockCredentials, scope)

      // JWT should be in format: header.payload.signature
      const parts = jwt.split('.')
      expect(parts.length).toBe(3)

      // Ensure we have all parts before proceeding
      if (parts.length !== 3 || !parts[0] || !parts[1]) {
        throw new Error('Invalid JWT format')
      }

      // Decode header and verify contents
      const header = JSON.parse(atob(parts[0]))
      expect(header.alg).toBe('RS256')
      expect(header.typ).toBe('JWT')
      expect(header.kid).toBe(mockCredentials.private_key_id)

      // Decode payload and verify contents
      const payload = JSON.parse(atob(parts[1]))
      expect(payload.iss).toBe(mockCredentials.client_email)
      expect(payload.scope).toBe(scope)
      expect(payload.aud).toBe('https://oauth2.googleapis.com/token')
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
      expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000))
    })

    it('should throw error if private key is missing', async () => {
      const invalidCredentials = { ...mockCredentials, private_key: '' }
      const scope = 'https://www.googleapis.com/auth/generative-language'

      await expect(generateJWT(invalidCredentials, scope)).rejects.toThrow('Private key is missing from credentials')
    })
  })

  describe('exchangeJWTForAccessToken', () => {
    it('should exchange JWT for access token', async () => {
      const mockAccessToken = 'mock-access-token'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: mockAccessToken,
            token_type: 'Bearer',
            expires_in: 3600,
          }),
      })

      const jwt = 'mock.jwt.token'
      const accessToken = await exchangeJWTForAccessToken(jwt)

      expect(accessToken).toBe(mockAccessToken)
      expect(fetch).toHaveBeenCalledWith('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: expect.any(URLSearchParams),
      })
    })

    it('should throw error if token exchange fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      })

      const jwt = 'mock.jwt.token'
      await expect(exchangeJWTForAccessToken(jwt)).rejects.toThrow(
        'Failed to exchange JWT for access token: Unauthorized',
      )
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const jwt = 'mock.jwt.token'
      await expect(exchangeJWTForAccessToken(jwt)).rejects.toThrow('Network error')
    })
  })
})

/**
 * Dynamically generate a junk private key for testing.
 *
 * NB: We do it this way, instead of committing a literal junk key as text, to avoid setting off alarms
 * for the security team :-)
 */
function generateJunkPrivateKey() {
  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })

  return privateKey
}
