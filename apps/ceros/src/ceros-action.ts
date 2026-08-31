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
export async function findCerosActionId(sdk: EditorAppSDK): Promise<string> {
    const actions = await sdk.cma.appAction.getMany({
        organizationId: sdk.ids.organization,
        appDefinitionId: sdk.ids.app || '',
    })
    const found =
        actions.items.find((a) => a.sys.id === CEROS_ACTION_ID) ?? actions.items.find((a) => a.name === 'CerosApi')
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
