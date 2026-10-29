import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FieldAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Button, Paragraph, Stack, Tooltip } from '@contentful/f36-components';
import JsonField from '../components/JsonField';
import { MEDIAFLOW_CDN_ID } from '../config';
import { ensureTokenManager, getCachedAccessToken } from '../utils/TokenManager';
import { describeMediaflowError, mediaflowJson, mediaflowRequest, MediaflowApiError, metadataCheckForError } from '../utils/MediaflowApi';
import { UPDATABLE_FIELDS, WOBBLE_FIELDS } from '../components/Metadata';
import { updateMetadata, compareMetadata } from '../utils/Util';
import { shouldShowMediaflowLinks } from '../utils/MediaflowUrl';
import { fileIdNeedingFolderLookup, getFileFolderIds } from '../utils/MediaflowFolders';
import { toEntryTitle } from '../utils/UsageReport';
import type { UsageContext, UsageReport } from '../utils/UsageReport';
import { createUsageReporter } from '../utils/UsageReporter';
import type { UsageReporter } from '../utils/UsageReporter';
import type { InstallationParameters, MediaflowFileData, MetadataCheck } from '../types';

type MediaflowId = string | number;

interface CdnResourceResponse {
  url?: string;
  resourceId?: string;
}

interface MediaData {
  mediaId: string;
  fileTypeId: number;
}

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer();
  const [open, setOpen] = useState(false); // Wether the file selector is open (or opening) or not
  const [fieldData, setFieldData] = useState<MediaflowFileData | null>(null);
  const [isUpdatingField, setUpdatingField] = useState(false);
  const showMediaflowLinks = shouldShowMediaflowLinks(sdk.parameters.installation as InstallationParameters);

  useEffect(() => {
    return sdk.field.onValueChanged((value: MediaflowFileData | null) => {
      setFieldData(value);
    });
  }, [sdk.field]);

  const spaceName = useRef<string | null>(null);
  const usageReporter = useRef<UsageReporter | null>(null);

  /**
   * Loads the space name for usage reports. Only called before a report is sent, so viewing an entry costs no extra request
   */
  const loadSpaceName = async (): Promise<void> => {
    if(spaceName.current !== null) {
      return;
    }
    try {
      spaceName.current = (await sdk.cma.space.get({ spaceId: sdk.ids.space })).name;
    } catch(error) {
      console.error("[ERROR] Could not load the space name for usage reports: ", error);
    }
  };

  // A report still waiting for the entry's title is sent when the editor leaves, so it is not lost
  useEffect(() => {
    const sendWaitingReport = () => { usageReporter.current?.flushPending({ keepalive: true }); };
    window.addEventListener("pagehide", sendWaitingReport);
    return () => {
      window.removeEventListener("pagehide", sendWaitingReport);
      sendWaitingReport();
    };
  }, []);

  /**
   * Retrieves the first folder a file is in, for the links to Mediaflow
   *
   * @param fileId - The Mediaflow id of the file
   * @returns The folder id, or null if it could not be retrieved
   */
  const lookUpFolderId = useCallback(async (fileId: MediaflowId): Promise<MediaflowId | null> => {
    ensureTokenManager(sdk);
    try {
      const folderIds = await getFileFolderIds(fileId);
      return folderIds[0] ?? null;
    } catch(error) {
      console.error("[ERROR] Could not retrieve the folder of the file with ID " + fileId + ": ", error);
      return null;
    }
  }, [sdk]);

  // Kept in state only: writing it back to the field would change entries just by viewing them
  const [lookedUpFolderId, setLookedUpFolderId] = useState<MediaflowId | null>(null);
  const fileIdWithoutFolder = fileIdNeedingFolderLookup(fieldData, showMediaflowLinks);

  useEffect(() => {
    setLookedUpFolderId(null);
    if(!fileIdWithoutFolder) {
      return;
    }
    let isCurrent = true;
    lookUpFolderId(fileIdWithoutFolder).then((folderId) => { if(isCurrent) { setLookedUpFolderId(folderId); } });
    return () => { isCurrent = false; };
  }, [fileIdWithoutFolder, lookUpFolderId]);

  // A new object on every render would retrigger the metadata check in JsonField
  const displayedFieldData = useMemo(
    () => (lookedUpFolderId && fieldData ? { ...fieldData, folderId: lookedUpFolderId } : fieldData),
    [fieldData, lookedUpFolderId]
  );

  /**
   * Returns a promise which resolves when a resource's creation is finished, meaning it's status is completed, or rejects if a timeout is reached
   *
   * @param resourceId - The resource id in the Mediaflow cdn
   * @param timeoutMs - The timeoutlimit in milliseconds. Default is 5000 (= 5 seconds)
   * @param delay - The dely between retries. Useful to avoid ratelimiting. Default is 100 (= 10 Requests per second)
   *
   * @throws Error when the timeout is reached, MediaflowApiError when a request fails
   */
  const resourceCreation = async (resourceId: string, timeoutMs = 5000, delay = 100): Promise<void> => {
    if(!resourceId) {
      throw new Error("Cannot ask for resource creation status. No resourceId");
    }

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const resource = await mediaflowJson<{ status?: string }>("cdn/resources/" + resourceId, { method: "GET" });
      if(resource.status === "completed") {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    throw new Error("Timed out waiting for resource " + resourceId);
  }

  /**
   * Retrieves the mediaId used for the cdn and the filetype number associated with the filetype for the file corresponding to the given fileId
   *
   * @param fileId - The id of the file whose mediaId should be retrieved
   *
   * @throws MediaflowApiError when the request fails, Error when the response lacks the ids
   *
   * @returns The mediaId and the fileTypeId
   */
  const getMediaData = async (fileId: MediaflowId): Promise<MediaData> => {
    if(!fileId) {
      throw new Error("Could not retrieve the mediaData since fileId was missing.");
    }

    const result = await mediaflowJson<Array<{ mediaId?: string; type?: { id?: number } }>>("file/" + fileId + "?fields=mediaId,type", { method: "GET" });
    const mediaId = result[0]?.mediaId;
    const fileTypeId = result[0]?.type?.id;
    if (!fileTypeId || !mediaId) {
      throw new Error("Could not retrieve mediaId or fileTypeId. Either one was missing on the resultObject");
    }

    return { mediaId, fileTypeId };
  }

  /**
   * Creates an asset in the mediaflow CDN and returns it's edge-url
   *
   * @param data - The data from which the asset should be created. This will be the data the fileselector returns
   * @param oldResourceId - An optional id of a CDN resource, if there were already a resource
   *
   * @returns The fileselector data object with the url being the edge-url and a resourceId being the cdn's resource id. If the cdn does not support a filetype the original data object will be returned
   */
  const createMediaflowAsset = async (data: MediaflowFileData, oldResourceId: string | undefined): Promise<MediaflowFileData> => {
    ensureTokenManager(sdk);

    if(oldResourceId) {
      deleteMediaflowAsset(oldResourceId); // No need to await this, this can happen asynchronously
    }

    let result: CdnResourceResponse | null;
    try {
      const { mediaId, fileTypeId } = await getMediaData(data.id);
      result = await mediaflowJson<CdnResourceResponse | null>("cdn/resources/", {
        method: "POST",
        body: JSON.stringify({
          imageId: mediaId,
          cdnId: MEDIAFLOW_CDN_ID,
          filename: data.filename,
          filetype: fileTypeId,
          // defaults: {}, // TODO crop
        }),
      });
    } catch(error) {
      // RETURNS the data object if the filetype is not supported by the CDN
      if(error instanceof MediaflowApiError && error.body.match(/filetype.*?not supported/i)) {
        sdk.notifier.warning("The filetype of the selected file is not supported by the Mediaflow CDN. The original file will be kept instead.");
        return data;
      }
      if(error instanceof MediaflowApiError) {
        sdk.notifier.error(describeMediaflowError(error, "create the Mediaflow asset"));
      }
      throw error;
    }

    if(!result || !result.url) {
      throw new Error("Result does not contain url");
    }
    if(!result.resourceId) {
      throw new Error("Result does not contain resourceId");
    }
    let resultUrl = result.url;

    // TODO this is not working currently due to a bug in the CDN. If said bug is fixed use te zoom as well
    if(data.isCropped && data.cropCoordinates && data.canvasWidth && data.canvasHeight) {

      const width = data.width;
      const height = data.height;

      const canvasWidth = data.canvasWidth;
      const canvasHeight = data.canvasHeight;

      const cropCoordinates = data.cropCoordinates;
      let focusX = Math.abs(cropCoordinates.x1 + cropCoordinates.x2) / 2;
      focusX = focusX / canvasWidth; // the percentage in decimals
      focusX *= 100; // the percentage in percent
      focusX = Number(focusX.toFixed(4));

      let focusY = Math.abs(cropCoordinates.y1 + cropCoordinates.y2) / 2;
      focusY = focusY / canvasHeight; // the percentage in decimals
      focusY *= 100; // the percentage in percent
      focusY = Number(focusY.toFixed(4));

      const urlAddon = `?w=${width}&h=${height}&f=auto&fp=${focusX},${focusY}`;
      resultUrl += urlAddon;
    }

    const resourceId = result.resourceId;
    await resourceCreation(resourceId);
    sdk.notifier.success("Your file was successfully uploaded to the CDN.");

    return { ...data, url: resultUrl, resourceId: resourceId };
  }

  /**
   * Deletes a resource in the Mediaflow CDN. Failures are logged, the field is updated anyway
   *
   * @param resourceId - The id of the resource to be deleted in the mediaflow cdn
   */
  const deleteMediaflowAsset = async (resourceId: string): Promise<void> => {
    ensureTokenManager(sdk);
    try {
      await mediaflowRequest("cdn/resources/" + resourceId, { method: "DELETE" });
    } catch(error) {
      console.error("[ERROR] The resource with ID " + resourceId + " could not be deleted: ", error);
      if(error instanceof MediaflowApiError && error.kind === "auth") {
        sdk.notifier.error(describeMediaflowError(error, "delete the Mediaflow CDN resource"));
      }
    }
  }

  /**
   * Checks if metadata is currently up to date.
   * Rate limits (e.g. many Mediaflow fields in one entry) are handled by mediaflowRequest, which retries after a 429.
   *
   * @returns A promise which resolves to an object containing type and value. Type is a string which is one of the Forma36 Badge variants and value is a hint or reason whether the data is up to date or why not.
   */
  const checkMetadata = useCallback(async (): Promise<MetadataCheck | undefined> => {
    const fieldData: MediaflowFileData | null = sdk.field.getValue();
    if(!fieldData) {
      return undefined;
    }
    ensureTokenManager(sdk);

    const requestFields = UPDATABLE_FIELDS.map(field => {
      const wobbleField = WOBBLE_FIELDS.get(field);
      if(wobbleField) {
        return wobbleField.split(".")[0];
      } else {
        return field;
      }
    }).join(",");

    let newMetadata: Record<string, unknown> | undefined;
    try {
      const response = await mediaflowJson<Array<Record<string, unknown>>>("file/" + fieldData.id + "?fields=" + requestFields, { method: "GET" });
      newMetadata = Array.isArray(response) ? response[0] : undefined;
    } catch(error) {
      return metadataCheckForError(error);
    }

    if(!newMetadata) {
      // A successful response without the file: the file has been deleted in Mediaflow
      return { type: "negative", value: "Image got removed" };
    }
    if(!compareMetadata(newMetadata, { ...fieldData })) {
      return { type: "warning", value: "Metadata is outdated" };
    } else {
      return { type: "positive", value: "Metadata is up to date" };
    }
  }, [sdk]);

  /**
   * Sends one usage report to Mediaflow
   *
   * @param fileId - The Mediaflow id of the file
   * @param report - The usage report
   * @param options - keepalive lets the request outlive the page, which only works with the token already cached
   */
  const sendUsageReport = async (fileId: MediaflowId, report: UsageReport, { keepalive }: { keepalive: boolean }): Promise<void> => {
    ensureTokenManager(sdk);
    let accessToken: string | undefined;
    if(keepalive) {
      // The page is closing: no time to refresh a token or wait for a retry
      accessToken = getCachedAccessToken() ?? undefined;
      if(!accessToken) {
        return;
      }
    }

    try {
      await mediaflowRequest("file/" + fileId + "/usage", {
        method: "POST",
        keepalive,
        accessToken,
        retryOnRateLimit: !keepalive,
        body: JSON.stringify(report),
      });
    } catch(error) {
      console.error("[ERROR] Could not report the usage of file " + fileId + ": ", error);
      if(!keepalive && error instanceof MediaflowApiError && error.kind === "auth") {
        sdk.notifier.error(describeMediaflowError(error, "report usage"));
      }
    }
  }

  /**
   * Where the file is used, read when a report is sent so it has the entry's current title
   *
   * @returns The usage context
   */
  const getUsageContext = (): UsageContext => {
    const user = sdk.user;
    const titleField = sdk.contentType.displayField ? sdk.entry.fields[sdk.contentType.displayField] : undefined;
    const isLocalized = (sdk.entry.fields[sdk.field.id]?.locales.length ?? 1) > 1;
    return {
      userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Unknown user", // If first- or lastName exists this is used, else the email is used
      spaceId: sdk.ids.space,
      spaceName: spaceName.current ?? sdk.ids.space,
      environmentId: sdk.ids.environmentAlias || sdk.ids.environment,
      contentTypeName: sdk.contentType.name,
      entryId: sdk.ids.entry,
      entryTitle: toEntryTitle(titleField?.getValue()),
      fieldName: sdk.field.name,
      fieldLocale: isLocalized ? sdk.field.locale : null,
      webappHost: sdk.hostnames.webapp,
    };
  };

  if(!usageReporter.current) {
    const titleField = sdk.contentType.displayField ? sdk.entry.fields[sdk.contentType.displayField] : undefined;
    usageReporter.current = createUsageReporter({
      getContext: getUsageContext,
      send: sendUsageReport,
      onEntryTitleChanged: titleField ? (callback) => titleField.onValueChanged(callback) : null,
    });
  }

  /**
   * Updates the field value with the given data. This modifies data for better querying
   *
   * @param data - The data the file selector returns. If this is null the field is cleared.
   */
  const updateField = async (data: MediaflowFileData | null): Promise<void> => {
    /**
     * TODO think about async updates. Problems:
     *  - with field.setValue(...) twice the check metadata runs twice => one could check the useEffect, and if the asset url is the only thing which has been updated one needn't do the metadata check
     *  - if the user changes the image while an asset is created chaos ensues
     */
    setUpdatingField(true);

    const oldValue: MediaflowFileData | null = sdk.field.getValue();
    const oldResourceId = oldValue?.resourceId;

    let assetPromise;
    if(data) {
      assetPromise = createMediaflowAsset(data, oldResourceId);
    } else if(oldResourceId) {
      deleteMediaflowAsset(oldResourceId);
    }

    await loadSpaceName();
    const oldId = oldValue?.id;
    if(oldId) {
      await usageReporter.current?.reportRemoved(oldId); // Awaiting this, so new usage does not get send before the old usage arrived
    }

    if(data && data.embedMethod === "iframe" && data.embedCode) {
      // This fixes a potential problem in the Contentful web ui. The iframe's embedded code comes with //play.mediaflow.com instead of https://play.mediaflow.com which leads to an error if the app is not serverd over https (which it is not if it comes in an iframe)
      data.embedCode = data.embedCode.replace(/\/\/play.mediaflow.com/, "https://play.mediaflow.com");
    }

    const setValuePromise = sdk.field.setValue(data ? {...data, isMediaflowAsset: true} : data);
    setValuePromise.then(() => { if(data) { usageReporter.current?.reportUsed(data.id); } });

    await updateMetadata(sdk, sdk.field);

    if(assetPromise) {
      Promise.all([assetPromise, setValuePromise]).then(async ([asset]) => {
        const assetUrl = asset.url;
        const resourceId = asset.resourceId;
        const currentValue: MediaflowFileData | null = sdk.field.getValue();
        await sdk.field.setValue({ ...currentValue, url: assetUrl, resourceId: resourceId });
      }).catch(async (error) => {
        console.error("[ERROR] An error occured while trying to set the assetUrl: ", error);
        sdk.notifier.error("Something unexpected happened: Your asset could not be created. Please try again.");
        await sdk.field.setValue(null);
      }).finally(() => {
        setUpdatingField(false);
      });
    } else {
      setUpdatingField(false);
    }
  };

  /**
   * compares if an image is cropped, by fetching original width & height from mediaflow and comparing it to what the fileselector returned
   *
   * @param fileselectorData - the data returned by the file selector
   * @returns true if the Mediaflow asset with the fileselectorData.id has same width and height as the fileselectorData, else false
   */
  const isImageCropped = async (fileselectorData: MediaflowFileData): Promise<boolean> => {
    ensureTokenManager(sdk);
    const { id, width, height } = fileselectorData;
    try {
      const files = await mediaflowJson<Array<{ width?: number; height?: number }>>("file/" + id + "?fields=width,height", { method: "GET" });
      const data = files[0];
      return !(data && data.width == width && data.height == height);
    } catch(error) {
      console.error("[ERROR] Could not confirm if image is cropped: ", error);
      return true; // Images are considered cropped in erronious cases, which prevents uncropping images when changing cdn urls
    }
  }

  const openFileSelector = async (): Promise<void> => {
    if(open) {
      console.warn("[WARNING] File selector is already open or opening. Ignoring open request.");
      sdk.notifier.warning("Please wait until the file selector is closed and the data is updated before opening it again.")
      return;
    }
    setOpen(true);

    const previousValue: MediaflowFileData | null = sdk.field.getValue();

    const result: MediaflowFileData | undefined = await sdk.dialogs.openCurrentApp({
      title: undefined, // Custom title looks bad, so leave it undefined. This removes the close buttons, but selecting a file, pressing escape or clicking on the backdrop closes the dialog
      width: 1000,
      allowHeightOverflow: false,
      minHeight: 800,
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      parameters: {
        selectedFileId: (previousValue && previousValue.id) ?? null,
        selectedFolderId: (previousValue && previousValue.folderId) ?? null,
      }
    });
    if(result) {
      // There will be no result if the user closes the dialog without selecting a file
      if(result.basetype === "image") {
        // Images may be cropped. The fileselector is not returning that
        result.isCropped = await isImageCropped(result);
      }
      await updateField(result);
    }
    setOpen(false);
  };

  const isBusy = open || isUpdatingField;

  if (sdk.field.type === "Object") {
    if (fieldData) {
      return (
        <JsonField
          data={ displayedFieldData }
          showMediaflowLinks={ showMediaflowLinks }
          isBusy={ isBusy }
          openFileSelector={ openFileSelector }
          updateField={ updateField }
          checkMetadata={ checkMetadata }
          refreshMetadata={ () => updateMetadata(sdk, sdk.field) }
        />
      );
    }
    return (
      <Stack flexDirection="column" spacing="spacingS" alignItems="flex-start">
        <Tooltip
          placement="top"
          id="exchange-image-button-disabled-tooltip"
          content="Your file is being postprocessed in the background. This button will be enabled again once it's finished"
          isDisabled={ !open && !isUpdatingField }
        >
          <Button variant="primary" isDisabled={ isBusy } isLoading={ isBusy } onClick={ openFileSelector }>Select asset</Button>
        </Tooltip>
      </Stack>
    );
  } else {
    return <Paragraph>Unsupported field type. This app only supports JSON fields.</Paragraph>;
  }

};

export default Field;
