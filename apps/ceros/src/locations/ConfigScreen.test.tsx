import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ConfigScreen, { AppInstallationParameters } from './ConfigScreen'

// `useSDK` is read at render time, so the mock reads through a ref each test can set.
const { sdkRef } = vi.hoisted(() => ({ sdkRef: { current: null as any } }))
vi.mock('@contentful/react-apps-toolkit', () => ({ useSDK: () => sdkRef.current }))

// What sdk.app.getParameters() hands back for a Secret parameter: a mask, not the key.
const REDACTED_API_KEY = '••••••••••••••••'
const REAL_STORED_KEY = 'ceros-key-that-must-survive'

const CONTENT_TYPE = {
    sys: { id: 'cerosExperience' },
    name: 'Ceros Experience',
    fields: [
        { id: 'title', name: 'Title', type: 'Symbol' },
        { id: 'url', name: 'URL', type: 'Symbol' },
        { id: 'embedCode', name: 'Embed Code', type: 'Text' },
    ],
}

const CONFIGURED: AppInstallationParameters = {
    contentTypeId: 'cerosExperience',
    titleFieldId: 'title',
    urlFieldId: 'url',
    embedCodeFieldId: 'embedCode',
}

type ConfigureResult = { parameters: AppInstallationParameters; targetState: unknown } | false

/** Renders the config screen and returns a handle on the callback it registers with onConfigure. */
async function renderConfigScreen(storedParameters: Record<string, unknown> | null) {
    let registeredOnConfigure: (() => Promise<ConfigureResult>) | undefined
    let registeredOnCompleted: ((error: null | { message: string }) => void) | undefined

    // Stands in for what the platform has stored, so a save can be observed to change it.
    let stored = storedParameters

    sdkRef.current = {
        app: {
            getParameters: vi.fn(() => Promise.resolve(stored)),
            setReady: vi.fn(),
            getCurrentState: vi.fn().mockResolvedValue(null),
            onConfigure: vi.fn((cb: () => Promise<ConfigureResult>) => {
                registeredOnConfigure = cb
            }),
            onConfigurationCompleted: vi.fn((cb: (error: null | { message: string }) => void) => {
                registeredOnCompleted = cb
            }),
        },
        ids: { space: 'space-id', environment: 'master', app: 'app-id' },
        cma: {
            contentType: {
                getMany: vi.fn().mockResolvedValue({ items: [CONTENT_TYPE] }),
                createWithId: vi.fn(),
                publish: vi.fn(),
            },
        },
    }

    render(<ConfigScreen />)

    // Wait for the stored parameters to land before any test interacts with the form.
    await waitFor(() => expect(sdkRef.current.app.getParameters).toHaveBeenCalled())
    await screen.findByDisplayValue('Ceros Experience')

    return {
        get apiKeyInput() {
            return screen.getByTestId('ceros-api-key') as HTMLInputElement
        },
        save: async () => {
            const result = await registeredOnConfigure!()
            return result
        },
        /** Applies a save to the stand-in store the way the platform would, then notifies the app. */
        completeSave: async (result: ConfigureResult) => {
            if (result !== false) {
                stored = { ...result.parameters } as Record<string, unknown>
            }
            await act(async () => {
                registeredOnCompleted!(null)
            })
        },
    }
}

function typeApiKey(input: HTMLInputElement, value: string) {
    fireEvent.change(input, { target: { value } })
}

