import { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { ConfigAppSDK } from '@contentful/app-sdk'
import { useSDK } from '@contentful/react-apps-toolkit'
import { AppActionProps } from 'contentful-management/types'
import { useQuery } from '@tanstack/react-query'
import { Card, Checkbox, Note, Skeleton, Text, Tooltip } from '@contentful/f36-components'
import { css } from 'emotion'
import tokens from '@contentful/f36-tokens'
import { SelectedModel } from '../schemas/selectedModels'
import {
  DiscoveredModel,
  DiscoveredModelsResponse,
  isSuccessResponse,
  parseDiscoveredModelsResponseBody,
} from '../schemas/discoveredModels'
import { ModelProvider } from '../types'

export type GoogleGeminiModelSelectionProps = {
  isLoading: boolean
  modelDiscoveryAction: AppActionProps | undefined
  modelProvider: ModelProvider
  apiKey: string | undefined
  credentials: string | undefined
  location: string | undefined
  selectedModels: SelectedModel[]
  setSelectedModels: Dispatch<SetStateAction<SelectedModel[]>>
}

export const GoogleGeminiModelSelection = (props: GoogleGeminiModelSelectionProps) => {
  const sdk = useSDK<ConfigAppSDK>()
  const appId = sdk.ids.app
  const {
    isLoading,
    modelDiscoveryAction,
    modelProvider,
    apiKey,
    credentials,
    location,
    selectedModels,
    setSelectedModels,
  } = props
  const canDoModelDiscovery = Boolean(modelDiscoveryAction?.sys.id) && Boolean(apiKey || credentials)

  const { isLoading: availableModelsLoading, data: discoveredModelsResponse } = useQuery({
    queryKey: ['googleGeminiAvailableModels', modelProvider, apiKey, credentials, location],
    queryFn: async (): Promise<DiscoveredModelsResponse | undefined> => {
      if (!modelDiscoveryAction?.sys.id) {
        return undefined
      }

      const result = await sdk.cma.appActionCall.createWithResponse(
        {
          appDefinitionId: sdk.ids.app || '',
          appActionId: modelDiscoveryAction.sys.id,
        },
        {
          parameters: {
            modelProvider,
            apiKey: modelProvider === 'google-gemini' ? apiKey : undefined,
            credentials: modelProvider === 'google-vertex-ai' ? credentials : undefined,
            location: modelProvider === 'google-vertex-ai' ? location : undefined,
          },
        },
      )

      const data = parseDiscoveredModelsResponseBody(result.response.body)

      if (isSuccessResponse(data)) {
        const validModelNames = data.models.map((model) => model.name)
        // Ensure that when the query discovery is run due to the modelProvider changing we update
        // all selected models to the new modelProvider
        const updatedSelectedModels = selectedModels
          // Let's be cautious and remove any models which are no longer valid with the current provider
          .filter((model) => validModelNames.includes(model.modelId))
          .map((model) => ({ ...model, modelProvider }))
        setSelectedModels(updatedSelectedModels)
      }
      return data
    },
    enabled: canDoModelDiscovery,
  })

  const handleModelSelected = (event: ChangeEvent<HTMLInputElement>, model: DiscoveredModel) => {
    const selectedModel: SelectedModel = {
      entity: 'app',
      entityId: appId,
      modelId: model.name,
      modelName: model.name,
      modelVendor: 'Google',
      modelProvider: modelProvider,
    }

    if (event.target.checked) {
      // Add model to array if checked
      setSelectedModels((prev) => [...prev, selectedModel])
    } else {
      // Remove model from array if unchecked
      setSelectedModels((prev) => prev.filter((m) => m.modelId !== model.name))
    }
  }

  const isModelSelected = (modelId: string) => {
    return selectedModels.some((model) => model.modelId === modelId)
  }

  const isModelConfigLoading = isLoading || availableModelsLoading

  if (!canDoModelDiscovery) {
    return null
  }

  return (
    <Card>
      <Text fontColor="gray500">
        Selected models will be able to be configured for AI Actions in this space environment. Learn more about AI
        Actions.
      </Text>
      {isModelConfigLoading ? (
        <div
          className={css({
            marginTop: tokens.spacingM,
          })}
        >
          <Skeleton.Container>
            <Skeleton.BodyText numberOfLines={4} />
          </Skeleton.Container>
        </div>
      ) : (
        <div className={css({ paddingTop: tokens.spacingM })}>
          {discoveredModelsResponse &&
            isSuccessResponse(discoveredModelsResponse) &&
            discoveredModelsResponse.models.map((model: DiscoveredModel) => (
              <Tooltip key={model.name} content={model.description ?? ''}>
                <Checkbox
                  className={css({ marginBottom: tokens.spacing2Xs })}
                  isChecked={isModelSelected(model.name)}
                  onChange={(event) => {
                    handleModelSelected(event, model)
                  }}
                  value={model.name}
                  id={model.name}
                  key={model.name}
                >
                  {model.displayName}
                </Checkbox>
              </Tooltip>
            ))}
          {discoveredModelsResponse && !isSuccessResponse(discoveredModelsResponse) && (
            <Note variant="warning">
              An error occurred while fetching available models. Please check your API key and try again.
            </Note>
          )}
        </div>
      )}
    </Card>
  )
}
