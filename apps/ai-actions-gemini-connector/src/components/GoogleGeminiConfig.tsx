import {
  Card,
  Form,
  FormControl,
  Text,
  TextInput,
  Radio,
  Stack,
  Button,
  Note,
  Select,
} from '@contentful/f36-components'
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ModelProvider } from '../types'
import { gcpCredentialsJSONSchema } from '../schemas/gcpCredentials'
import { Resolver } from 'react-hook-form'
import { VERTEX_AI_REGION_OPTIONS } from './constants'

/**
 * How long to wait after the user stops typing before updating the API key,
 * which will trigger the model discovery action to run again.
 */
const DEBOUNCE_TIME = 2000

const validRegionValues = Object.values(VERTEX_AI_REGION_OPTIONS)
  .flat()
  .map((option) => option.value) as [string, ...string[]]

const formSchema = z.discriminatedUnion('modelProvider', [
  z.object({
    modelProvider: z.literal('google-gemini'),
    apiKey: z.string().min(1, 'API key is required'),
    credentials: z.string().optional(),
    location: z.string().optional(),
  }),
  z.object({
    modelProvider: z.literal('google-vertex-ai'),
    apiKey: z.string().optional(),
    credentials: gcpCredentialsJSONSchema,
    location: z.enum(validRegionValues, {
      required_error: 'Location is required',
      invalid_type_error: 'Invalid Vertex AI region',
    }),
  }),
])

type FormValues = z.infer<typeof formSchema>

type GoogleGeminiConfigProps = {
  apiKey: string | undefined
  setApiKey: Dispatch<SetStateAction<string | undefined>>
  isLoading: boolean
  modelProvider: ModelProvider
  setModelProvider: Dispatch<SetStateAction<ModelProvider>>
  credentials: string | undefined
  setCredentials: Dispatch<SetStateAction<string | undefined>>
  location: string | undefined
  setLocation: Dispatch<SetStateAction<string | undefined>>
}

