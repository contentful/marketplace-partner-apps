import type { InstallationParameters } from "../types";

const MEDIAFLOW_APP_URL = "https://app.mediaflow.com/";

/**
 * Installations from before the setting existed lack the parameter, so only an explicit false turns the links off
 *
 * @param installationParameters - The app's installation parameters
 *
 * @returns true if links to files in Mediaflow should be shown
 */
export function shouldShowMediaflowLinks(installationParameters: InstallationParameters | null | undefined): boolean {
  return installationParameters?.showMediaflowLinks !== false;
}

/**
 * Builds the URL which opens a file in the Mediaflow web app
 *
 * @param fileId - The Mediaflow id of the file
 * @param folderId - The Mediaflow id of a folder the file is in
 *
 * @returns The URL to the file, or null if fileId or folderId is missing
 */
export function getMediaflowFileUrl(fileId: string | number | null | undefined, folderId: string | number | null | undefined): string | null {
  if(!fileId || !folderId) {
    return null;
  }

  return MEDIAFLOW_APP_URL + "media/folder/" + encodeURIComponent(folderId) + "/file/" + encodeURIComponent(fileId);
}
