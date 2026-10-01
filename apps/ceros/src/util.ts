import { CMAClient, ConfigAppSDK } from '@contentful/app-sdk'
import { DEFAULT_CONTENT_TYPE, DEFAULT_CONTENT_TYPE_ID } from './config'

// Handles errors by setting the error message and logging the error
export function handleError(message: string, setErrorMessage: Function, error?: any) {
    setErrorMessage(message)
    console.error(message)
    if (error) {
        console.error(error.message)
    }
}

// Creates the default content type and assign the app as an entry editor for all fields
export async function createDefaultContentType(sdk: ConfigAppSDK, cma: CMAClient) {
    // Create the content type
    const createdContentType = await cma.contentType.createWithId(
        {
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            contentTypeId: DEFAULT_CONTENT_TYPE_ID,
        },
        DEFAULT_CONTENT_TYPE
    )
    await cma.contentType.publish({ contentTypeId: createdContentType.sys.id }, createdContentType)
    return createdContentType.sys.id
}

// Fetches all content types in the space and set them in state
export async function fetchAllContentTypes(
    cma: CMAClient,
    spaceId: string,
    environmentId: string,
    setAllContentTypes: Function
) {
    const contentTypes = await cma.contentType.getMany({
        spaceId: spaceId,
        environmentId: environmentId,
    })
    setAllContentTypes(contentTypes.items)
}
