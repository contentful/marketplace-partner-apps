import { z } from 'zod'

const discoveredModelSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
})

const successResponseSchema = z.object({
  models: z.array(discoveredModelSchema),
})

const errorResponseSchema = z.object({
  errorMessage: z.string(),
})

const discoveredModelsResponseBodySchema = z.union([successResponseSchema, errorResponseSchema])

export type DiscoveredModel = z.infer<typeof discoveredModelSchema>
export type DiscoveredModelsResponse = z.infer<typeof discoveredModelsResponseBodySchema>

export function isSuccessResponse(
  response: DiscoveredModelsResponse,
): response is z.infer<typeof successResponseSchema> {
  return 'models' in response
}

export function parseDiscoveredModelsResponseBody(body: string): DiscoveredModelsResponse {
  try {
    const parsedJson = JSON.parse(body) as Record<string, unknown>
    const validationResult = discoveredModelsResponseBodySchema.safeParse(parsedJson)
    if (!validationResult.success) {
      return {
        errorMessage: 'Invalid response format from server',
      }
    }
    return validationResult.data
  } catch {
    return {
      errorMessage: 'An error occurred while fetching available models. Please check your API key and try again.',
    }
  }
}
