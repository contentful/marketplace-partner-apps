import { z } from 'zod'

/**
 * Schema for validating Google Cloud Platform service account credentials JSON files.
 * This schema ensures that the JSON file contains all required fields for a valid
 * service account credentials file.
 */
export const gcpCredentialsSchema = z
  .object({
    type: z.literal('service_account'),
    project_id: z.string().min(1),
    private_key_id: z.string().min(1),
    private_key: z.string().min(1),
    client_email: z.string().email(),
    client_id: z.string().min(1),
    auth_uri: z.string().url(),
    token_uri: z.string().url(),
    auth_provider_x509_cert_url: z.string().url(),
    client_x509_cert_url: z.string().url(),
    universe_domain: z.string().optional(),
  })
  .strict()

export type GcpCredentials = z.infer<typeof gcpCredentialsSchema>

/**
 * Schema for validating JSON encoded GCP credentials.
 *
 * This also handles the case where the credentials have been obfuscated as asterixes because we
 * use the type "secret" for this app installation parameter.
 */
export const gcpCredentialsJSONSchema = z
  .string()
  .min(1, 'GCP credentials are required')
  .refine(
    (val) => {
      if (val.match(/^\*+$/)) {
        return true
      }

      try {
        const parsed = JSON.parse(val) as unknown
        return gcpCredentialsSchema.safeParse(parsed).success
      } catch {
        return false
      }
    },
    { message: 'Invalid GCP credentials format' },
  )
