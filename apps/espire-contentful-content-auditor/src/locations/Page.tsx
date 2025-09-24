import { useEffect, useState } from "react";
import {
  Button,
  Box,
  Flex,
  Spinner,
  Tooltip,
} from "@contentful/f36-components";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { generateReport } from "../lib/generateReport";
import { generateMediaReport } from "../lib/generateMediaReport";
import { deleteAssets } from "../lib/deleteAssets";
import { generateUnusedContentTypesReport } from "../lib/generateUnusedContentTypesReport";
import { getSpaceDetails } from "../lib/getSpaceDetails";
import { getCmaToken } from "../lib/getAppParameters";
import { fetchContentTypes } from "../lib/fetchContentTypes";
import GenerateEntryReport from "../components/Reports/GenerateEntryReport";
import { deleteEntries } from "../lib/deleteEntries";
import ContentTypeSelector from "../components/ContentTypeSelector/ContentTypeSelector";
import GenerateMediaReport from "../components/Reports/GenerateMediaReport";
import "../styles/global.css";
import NotFound from "./NotFound";
import { PageIcon, AssetIcon, FolderOpenIcon } from "@contentful/f36-icons";
import GenerateUnusedContentTypesReport from "../components/Reports/GenerateUnusedContentTypesReport";

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [accessToken, setAccessToken] = useState("");
  const [, setSpaceName] = useState("");
  const [spaceId, setSpaceId] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [selectedContentType, setSelectedContentType] = useState("");
  const [fetchingTypes, setFetchingTypes] = useState(false);
  const [unusedEntries, setUnusedEntries] = useState<any[]>([]);
  const [unusedMedia, setUnusedMedia] = useState<any[]>([]);
  const [unusedContentTypes, setUnusedContentTypes] = useState<any[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(
    []
  );
  const [loadingState, setLoadingState] = useState<
    "entries" | "media" | "types" | null
  >(null);
  const [, setHasGenerated] = useState(false);
  const [, setShowContentTypeDropdown] = useState(false);
  const [isGeneratingEntryReport, setIsGeneratingEntryReport] = useState(false);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [activeReport, setActiveReport] = useState<"entry" | "media" | "types">(
    "entry"
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const initialize = async () => {
      const { spaceId, environmentId, spaceName } = await getSpaceDetails(sdk);
      setSpaceId(spaceId);
      setEnvironmentId(environmentId);
      setSpaceName(spaceName);
      const token = getCmaToken(sdk);
      if (token) setAccessToken(token);
    };
    initialize();
  }, [sdk]);

  useEffect(() => {
    const fetchTypes = async () => {
      if (!accessToken || !spaceId || !environmentId) return;
      setFetchingTypes(true);
      try {
        const data = await fetchContentTypes(
          spaceId,
          environmentId,
          accessToken
        );
        setContentTypes(data.items);
        if (data.items.length > 0) setSelectedContentType(data.items[0].sys.id);
      } catch (err) {
        console.error("Failed to fetch content types", err);
      } finally {
        setFetchingTypes(false);
      }
    };
    fetchTypes();
  }, [accessToken, spaceId, environmentId]);

  const resetReports = () => {
    setUnusedEntries([]);
    setUnusedMedia([]);
    setUnusedContentTypes([]);
    setSelectedContentTypes([]);
    setHasGenerated(false);
    setPage(0);
    setItemsPerPage(20);
    setSearchQuery("");
  };

  const handleGenerateMediaReport = async () => {
    if (!spaceId || !environmentId || !accessToken) return;
    resetReports();
    setActiveReport("media");
    setLoadingState("media");
    try {
      await generateMediaReport(
        accessToken,
        spaceId,
        environmentId,
        setUnusedMedia,
        () => setHasGenerated(true)
      );
    } catch (error) {
      console.error("Error generating media report:", error);
    } finally {
      setLoadingState(null);
    }
  };

  const handleGenerateUnusedContentTypeReport = async () => {
    if (!accessToken || !spaceId || !environmentId) return;
    resetReports();
    setActiveReport("types");
    setLoadingState("types");
    try {
      const result = await generateUnusedContentTypesReport(
        accessToken,
        spaceId,
        environmentId
      );
      setUnusedContentTypes(result);
      setHasGenerated(true);
    } catch (error) {
      console.error("Error generating unused content types report:", error);
    } finally {
      setLoadingState(null);
    }
  };

  const handleDeleteContentTypes = async () => {
    for (const typeId of selectedContentTypes) {
      try {
        await fetch(
          `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/content_types/${typeId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.warn(`Failed to delete content type ${typeId}:`, error);
      }
    }
    setSelectedContentTypes([]);
    await handleGenerateUnusedContentTypeReport();
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const toggleContentTypeSelection = (id: string) => {
    setSelectedContentTypes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteAssets = () => {
    deleteAssets(selectedAssets, accessToken, spaceId, environmentId, () => {
      setSelectedAssets([]);
      handleGenerateMediaReport();
    });
  };

  const handleDeleteEntries = (entryIds: string[]) => {
    deleteEntries(entryIds, accessToken, spaceId, environmentId, () => {
      setUnusedEntries([]);
      setHasGenerated(false);
    });
  };

  const handleEntryReportSelect = async (contentTypeId: string) => {
    setSelectedContentType(contentTypeId);
    setIsGeneratingEntryReport(true);
    setLoadingState("entries");
    resetReports();
    try {
      await generateReport(
        accessToken,
        spaceId,
        environmentId,
        setUnusedEntries,
        () => setHasGenerated(true),
        contentTypeId
      );
    } catch (error) {
      console.error("Error generating entry report:", error);
    } finally {
      setIsGeneratingEntryReport(false);
      setLoadingState(null);
      setShowContentTypeDropdown(false);
    }
  };

  return (
    <Flex flexDirection="column" gap="spacingM">
      <Box className="flex-design flex-direction-row">
        <Flex
          gap="spacing2Xs"
          className="flex-design flex-direction left-side-menu flex-item-left border-right"
        >
          <Tooltip
            content="Unlinked Content Entries Report"
            maxWidth={360}
            placement="right"
          >
            <Button
              variant={activeReport === "entry" ? "primary" : "secondary"}
              onClick={() => {
                setActiveReport("entry");
                setShowContentTypeDropdown(true);
                resetReports();
              }}
              isDisabled={!accessToken || loadingState !== null}
            >
              <Box as="span" className="flex-design align-item-center">
                <PageIcon size="small" /> Unlinked Content Entries
              </Box>
            </Button>
          </Tooltip>

          <Tooltip content="Unused Media" maxWidth={360} placement="right">
            <Button
              variant={activeReport === "media" ? "primary" : "secondary"}
              onClick={handleGenerateMediaReport}
              isLoading={loadingState === "media"}
              isDisabled={!accessToken || loadingState !== null}
            >
              <Box as="span" className="flex-design align-item-center">
                <AssetIcon size="small" /> Unused Media Report
              </Box>
            </Button>
          </Tooltip>
          <Tooltip
            content="Unused Content Types Report"
            maxWidth={360}
            placement="right"
          >
            <Button
              variant={activeReport === "types" ? "primary" : "secondary"}
              onClick={handleGenerateUnusedContentTypeReport}
              isLoading={loadingState === "types"}
              isDisabled={!accessToken || loadingState !== null}
            >
              <Box as="span" className="flex-design align-item-center">
                <FolderOpenIcon size="small" /> Unused Content Types
              </Box>
            </Button>
          </Tooltip>
        </Flex>

        <Box className="flex-item-right">
          {activeReport === "entry" && (
            <>
              {fetchingTypes ? (
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  padding="spacingL"
                >
                  <Spinner size="large" />
                </Flex>
              ) : contentTypes.length === 0 ? (
                <NotFound />
              ) : (
                <ContentTypeSelector
                  contentTypes={contentTypes}
                  selectedContentType={selectedContentType}
                  isGeneratingEntryReport={isGeneratingEntryReport}
                  onSelectContentType={handleEntryReportSelect}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                />
              )}

              {selectedContentType && !isGeneratingEntryReport && (
                <>
                  {unusedEntries.length > 0 ? (
                    <GenerateEntryReport
                      entries={unusedEntries}
                      onDeleteSelected={handleDeleteEntries}
                      page={page}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setPage}
                      onItemsPerPageChange={(count) => {
                        setPage(Math.floor((itemsPerPage * page + 1) / count));
                        setItemsPerPage(count);
                      }}
                      searchQuery={searchQuery}
                    />
                  ) : (
                    <NotFound />
                  )}
                </>
              )}
            </>
          )}

          {activeReport === "media" && (
            <>
              {loadingState === "media" ? (
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  padding="spacingL"
                >
                  <Spinner size="large" />
                </Flex>
              ) : unusedMedia.length > 0 ? (
                <GenerateMediaReport
                  unusedMedia={unusedMedia}
                  selectedAssets={selectedAssets}
                  toggleAssetSelection={toggleAssetSelection}
                  handleDeleteAssets={handleDeleteAssets}
                />
              ) : (
                <NotFound />
              )}
            </>
          )}

          {activeReport === "types" && (
            <>
              {loadingState === "types" ? (
                <Flex
                  justifyContent="center"
                  alignItems="center"
                  padding="spacingL"
                >
                  <Spinner size="large" />
                </Flex>
              ) : unusedContentTypes.length > 0 ? (
                <GenerateUnusedContentTypesReport
                  unusedContentTypes={unusedContentTypes}
                  isLoading={false}
                  selectedTypes={selectedContentTypes}
                  toggleTypeSelection={toggleContentTypeSelection}
                  handleDeleteTypes={handleDeleteContentTypes}
                />
              ) : (
                <NotFound />
              )}
            </>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

export default Page;
