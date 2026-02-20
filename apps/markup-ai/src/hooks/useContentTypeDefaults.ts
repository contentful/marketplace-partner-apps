/**
 * Hook to fetch and use content type default settings from app installation parameters
 * These defaults can be overridden by field-level settings in local storage
 */

import { useState, useEffect, useMemo } from "react";
import { useSDK } from "@contentful/react-apps-toolkit";
import { FieldAppSDK } from "@contentful/app-sdk";
import type { AppInstallationParameters, ContentTypeSettings } from "../types/appConfig";
import { DEFAULT_CONTENT_TYPE_SETTINGS } from "../types/appConfig";

interface UseContentTypeDefaultsResult {
  defaults: ContentTypeSettings;
  isLoading: boolean;
  contentTypeId: string | null;
  fieldId: string | null;
}

/**
 * Fetches content type default settings from app installation parameters
 * Returns the defaults for the current content type being edited
 */
export function useContentTypeDefaults(): UseContentTypeDefaultsResult {
  const sdk = useSDK<FieldAppSDK>();
  const [defaults, setDefaults] = useState<ContentTypeSettings>(DEFAULT_CONTENT_TYPE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Get the content type ID from the current entry
  const contentTypeId = useMemo(() => {
    try {
      return sdk.entry.getSys().contentType.sys.id;
    } catch {
      return null;
    }
  }, [sdk.entry]);

  // Get the field ID from the SDK
  const fieldId = useMemo(() => {
    try {
      return sdk.field.id;
    } catch {
      return null;
    }
  }, [sdk.field]);

  useEffect(() => {
    if (!contentTypeId) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch app installation parameters synchronously from SDK
      const params = sdk.parameters.installation as AppInstallationParameters | undefined;

      if (params?.contentTypeSettings?.[contentTypeId]) {
        setDefaults(params.contentTypeSettings[contentTypeId]);
      } else {
        setDefaults(DEFAULT_CONTENT_TYPE_SETTINGS);
      }
    } catch (error) {
      console.error("[useContentTypeDefaults] Failed to fetch defaults:", error);
      setDefaults(DEFAULT_CONTENT_TYPE_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, [sdk.parameters.installation, contentTypeId]);

  return {
    defaults,
    isLoading,
    contentTypeId,
    fieldId,
  };
}

export default useContentTypeDefaults;
