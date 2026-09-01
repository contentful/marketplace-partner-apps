import { z } from 'zod'

const selectedModelSchema = z.object({
  modelId: z.string(),
  modelName: z.string(),
  modelVendor: z.string(),
  modelProvider: z.enum(['google-gemini', 'google-vertex-ai']),
  entity: z.literal('app'),
  entityId: z.string(),
})

export const selectedModelsArraySchema = z.array(selectedModelSchema).optional()

export type SelectedModel = z.infer<typeof selectedModelSchema>

export function parseSelectedModelsFromParameters(parameterValue: string | undefined): SelectedModel[] {
  if (!parameterValue) {
    return []
  }

  try {
    const parsedJson = JSON.parse(parameterValue) as Record<string, unknown>
    const validationResult = selectedModelsArraySchema.safeParse(parsedJson)

    if (!validationResult.success) {
      console.error('Invalid selected models format:', validationResult.error)
      return []
    }

    return validationResult.data ?? []
  } catch (error) {
    console.error('Error parsing selected models:', error)
    return []
  }
}
