import { mediaflowJson } from "./MediaflowApi";
import type { MediaflowFileData } from "../types";

interface MediaflowFolder {
    id: string | number;
}

/**
 * Retrieves the ids of the folders a Mediaflow file is in. Fields created before the folderId was stored
 * (e.g. migrated assets) only have a file id, so the folder has to be looked up.
 *
 * @param fileId - The Mediaflow id of the file
 * @param accessToken - OPTIONAL, a token to use instead of the TokenManager's
 *
 * @throws MediaflowApiError when the request fails or the response is not a list of folders
 *
 * @returns The folder ids, empty if the file is in no folder
 */
export async function getFileFolderIds(fileId: string | number, accessToken?: string): Promise<Array<string | number>> {
    const folders = await mediaflowJson<unknown>("file/" + fileId + "/folders", { method: "GET", accessToken });
    if(!Array.isArray(folders)) {
        throw new Error("Unexpected response format");
    }
    return (folders as MediaflowFolder[]).map(folder => folder.id);
}

/**
 * The folder is only needed for the links to Mediaflow, so it is looked up only when they are shown
 *
 * @param fieldData - The stored field data
 * @param showMediaflowLinks - Whether links to the file in Mediaflow are shown
 *
 * @returns The file id whose folder has to be looked up, or null if no lookup is needed
 */
export function fileIdNeedingFolderLookup(fieldData: MediaflowFileData | null, showMediaflowLinks: boolean): string | number | null {
    if(!showMediaflowLinks || !fieldData?.id || fieldData.folderId) {
        return null;
    }
    return fieldData.id;
}
