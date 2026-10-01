import { EditorAppSDK } from '@contentful/app-sdk'

export interface Paging {
    total: number
    page: number
    pages: number
    pageSize: number
    next?: string
    previous?: string
}

export interface CerosActionResult {
    data?: any
    paging?: Paging
    error?: string
}

export const CEROS_ACTION_MISSING_ERROR =
    'The CerosApi App Action is not set up. Run "npm run upsert-actions" after deploying.'

// The id pinned in contentful-app-manifest.json, which `npm run upsert-actions` upserts.
export const CEROS_ACTION_ID = 'cerosApi'

// Looks up the CerosApi App Action's id. Prefers the pinned id, falling back to a
// name match so installs created before the id was pinned keep resolving.
//
// Scoped by space/environment rather than organizationId: the app definition can be
// managed in a different org than the one the app is installed into, so
// sdk.ids.organization (the install org) can't be used to look up its App Actions.
export async function findCerosActionId(sdk: EditorAppSDK): Promise<string> {
    const appId = sdk.ids.app || ''
    const actions = await sdk.cma.appAction.getManyForEnvironment({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
    })
    const found = actions.items.find(
        (a) => a.sys.appDefinition?.sys.id === appId && (a.sys.id === CEROS_ACTION_ID || a.name === 'CerosApi')
    )
    if (!found) throw new Error(CEROS_ACTION_MISSING_ERROR)
    return found.sys.id
}

// Invokes the CerosApi function and returns its result envelope. A `failed`
// call status is a transport/platform failure and throws; a business failure
// comes back as `{ error }` in the envelope for the caller to surface.
export async function callCerosAction(
    sdk: EditorAppSDK,
    actionId: string,
    params: Record<string, unknown>
): Promise<CerosActionResult> {
    const call = await sdk.cma.appActionCall.createWithResult(
        {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            appDefinitionId: sdk.ids.app || '',
            appActionId: actionId,
        },
        { parameters: params }
    )
    if (call.sys.status === 'failed') {
        const err = (call.sys as any).error
        throw new Error(`Function call failed: ${err?.message ?? JSON.stringify(err)}`)
    }
    return (call.sys as any).result as CerosActionResult
}
