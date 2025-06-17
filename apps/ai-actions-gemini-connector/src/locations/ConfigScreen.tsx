import { ConfigAppSDK } from '@contentful/app-sdk'
import { Flex, Heading, Notification, Text } from '@contentful/f36-components'
import tokens from '@contentful/f36-tokens'
import { useSDK } from '@contentful/react-apps-toolkit'
import { css } from '@emotion/css'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'

import { GoogleGeminiConfig } from '../components/GoogleGeminiConfig'
import { GoogleGeminiModelSelection } from '../components/GoogleGeminiModelSelection'
import { AppInstallationParameters, ModelProvider } from '../types'
import { parseSelectedModelsFromParameters, SelectedModel, selectedModelsArraySchema } from '../schemas/selectedModels'
import { gcpCredentialsJSONSchema } from '../schemas/gcpCredentials'

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>()
  const [ready, setReady] = useState(false)
  const [modelProvider, setModelProvider] = useState<ModelProvider>('google-gemini')
  const [apiKey, setApiKey] = useState<string | undefined>(undefined)
  const [location, setLocation] = useState<string | undefined>('us-central1')
  const [credentials, setCredentials] = useState<string | undefined>(undefined)
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([])

  // Separate queries for better type inference and error handling
  const {
    data: isAppInstalled,
    isLoading: isAppInstalledLoading,
    refetch: refetchAppInstalled,
  } = useQuery({
    queryKey: ['app.isInstalled'],
    queryFn: () => sdk.app.isInstalled(),
    enabled: ready,
  })

  const {
    data: modelDiscoveryAction,
    isLoading: isAppActionLoading,
    refetch: refetchAppAction,
  } = useQuery({
    queryKey: ['app.action.modelDiscovery'],
    queryFn: async () => {
      const appActions = await sdk.cma.appAction.getManyForEnvironment({
        environmentId: sdk.ids.environment,
      })

      return appActions.items.find(
        (appAction) => appAction.name === 'Model Discovery' && appAction.sys.appDefinition.sys.id === sdk.ids.app,
      )
    },
    enabled: ready,
  })

  const isGoogleGeminiConfigLoading = !ready
  const isModelSelectionLoading = !ready || isAppActionLoading

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState()

    // Validate the selectedModels array before stringifying
    const validationResult = selectedModelsArraySchema.safeParse(selectedModels)

    if (!validationResult.success) {
      console.error('Invalid selected models state:', validationResult.error)
      void Notification.error('Error saving configuration: Invalid model selection format')
      return false
    }

    // Validate the credentials if they are present
    const credentialsValidationResult = gcpCredentialsJSONSchema.safeParse(credentials)
    if (credentials !== undefined && !credentialsValidationResult.success) {
      console.error('Invalid credentials state:', credentialsValidationResult.error)
      void Notification.error('Error saving configuration: Invalid credentials format')
      return false
    }

    // If we get here, the credentials are valid
    return {
      parameters: {
        modelProvider,
        apiKey: modelProvider === 'google-gemini' ? apiKey : undefined,
        credentials: modelProvider === 'google-vertex-ai' ? credentials : undefined,
        location: modelProvider === 'google-vertex-ai' ? location : undefined,
        selectedModels: JSON.stringify(selectedModels),
      },
      targetState: currentState,
    }
  }, [sdk, modelProvider, apiKey, credentials, location, selectedModels])

  /**
   * When the app transitions from uninstalled -> installed we need to refetch the app.isInstalled query
   * to prevent the screen from getting stuck in the `isInstalled = false` state. Also we need to refetch
   * the app.action.modelDiscovery query so the model selection can execute its app action.
   */
  const onConfigurationCompleted = useCallback(() => {
    void refetchAppInstalled()
    void refetchAppAction()
  }, [refetchAppInstalled, refetchAppAction])

  useEffect(() => {
    sdk.app.onConfigure(onConfigure)
    sdk.app.onConfigurationCompleted(onConfigurationCompleted)
  }, [sdk, onConfigure, onConfigurationCompleted])

  useEffect(() => {
    void sdk.app.setReady().then(async () => {
      const parameters = await sdk.app.getParameters<AppInstallationParameters>()

      setModelProvider(parameters?.modelProvider ?? 'google-gemini')
      setSelectedModels(parseSelectedModelsFromParameters(parameters?.selectedModels))

      if (parameters?.modelProvider === 'google-gemini') {
        setApiKey(parameters.apiKey)
      } else if (parameters?.modelProvider === 'google-vertex-ai') {
        setCredentials(parameters.credentials)
        setLocation(parameters.location)
      }

      setReady(true)
    })
  }, [sdk])

  if (!ready || isAppInstalledLoading) {
    return null
  }

  return (
    <div
      className={css({
        margin: `${tokens.spacing4Xl} auto`,
        maxWidth: '450px',
      })}
    >
      <Flex flexDirection="column" alignContent="center" gap="spacingM">
        <Heading>Connect to Google Gemini</Heading>
        {isAppInstalled ? (
          <>
            <GoogleGeminiConfig
              isLoading={isGoogleGeminiConfigLoading}
              modelProvider={modelProvider}
              setModelProvider={setModelProvider}
              apiKey={apiKey}
              setApiKey={setApiKey}
              credentials={credentials}
              setCredentials={setCredentials}
              location={location}
              setLocation={setLocation}
            />
            <GoogleGeminiModelSelection
              isLoading={isModelSelectionLoading}
              modelProvider={modelProvider}
              apiKey={apiKey}
              credentials={credentials}
              location={location}
              modelDiscoveryAction={modelDiscoveryAction}
              selectedModels={selectedModels}
              setSelectedModels={setSelectedModels}
            />
          </>
        ) : (
          <Text>Click "Install" in the top-right corner to begin configuration of the Google Gemini connector.</Text>
        )}
      </Flex>
    </div>
  )
}

export default ConfigScreen
