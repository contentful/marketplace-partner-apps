/**
 * Bare minimum functions to get a Google auth token for given service credentials.
 *
 * This is necessary because the google-auth-library package cannot be used in Cloudflare workers.
 *
 * The code this file replicates is:
 *
 * ```typescript
 * import { GoogleAuth, JWTInput } from 'google-auth-library'
 *
 * const auth = new GoogleAuth({
 *   credentials,
 *   scopes: ['https://www.googleapis.com/auth/generative-language'],
 * })
 *
 * const client = await auth.getClient()
 * const accessToken = await client.getAccessToken()
 * const token = accessToken.token // <-- This is the token we need
 * ```
 *
 * This is a well known problem for CloudFlare workers and several similar solutions can be found online:
 * - https://gist.github.com/markelliot/6627143be1fc8209c9662c504d0ff205
 * - https://ryan-schachte.com/blog/oauth_cloudflare_workers/
 * - https://github.com/kriasoft/web-auth-library (unfortunately not working due to our cache configuration on CloudFlare, also appears unmaintained)
 * - https://github.com/Schachte/cloudflare-google-auth (unfortuantely not a published package, appears unmaintained)
 */

/**
 * Bare minimum interface to satisfy the GoogleAuth constructor.
 */
export interface JWTInput {
  type: string
  project_id: string
  private_key_id: string
  client_email: string
  private_key: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
  universe_domain: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export async function generateJWT(credentials: JWTInput, scope: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: credentials['private_key_id'],
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials['client_email'],
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, // 1 hour from now
    iat: now,
  }

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signatureInput = `${encodedHeader}.${encodedPayload}`

  // Convert private key from PEM to ArrayBuffer
  const privateKeyPem = credentials['private_key']
  if (!privateKeyPem) {
    throw new Error('Private key is missing from credentials')
  }

  const privateKeyDer = await crypto.subtle.importKey(
    'pkcs8',
    new Uint8Array(
      atob(
        privateKeyPem
          .replace('-----BEGIN PRIVATE KEY-----', '')
          .replace('-----END PRIVATE KEY-----', '')
          .replace(/\s/g, ''),
      )
        .split('')
        .map((c) => c.charCodeAt(0)),
    ),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  )

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKeyDer,
    new TextEncoder().encode(signatureInput),
  )

  // Convert signature to base64url
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${signatureInput}.${signatureBase64}`
}

export async function exchangeJWTForAccessToken(jwt: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to exchange JWT for access token: ${response.statusText}`)
  }

  const data = (await response.json()) as TokenResponse
  return data.access_token
}