export const GoogleGeminiConfig = (props: GoogleGeminiConfigProps) => {
  const {
    apiKey,
    setApiKey,
    isLoading,
    modelProvider,
    setModelProvider,
    credentials,
    setCredentials,
    location,
    setLocation,
  } = props
  const [localApiKey, setLocalApiKey] = useState(apiKey)

  const resolver = zodResolver(formSchema) as Resolver<FormValues>
  const {
    register,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    values:
      modelProvider === 'google-gemini'
        ? { modelProvider: 'google-gemini', apiKey: apiKey || '', credentials: undefined, location: undefined }
        : {
            modelProvider: 'google-vertex-ai',
            apiKey: undefined,
            credentials: credentials || '',
            location: location || '',
          },
    reValidateMode: 'onChange',
    resolver,
  })

  // Whenever credentials changes upstream, trigger a re-validation
  useEffect(() => {
    void trigger('credentials')
  }, [credentials, trigger])

  // Debounced API key update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localApiKey !== apiKey) {
        setApiKey(localApiKey || '')
      }
    }, DEBOUNCE_TIME)

    return () => {
      clearTimeout(timer)
    }
  }, [localApiKey, apiKey, setApiKey])

  const handleApiKeyChange = useCallback(
    (value: string) => {
      setLocalApiKey(value)
      setValue('apiKey', value, {
        shouldTouch: true,
        shouldDirty: true,
      })
      void trigger('apiKey')
    },
    [setValue, trigger],
  )

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        try {
          const rawCredentials = await file.text()
          setCredentials(rawCredentials)
        } catch (error: unknown) {
          console.error('Error reading JSON file:', error)
          setCredentials('')
        }
      }
    },
    [setCredentials],
  )

  const handleBlur = useCallback(() => {
    if (localApiKey !== apiKey) {
      setApiKey(localApiKey || '')
    }
  }, [localApiKey, apiKey, setApiKey])

  const credentialsState: 'neutral' | 'positive' | 'negative' = useMemo(() => {
    if (errors.credentials) {
      return 'negative'
    }
    return credentials ? 'positive' : 'neutral'
  }, [errors.credentials, credentials])

  return (
    <Card>
      <Text fontColor="gray500">Please select a model provider to make use of Gemini models with AI Actions.</Text>
      <Form>
        <FormControl isRequired isInvalid={!!errors.modelProvider}>
          <FormControl.Label marginTop="spacingM">Model Provider</FormControl.Label>
          <Stack flexDirection="row">
            <Radio
              id="gemini-api"
              name="model-provider"
              value="google-gemini"
              isChecked={modelProvider === 'google-gemini'}
              onChange={() => {
                setModelProvider('google-gemini')
              }}
              isDisabled={isLoading}
            >
              Gemini API
            </Radio>
            <Radio
              id="vertex-ai"
              name="model-provider"
              value="google-vertex-ai"
              isChecked={modelProvider === 'google-vertex-ai'}
              onChange={() => {
                setModelProvider('google-vertex-ai')
              }}
              isDisabled={isLoading}
            >
              Vertex AI
            </Radio>
          </Stack>
        </FormControl>
        {modelProvider === 'google-gemini' && (
          <FormControl isRequired isInvalid={!!errors.apiKey}>
            <FormControl.Label marginTop="spacingM">API key</FormControl.Label>
            <TextInput
              type="password"
              {...register('apiKey', { required: true })}
              onChange={({ target: { value } }) => {
                handleApiKeyChange(value)
              }}
              onBlur={handleBlur}
              isDisabled={isLoading}
            />
            {!!errors.apiKey && (
              <FormControl.ValidationMessage data-testid="cf-ui-form-control-validation-message">
                API key is required.
              </FormControl.ValidationMessage>
            )}
            <FormControl.HelpText>
              To connect this app to the Gemini API, please enter your API key, which can be obtained from the Google
              Cloud Console.
            </FormControl.HelpText>
          </FormControl>
        )}
        {modelProvider === 'google-vertex-ai' && (
          <>
            <FormControl isRequired isInvalid={!!errors.credentials}>
              <FormControl.Label marginTop="spacingM">Vertex AI Credentials JSON</FormControl.Label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => void handleFileChange(e)}
                disabled={isLoading}
                style={{ display: 'none' }}
                id="credentials-file-input"
              />
              <Note
                variant={credentialsState}
                title={
                  credentialsState === 'positive'
                    ? 'Successfully uploaded Vertex AI credentials'
                    : credentialsState === 'negative'
                      ? 'Error uploading credentials'
                      : undefined
                }
                style={{ width: '100%' }}
              >
                <Stack flexDirection="column" spacing="spacingM" alignItems="start">
                  {credentialsState === 'neutral' && (
                    <Text>To connect this app to the Vertex AI API please upload your GCP credentials JSON file.</Text>
                  )}
                  {credentialsState === 'positive' && (
                    <Text>
                      Your Vertex AI service account credentials have been validated and uploaded successfully.
                    </Text>
                  )}
                  {credentialsState === 'negative' && (
                    <Text>
                      {typeof errors.credentials?.message === 'string'
                        ? errors.credentials.message
                        : 'Google GCP credentials JSON file is required.'}
                    </Text>
                  )}

                  <Button
                    onClick={() => document.getElementById('credentials-file-input')?.click()}
                    isDisabled={isLoading}
                    variant="secondary"
                  >
                    {credentialsState === 'positive' ? 'Upload a different file' : 'Upload Vertex AI credentials'}
                  </Button>
                </Stack>
              </Note>
              <FormControl.HelpText>
                Note, the service account for these credentials must have at least the <strong>Vertex AI User</strong>{' '}
                role.
              </FormControl.HelpText>
              <TextInput type="hidden" {...register('credentials', { required: true })} />
            </FormControl>
            <FormControl isRequired isInvalid={!!errors.location}>
              <FormControl.Label marginTop="spacingM">Location</FormControl.Label>
              <Select
                {...register('location', { required: true })}
                onChange={({ target: { value } }) => {
                  setLocation(value)
                }}
                onBlur={handleBlur}
                isDisabled={isLoading}
              >
                {Object.entries(VERTEX_AI_REGION_OPTIONS).flatMap(([region, options]) => [
                  <Select.Option key={region} value="" isDisabled>
                    {region}
                  </Select.Option>,
                  ...options.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  )),
                ])}
              </Select>
              <FormControl.HelpText>The GCP location to use for accessing the Vertex AI API.</FormControl.HelpText>
            </FormControl>
          </>
        )}
      </Form>
    </Card>
  )
}