describe('ConfigScreen — Ceros API key handling', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('never seeds the input with the stored (redacted) key', async () => {
        const { apiKeyInput } = await renderConfigScreen({ ...CONFIGURED, cerosApiKey: REDACTED_API_KEY })

        expect(apiKeyInput.value).toBe('')
    })

    it('sends the loaded mask back when a key is stored and none is typed', async () => {
        // Omitting the property clears the stored secret, so a re-save has to send something.
        const { save } = await renderConfigScreen({ ...CONFIGURED, cerosApiKey: REDACTED_API_KEY })

        const result = await save()

        expect(result).not.toBe(false)
        const { parameters } = result as Exclude<ConfigureResult, false>
        expect(parameters.cerosApiKey).toBe(REDACTED_API_KEY)
    })

    it('omits cerosApiKey entirely when no key has ever been stored', async () => {
        const { save } = await renderConfigScreen({ ...CONFIGURED })

        const result = await save()

        const { parameters } = result as Exclude<ConfigureResult, false>
        expect('cerosApiKey' in parameters).toBe(false)
    })

    it('saves a newly typed key, replacing the stored one', async () => {
        const { apiKeyInput, save } = await renderConfigScreen({ ...CONFIGURED, cerosApiKey: REDACTED_API_KEY })

        typeApiKey(apiKeyInput, REAL_STORED_KEY)
        const result = await save()

        const { parameters } = result as Exclude<ConfigureResult, false>
        expect(parameters.cerosApiKey).toBe(REAL_STORED_KEY)
    })

    it('saves the key on an install that has never had one', async () => {
        const { apiKeyInput, save } = await renderConfigScreen({ ...CONFIGURED })

        typeApiKey(apiKeyInput, REAL_STORED_KEY)
        const result = await save()

        const { parameters } = result as Exclude<ConfigureResult, false>
        expect(parameters.cerosApiKey).toBe(REAL_STORED_KEY)
    })

    it('treats a whitespace-only entry as "no new key" rather than saving it as the key', async () => {
        const { apiKeyInput, save } = await renderConfigScreen({ ...CONFIGURED, cerosApiKey: REDACTED_API_KEY })

        typeApiKey(apiKeyInput, '   ')
        const result = await save()

        const { parameters } = result as Exclude<ConfigureResult, false>
        expect(parameters.cerosApiKey).toBe(REDACTED_API_KEY)
    })

    it('trims a typed key before saving it', async () => {
        const { apiKeyInput, save } = await renderConfigScreen({ ...CONFIGURED })

        typeApiKey(apiKeyInput, `  ${REAL_STORED_KEY}  `)
        const result = await save()

        const { parameters } = result as Exclude<ConfigureResult, false>
        expect(parameters.cerosApiKey).toBe(REAL_STORED_KEY)
    })

    it('stops claiming a key is saved once a save has removed it', async () => {
        // Guards the failure mode where the hint reports page-load state forever: the user
        // re-saves, the key does not survive, and the screen still reassures them it is there.
        const { save, completeSave } = await renderConfigScreen({ ...CONFIGURED, cerosApiKey: REDACTED_API_KEY })
        expect(screen.getByText(/already saved/i)).toBeInTheDocument()

        // Simulate a save that did not carry the key through.
        await completeSave({ parameters: { ...CONFIGURED }, targetState: null })

        await waitFor(() => expect(screen.queryByText(/already saved/i)).not.toBeInTheDocument())
    })

    it('reports a key as saved after one is entered and the save completes', async () => {
        const { apiKeyInput, save, completeSave } = await renderConfigScreen({ ...CONFIGURED })
        expect(screen.queryByText(/already saved/i)).not.toBeInTheDocument()

        typeApiKey(apiKeyInput, REAL_STORED_KEY)
        await completeSave(await save())

        await waitFor(() => expect(screen.getByText(/already saved/i)).toBeInTheDocument())
        // The field must not redisplay what was just saved.
        expect(screen.getByTestId('ceros-api-key')).toHaveValue('')
    })

    it('tells the user a key is already saved only when one is', async () => {
        await renderConfigScreen({ ...CONFIGURED, cerosApiKey: REDACTED_API_KEY })
        expect(screen.getByText(/already saved/i)).toBeInTheDocument()
    })

    it('prompts for a key when none is stored', async () => {
        await renderConfigScreen({ ...CONFIGURED })
        expect(screen.queryByText(/already saved/i)).not.toBeInTheDocument()
        expect(screen.getByPlaceholderText(/Enter your Ceros REST API key/i)).toBeInTheDocument()
    })
})
