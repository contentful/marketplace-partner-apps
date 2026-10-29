import type { BaseAppSDK } from "@contentful/app-sdk";
import { initializeTokenManager, isReady, getAccessToken } from "./TokenManager";
import { getFileFolderIds } from "./MediaflowFolders";
import type { MediaflowFileData } from "../types";

type MediaflowId = string | number;

/**
 * The options of the Mediaflow file selector, see https://docs.mediaflow.site/file-selector/options
 */
interface FileSelectorOptions {
    auth: "accesstoken";
    accesstoken: string;
    locale: string;
    permanentURL: boolean;
    hideUnsafeGDPR: boolean;
    hideUnassignedGDPR: boolean;
    selectedFile: MediaflowId | null;
    selectedFolder: MediaflowId | null;
    success: (data: MediaflowFileData) => void;
    error: (error: unknown) => void;
}

// Defined globally by https://mfstatic.com/js/fileselector.min.js
declare class FileSelector {
    constructor(elementId: string, options: FileSelectorOptions);
}

let scriptPromise: Promise<void> | null = null;
let stylesLoaded = false;
let sdkInstance: BaseAppSDK | null = null;

/**
 * Loads the Mediaflow FileSelector script and styles.
 * 
 * See https://docs.mediaflow.site/file-selector/getting-started
 * 
 * @param _sdkInstance - The Contentful SDK instance from useSDK() 
 * 
 * @returns a Promise which resolves when the file selector script and styles are loaded and rejects when loading the script failed
 */
export async function initializeFileSelector(_sdkInstance: BaseAppSDK): Promise<void> {
    sdkInstance = _sdkInstance;

    if(!stylesLoaded) {
        // Styles are not loaded yet
        const css = document.createElement('link');
        css.href = 'https://mfstatic.com/css/fileselector.min.css';
        css.rel = 'stylesheet';
        document.head.appendChild(css);
        stylesLoaded = true;
    }

    try {
        loadFileSelector();
        await scriptPromise;
    } catch(error) {
        console.error("[ERROR] Error loading file selector script:", error);
        scriptPromise = null;
    }
}

/**
 * Initializes the loading of the file selector, only if it is not loading already
 * 
 */
function loadFileSelector(): void {
    if(scriptPromise) {
        // Script is already loading or loaded
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://mfstatic.com/js/fileselector.min.js';
    script.async = true;
    document.body.appendChild(script);

    scriptPromise = new Promise<void>((resolve, reject) => {
        script.onload = () => {
            resolve();
        }
        script.onerror = () => {
            console.error("[ERROR] Failed to load file selector script.");
            document.body.removeChild(script);
            reject();
        }
    });
}

/**
 * Waits until the file selector is ready to use.
 * 
 * @returns A promise which resolves to true if the file selector is ready to use, false otherwise.
 */
async function isFileSelectorReady(): Promise<boolean> {
    if(!scriptPromise) {
        return false;
    }
    try {
        await scriptPromise;
        return true;
    } catch {
        return false;
    }
}

/**
 * Waits until the file selector is ready and then opens the Mediaflow FileSelector attached to the given DOM element.
 * 
 * @throws Error when the file selector could not get ready. This can happen if the script failed to load.
 * @throws Error when the given DOM element does not have an ID.
 * 
 * @param domElement - The DOM element to which the file selector will be attached.
 * @param successCallback - The mediaflow file selector success callback function:
 * From https://docs.mediaflow.site/file-selector/options:
 * A callback function that is called when the user is finished and the interface is expected to be deleted.
 * It is called with a parameter that is an object with information about the selected file.
 * @param selectedFolderId - Optional folder id, which declares the folder the file selector should open 
 * @param selectedFileId - Optional file id, which declares the file the file selector should open
 * 
 * @returns A promise which resolves when the file selector is opened.
 */
export async function openFileSelector(
    domElement: HTMLElement,
    successCallback: (data: MediaflowFileData) => void,
    selectedFolderId: MediaflowId | null = null,
    selectedFileId: MediaflowId | null = null,
): Promise<void> {
    const ready = await isFileSelectorReady();
    if(!ready) {
        throw new Error("File selector is not ready.");
    }
    if(!domElement.id) {
        throw new Error("Cannot attach file selector to a DOM element without an ID.");
    }

    if(!isReady()) {
        initializeTokenManager(sdkInstance);
    }
    let accessToken;
    try {
        accessToken = await getAccessToken();
    } catch {
        throw new Error("Failed to authenticate with Mediaflow. Please make sure that the app is configured correctly.");
    }

    if(selectedFileId && !selectedFolderId) {
        // Fields created before the folderId was stored (e.g. migrated assets) only have a file id,
        // so look up the folder. If that fails, open the file selector without a preselected file.
        try {
            const folderIds = await getFileFolderIds(selectedFileId, accessToken);
            if(folderIds.length > 1) {
                console.warn("[WARNING] The selected file is in multiple folders. Preselecting the first one.");
                selectedFolderId = folderIds[0];
            } else if (folderIds.length < 1) {
                sdkInstance?.notifier.warning("We could not find the folder this file is in. Please select the file by hand.");
                selectedFolderId = null;
                selectedFileId = null;
            } else {
                selectedFolderId = folderIds[0];
            }
        } catch(error) {
            console.error("[ERROR] An error occurred, while retrieving the folder the selected file (ID: " + selectedFileId + ") is in: ", error);
            sdkInstance?.notifier.warning("We could not find the folder this file is in. Please select the file by hand.");
            selectedFolderId = null;
            selectedFileId = null;
        }
    }

    const fileSelectorConfiguration: FileSelectorOptions = {
        auth: "accesstoken",
        accesstoken: accessToken,
        locale: 'en-US',
        permanentURL: true,
        hideUnsafeGDPR: true,
        hideUnassignedGDPR: true,
        selectedFile: selectedFileId,
        selectedFolder: selectedFolderId,
        success: successCallback,
        error: (error) => { console.error("[ERROR]: An error in the file selector occurred: ", error) }
    };

    new FileSelector(domElement.id, fileSelectorConfiguration);
}
