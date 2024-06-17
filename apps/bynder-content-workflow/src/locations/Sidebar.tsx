import { useEffect, useRef, useState } from "react";
import { Button, Note, Stack, Text, Box } from "@contentful/f36-components";
import { SidebarAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { ChevronDownIcon, ChevronUpIcon } from "@contentful/f36-icons";
import { parseCredentials } from "@/services/api";
import { MappingConfig } from "@/type/types";
import { getConfigFromContentType } from "@/utils/parseMapping";
import { getErrorMsg } from "@/utils/common";
import useSidebarFeedback from "@/hooks/useSidebarFeedback";
import { ITEM_NOT_FOUND_MSG } from "@/consts/common";
import useSidebarService from "@/hooks/useSidebarService";
import { appVersion } from "@/appVersion/appVersion";

type Action = "reimportEntry" | "syncChangesToGC";

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const credentials = useRef(parseCredentials(sdk.parameters.installation));
  const { feedback, clearFeedback, handleFeedback } = useSidebarFeedback();
  const [action, setAction] = useState<Action | null>(null);
  const [config, setConfig] = useState<MappingConfig | null>(null);
  const { importEntry, exportEntry } = useSidebarService();

  const isReimportingEntries = action === "reimportEntry";
  const isSyncingChanges = action === "syncChangesToGC";

  const isError = feedback?.type === "error";
  const feedbackMessage = feedback?.message;

  function isConfigLoaded() {
    if (!config) {
      sdk.notifier.error("Error: Failed to load template mapping data");
      handleFeedback("error", "Template mapping data is missing");
      return false;
    }
    return true;
  }

  async function syncChanges() {
    if (!isConfigLoaded() || isSyncingChanges) {
      return;
    }
    setAction("syncChangesToGC");
    clearFeedback();
    try {
      await exportEntry(config as MappingConfig);
      handleFeedback(
        "success",
        "Successfully synced changes to Content Workflow"
      );
    } catch (error: any) {
      console.error(error);
      let errorMsg =
        error.code === 404 ? ITEM_NOT_FOUND_MSG : getErrorMsg(error);
      sdk.notifier.error("Error: Cannot export item: " + errorMsg);
      handleFeedback("error", errorMsg);
    } finally {
      setAction(null);
    }
  }

  async function reimportEntry() {
    if (!isConfigLoaded() || isReimportingEntries) {
      return;
    }
    setAction("reimportEntry");
    clearFeedback();
    try {
      await importEntry(config as MappingConfig);
      handleFeedback("success", "Entry reimport success");
    } catch (error: any) {
      console.error(error);
      let errorMsg =
        error.code === 404 ? ITEM_NOT_FOUND_MSG : getErrorMsg(error);
      sdk.notifier.error("Error: Cannot reimport item: " + errorMsg);
      handleFeedback("error", errorMsg);
    } finally {
      setAction(null);
    }
  }

  useEffect(() => {
    if (!credentials.current) {
      sdk.notifier.error("Please configure the app first");

      handleFeedback("error", "Missing configuration");
      return;
    }

    sdk.window.startAutoResizer();
    setConfig(getConfigFromContentType(sdk.contentType));

    return () => {
      sdk.window.stopAutoResizer();
    };
  }, []);

  return (
    <Box>
      <Stack flexDirection="column" spacing="spacingS" justifyContent="start">
        {feedbackMessage && (
          <Note
            variant={isError ? "negative" : "positive"}
            style={{
              alignSelf: "start",
              width: "100%",
            }}
          >
            {feedbackMessage}
          </Note>
        )}

        {config && (
          <>
            <Button
              variant="primary"
              endIcon={<ChevronDownIcon />}
              onClick={reimportEntry}
              isFullWidth
              isLoading={isReimportingEntries}
              isDisabled={action !== null}
            >
              {isReimportingEntries ? "Reimporting" : "Reimport"} Entry
            </Button>

            <Button
              variant="secondary"
              endIcon={<ChevronUpIcon />}
              onClick={syncChanges}
              isFullWidth
              isLoading={isSyncingChanges}
              isDisabled={action !== null}
            >
              {isSyncingChanges ? "Syncing" : "Sync"} Changes
            </Button>
          </>
        )}
      </Stack>
      <Text marginTop="spacingS" style={{ display: "block", width: "100%", textAlign: "right" }}>
        App Version: v{appVersion}
      </Text>
    </Box>
  );
};

export default Sidebar;
