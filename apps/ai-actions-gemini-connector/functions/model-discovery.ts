import { FunctionEventHandler } from '@contentful/node-apps-toolkit'
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings'
import invariant from 'invariant'
import { z } from 'zod'
import { VERTEX_AI_KNOWN_AVAILABLE_MODELS } from './constants'
import { JWTInput, exchangeJWTForAccessToken, generateJWT } from './vendor/google-auth-library'

const modelSchema = z.object({
  supportedGenerationMethods: z.array(z.string()),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
})

const modelsResponseSchema = z.object({
  models: z.array(modelSchema),
  nextPageToken: z.string().optional(),
})

type Model = z.infer<typeof modelSchema>
type ModelsResponse = z.infer<typeof modelsResponseSchema>

async function parseModelsResponse(response: Response): Promise<ModelsResponse | undefined> {
  const parsedJson = (await response.json()) as unknown
  const validationResult = modelsResponseSchema.safeParse(parsedJson)
  return validationResult.data
}

type ReturnedModel = {
  name: string
  displayName: string
  description: string | undefined
}

type ModelProvider = 'google-gemini' | 'google-vertex-ai'

function generativeAIUrl(apiKey: string, nextPageToken?: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageToken=${nextPageToken ?? ''}`
}

function generativeAIFetcher(apiKey: string) {
  return (nextPageToken?: string) =>
    fetch(generativeAIUrl(apiKey, nextPageToken), {
      headers: {
        'content-type': 'application/json',
      },
    })
}

/**
 * Generate a short-lived bearer token usable for the Google Generative AI API.
 */
async function generateToken(credentialsString: string): Promise<string> {
  const credentials = JSON.parse(credentialsString) as JWTInput
  const jwt = await generateJWT(credentials, 'https://www.googleapis.com/auth/generative-language')
  return exchangeJWTForAccessToken(jwt)
}

/**
 * We can make use of the `/v1beta/models` endpoint using service account credentials, but we need to pass
 * the `x-goog-user-project` header and use a Bearer token instead of sending the `key` query parameter.
 */
function vertexAiUrl(nextPageToken?: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models?pageToken=${nextPageToken ?? ''}`
}

async function vertexAIFetcher(credentials: string) {
  const token = await generateToken(credentials)

  return async (nextPageToken?: string) => {
    return fetch(vertexAiUrl(nextPageToken), {
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  }
}

function isModelAvailableForVertexAI(modelName: string, location: string) {
  if (!VERTEX_AI_KNOWN_AVAILABLE_MODELS[location]) {
    return false
  }
  return VERTEX_AI_KNOWN_AVAILABLE_MODELS[location].includes(modelName)
}

/**
 * Filter out models which will not work for our AI Actions use case.
 *
 * Currently this is:
 * - Models which are deprecated
 * - Models which do not support content generation
 */
function aiActionsSuitableModels(models: Model[], modelProvider: 'google-gemini', location: undefined): Model[]
function aiActionsSuitableModels(models: Model[], modelProvider: 'google-vertex-ai', location: string): Model[]
function aiActionsSuitableModels(models: Model[], modelProvider: ModelProvider, location: string | undefined): Model[] {
  return models.filter((model) => {
    const description = model.description ?? ''
    return (
      !description.match(/deprecated/i) &&
      model.supportedGenerationMethods.includes('generateContent') &&
      (modelProvider === 'google-gemini' ||
        // FIXME: This type cast to string is unnecessary, need to tweak the function overloading I suspect
        isModelAvailableForVertexAI(model.name, location as string))
    )
  })
}

async function getAvailableModels(
  fetcher: (nextPageToken?: string) => Promise<Response>,
  modelProvider: ModelProvider,
  location: string | undefined
): Promise<ReturnedModel[]> {
  let response: Response
  let nextPageToken: string | undefined
  const models: ReturnedModel[] = []
  do {
    response = await fetcher(nextPageToken)
    const data = await parseModelsResponse(response)
    if (!data) {
      throw new Error('Invalid models response')
    }

    const filteredModels = aiActionsSuitableModels(data.models, modelProvider, location)
    const returnableModels = filteredModels.map((model) => ({
      name: model.name.replace(/^models\//, ''),
      displayName: model.displayName,
      description: model.description,
    }))
    models.push(...returnableModels)

    nextPageToken = data.nextPageToken
  } while (nextPageToken)

  return models
}

interface GoogleGeminiCustomEventBody {
  modelProvider: 'google-gemini'
  apiKey: string
}

interface VertexAICustomEventBody {
  modelProvider: 'google-vertex-ai'
  credentials: string
  location: string
}

type CustomEventBody = GoogleGeminiCustomEventBody | VertexAICustomEventBody

export type AppInstallationParameters = {
  modelProvider: ModelProvider | undefined
  apiKey: string | undefined
  credentials: string | undefined
  location: string | undefined
}

/**
 * We use this hack to improve the UX of the app installation flow.
 *
 * By taking advantage of both parameters passed to the function, from React, and the persisted
 * `context.appInstallationParameters` we are able to make the model discovery work correctly on initial page load
 * and subsequent function invocations from user edits in the UI.
 */
function resolveSecret(bodyParam: string, installParam: string | undefined) {
  return bodyParam.match(/^\*+$/) ? installParam ?? '' : bodyParam
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall, AppInstallationParameters> = async (
  event: AppActionRequest<'Custom', CustomEventBody>,
  context: FunctionEventContext<AppInstallationParameters>
) => {
  return wrapWithErrorTransform(async () => {
    let fetcher
    let location: string | undefined

    const installParams = context.appInstallationParameters

    log('Starting model discovery', { modelProvider: event.body.modelProvider })

    switch (event.body.modelProvider) {
      case 'google-gemini':
        fetcher = generativeAIFetcher(resolveSecret(event.body.apiKey, installParams.apiKey))
        break
      case 'google-vertex-ai':
        fetcher = await vertexAIFetcher(resolveSecret(event.body.credentials, installParams.credentials))
        location = event.body.location
        invariant(location, 'Location is required for Google Vertex AI')
        break
      default:
        throw new Error('Invalid model provider')
    }
    const models = await getAvailableModels(fetcher, event.body.modelProvider, location)

    log('Model discovery complete', { numModelsFound: models.length })

    return { models }
  })
}

// TODO: Ideally we would use AppActionResponseError (from @contentful/app-action-utils), but this is causing a TS error I haven't found the cause of yet
type ErrorResponse = {
  errorMessage: string
}

async function wrapWithErrorTransform<T>(fn: () => Promise<T>): Promise<T | ErrorResponse> {
  try {
    return await fn()
  } catch (error: unknown) {
    let stack: string | undefined
    let errorMessage: string

    if (error instanceof Error) {
      stack = error.stack
      errorMessage = error.message
    } else {
      errorMessage = String(error)
    }

    log('Error in model discovery', { errorMessage, stack })

    return {
      errorMessage,
    }
  }
}

function log(message: string, ...args: unknown[]) {
  console.log(`[ai-actions-gemini-connector] ${message}`, ...args)
}
