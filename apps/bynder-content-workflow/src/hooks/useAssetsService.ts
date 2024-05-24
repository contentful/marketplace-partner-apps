import {
  APICredentials,
  getFile,
  parseCredentials,
  uploadFile,
} from "@/services/api";
import { CFPrepareAsset } from "@/type/types";
import { getAssetUrl, getGCAssetId } from "@/utils/entriesExport";
import { createAssetsFieldValue } from "@/utils/entriesImport";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { AssetProps, CreateAssetProps } from "contentful-management";
import { useRef } from "react";

export default function useAssetsService() {
  const sdk = useSDK<PageAppSDK>();
  const credentials = useRef(parseCredentials(sdk.parameters.installation));
  const DEFAULT_LOCALE = sdk.locales.default;

  async function checkMimeType(asset: CreateAssetProps) {
    const url = asset.fields.file[DEFAULT_LOCALE].upload;
    if (!url) {
      sdk.notifier.error(`Asset ${asset.fields.title[DEFAULT_LOCALE]} is missing a url`);
      return null;
    }
    const type = asset.fields.file[DEFAULT_LOCALE].contentType;
    if (type) {
      return asset;
    }
    let contentType = "application/octet-stream";
    try {
      const response = await fetch(url);
      const retrievedContentType = response.headers.get("Content-Type");
      if (retrievedContentType) {
        contentType = retrievedContentType;
      }
    } catch (error) {
      console.error(error);
    }
    asset.fields.file[DEFAULT_LOCALE].contentType = contentType;
    return asset;
  }

  async function getCfAssetId(
    fieldId: string,
    assetId: string,
    rawAsset: CreateAssetProps
  ) {
    try {
      const existing = await sdk.cma.asset.get({ assetId: assetId });
      return { fieldId, assetId: existing.sys.id };
    } catch (error) {
      // if get throws an error, asset doesn't exist, unfortunately, Contentful didn't provide a proper error code for this
      const checkedAsset = await checkMimeType(rawAsset);
      if (!checkedAsset) {
        return null;
      }
      const uploaded = await sdk.cma.asset.createWithId(
        { assetId: assetId },
        checkedAsset
      );
      try {
        await sdk.cma.asset.processForAllLocales({}, uploaded);
        assetId = uploaded.sys.id;
      } catch (error) {
        assetId = "";
        sdk.notifier.error(
          `Failed to process the asset with id: ${assetId}, will skip it`
        );
      }
    }
    if (!assetId) {
      return null;
    }
    const toPublish = await sdk.cma.asset.get({ assetId });
    await sdk.cma.asset.publish({ assetId }, toPublish);
    return { fieldId, assetId: toPublish.sys.id };
  }

  async function uploadFileFromUrl(asset: AssetProps, projectId: string) {
    const url = getAssetUrl(asset.fields.file[DEFAULT_LOCALE].url);
    if (!url) {
      throw new Error(`Failed to get asset id: ${asset.sys.id} url`);
    }
    const file = await fetch(url);
    const fileBlob = await file.blob();
    const uploadedFile = await uploadFile(
      credentials.current as APICredentials,
      projectId,
      new File([fileBlob], asset.fields.title[DEFAULT_LOCALE] || asset.sys.id, {
        type: asset.fields.file[DEFAULT_LOCALE].contentType || fileBlob.type,
      })
    );
    return uploadedFile?.data
      ? uploadedFile.data.id
      : getGCAssetId(asset.sys.id);
  }

  async function exportAsset(
    fieldId: string,
    asset: AssetProps,
    projectId: string
  ) {
    if (!credentials.current) {
      throw new Error("Missing credentials");
    }
    const existing = await getFile(
      credentials.current,
      projectId,
      getGCAssetId(asset.sys.id)
    );
    if (existing.data) {
      return { fieldId, assetId: existing.data.id };
    }
    if ("code" in existing && existing.code === 404) {
      const newId = await uploadFileFromUrl(asset, projectId);
      return { fieldId, assetId: newId };
    } else {
      throw existing;
    }
  }

  async function uploadAssets(preparedAssets: CFPrepareAsset[]) {
    let cfFields: { [key: string]: any } = {};
    const uploadPromises: Promise<{
      fieldId: string;
      assetId: string;
    } | null>[] = [];
    for (const { fieldId, assetId, rawAsset } of preparedAssets) {
      uploadPromises.push(getCfAssetId(fieldId, assetId, rawAsset));
    }
    const assetData = await Promise.all(uploadPromises);
    const assetsGroupedByField = assetData.reduce<{ [key: string]: string[] }>(
      (acc, curr) => {
        if (!curr) {
          return acc;
        }
        if (acc[curr.fieldId]) {
          acc[curr.fieldId].push(curr.assetId);
        } else {
          acc[curr.fieldId] = [curr.assetId];
        }
        return acc;
      },
      {}
    );
    for (const [fieldId, assetIds] of Object.entries(assetsGroupedByField)) {
      cfFields = {
        ...cfFields,
        ...createAssetsFieldValue(assetIds, fieldId, DEFAULT_LOCALE),
      };
    }
    return cfFields;
  }

  return { exportAsset, uploadAssets };
}
