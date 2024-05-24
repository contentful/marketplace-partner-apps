import { PageAppSDK } from "@contentful/app-sdk";
import {
  Note,
  Skeleton,
  Flex,
  Grid,
  Box,
  FormControl,
  Select,
  Button,
  Text,
  Heading,
  Checkbox,
  Tooltip,
  TextInput,
  TextLink,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { useState, useRef, useEffect, ChangeEvent, useContext } from "react";
import LoadingBar from "react-top-loading-bar";
import { GCEntry, ExtendedGCTemplate, EntryFilters } from "@/type/types";
import {
  getAvailableStatuses,
  getFilteredEntries,
  splitEntriesByCFConnection,
} from "@/utils/entriesImport";
import { DownloadTrimmedIcon, WarningTrimmedIcon } from "@contentful/f36-icons";
import { TemplatesContext } from "@/context/templatesProvider";
import { loadMappingData } from "@/utils/contentful";
import useError from "@/hooks/useError";
import useEntriesCount from "@/hooks/useEntriesCount";
import useImportService from "@/hooks/useImportService";
import { formatDate, getCFItemLink, getGCItemLink } from "@/utils/common";
import { RefreshButton } from "../common/RefreshButton";

type AvailableStatus = Pick<
  GCEntry,
  "status_color" | "status_id" | "status_name"
>;

export function ImportEntries({ selectedTemplate }: { selectedTemplate: ExtendedGCTemplate | null }) {
  const sdk = useSDK<PageAppSDK>();
  const loadingBarRef = useRef<any>(null);
  const { error, handleError, clearError } = useError();
  const { syncTemplates } = useContext(TemplatesContext);
  let template = selectedTemplate;
  const [importInProgress, setImportInProgress] = useState(false);
  const {
    entriesCount,
    incrementEntriesCount,
    setEntriesTotal,
    resetEntriesCount,
  } = useEntriesCount();
  const entries = useRef<GCEntry[]>([]);
  const availableStatuses = useRef<AvailableStatus[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filteredEntries, setFilteredEntries] = useState<GCEntry[]>([]);
  const [filters, setFilters] = useState<Map<EntryFilters, string>>(new Map());
  const { getEntries, createEntries, updateEntries } =
    useImportService(handleError);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const counterProgress = entriesCount.total
    ? `: ${entriesCount.current}/${entriesCount.total}`
    : "";

  function changeFilters(filter: EntryFilters, value: string) {
    if (value) {
      filters.set(filter, value);
    } else {
      filters.delete(filter);
    }
    setFilters(new Map(filters));
  }

  function onSelectEntry(e: ChangeEvent<HTMLInputElement>) {
    const { checked, value } = e.target;
    if (checked) {
      selectedIds.add(value);
    } else {
      selectedIds.delete(value);
    }
    setSelectedIds(new Set(selectedIds));
  }

  function onSelectAll(e: ChangeEvent<HTMLInputElement>) {
    const { checked } = e.target;
    if (checked) {
      filteredEntries.forEach((entry) => selectedIds.add(entry.id));
    } else {
      selectedIds.clear();
    }
    setSelectedIds(new Set(selectedIds));
  }

  async function loadEntries() {
    if (!template) {
      sdk.notifier.error("Template not selected");
      handleError("Error: Failed to load template");
      return;
    }
    const adaptedEntries = await getEntries(template);
    if (!adaptedEntries) return;
    entries.current = adaptedEntries;
    availableStatuses.current = getAvailableStatuses(adaptedEntries);
    setFilteredEntries([...adaptedEntries]);
    setLoadingEntries(false);
  }

  async function handleImport() {
    setImportInProgress(true);
    loadingBarRef.current?.continuousStart();
    clearError();
    setEntriesTotal(selectedIds.size);
    try {
      const { config, contentType } = await loadMappingData(
        template as ExtendedGCTemplate,
        sdk
      );
      const splitEntries = splitEntriesByCFConnection(
        filteredEntries.filter((entry) => selectedIds.has(entry.id))
      );
      await Promise.all([
        updateEntries(config, splitEntries[0], incrementEntriesCount),
        createEntries(
          config,
          contentType,
          splitEntries[1],
          incrementEntriesCount
        ),
      ]);
      await loadEntries();
      sdk.notifier.success("Entries imported successfully");
      selectedIds.clear();
      setSelectedIds(new Set(selectedIds));
    } catch (error: any) {
      sdk.notifier.error("Error: Failed to import entries");
      handleError(error);
    } finally {
      setImportInProgress(false);
      loadingBarRef.current?.complete();
      resetEntriesCount();
    }
  }

  async function refreshEntries() {
    if (loadingEntries) return;
    clearError();
    setLoadingEntries(true);
    await loadEntries();
  }

  useEffect(() => {
    loadEntries();
    template = syncTemplates(selectedTemplate);
  }, []);

  useEffect(() => {
    if (error) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }
  }, [error]);

  useEffect(() => {
    if (entries.current.length > 0) {
      const filtered = getFilteredEntries(entries.current, filters);
      setFilteredEntries(filtered);
    }
  }, [filters]);

  if (!template) {
    return <Note variant="negative">No template selected</Note>;
  }

  return (
    <>
      <LoadingBar color="#f11946" ref={loadingBarRef} />
      {error && <Note variant="negative">{error}</Note>}

      <Flex gap="spacingS" justifyContent="space-between" alignItems="center">
        <Heading marginTop="spacingL" marginBottom="spacingL">
          Import entries for "{template.name}"
        </Heading>
        <RefreshButton
          disabled={loadingEntries}
          description="Reload template's entries"
          onClick={refreshEntries}
        />
      </Flex>

      <Box>
        <Grid
          marginBottom="spacingXs"
          columnGap="spacingM"
          alignContent="center"
          columns="1fr 3fr 3fr 3fr 2fr"
        >
          <Flex justifyContent="center">
            <FormControl>
              <FormControl.Label>Select all</FormControl.Label>
              <Flex justifyContent="center">
                <Checkbox
                  onChange={onSelectAll}
                  style={{ justifyContent: "center" }}
                ></Checkbox>
              </Flex>
            </FormControl>
          </Flex>
          <FormControl style={{ maxWidth: "80%" }}>
            <FormControl.Label>Item Status</FormControl.Label>
            <Select
              value={filters.get(EntryFilters.Status) || ""}
              onChange={(e) =>
                changeFilters(EntryFilters.Status, e.target.value)
              }
              size="small"
            >
              <Select.Option value="">All</Select.Option>
              {availableStatuses.current.map((item) => (
                <Select.Option key={item.status_id} value={item.status_id}>
                  <Box
                    as="span"
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: item.status_color,
                    }}
                  ></Box>
                  {item.status_name}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
          <FormControl style={{ maxWidth: "80%" }}>
            <FormControl.Label>Content Workflow Item Name</FormControl.Label>
            <TextInput
              value={filters.get(EntryFilters.GCName) || ""}
              onChange={(e) =>
                changeFilters(EntryFilters.GCName, e.target.value)
              }
              placeholder="Content Workflow Item Name"
            ></TextInput>
          </FormControl>
          <FormControl style={{ maxWidth: "80%" }}>
            <FormControl.Label>Contentful Content Name</FormControl.Label>
            <TextInput
              value={filters.get(EntryFilters.CFName) || ""}
              onChange={(e) =>
                changeFilters(EntryFilters.CFName, e.target.value)
              }
              placeholder="Contentful Content Name"
            ></TextInput>
          </FormControl>
          <Text fontWeight="fontWeightDemiBold">Last Import Date</Text>
        </Grid>
        {loadingEntries ? (
          <Skeleton.Container>
            <Skeleton.BodyText numberOfLines={4} />
          </Skeleton.Container>
        ) : (
          <>
            {entries.current.length > 0 &&
              filteredEntries.map((entry) => (
                <Grid
                  marginBottom="spacingXs"
                  key={entry.id}
                  columnGap="spacingM"
                  columns="1fr 3fr 3fr 3fr 2fr"
                >
                  <Flex
                    style={{ position: "relative" }}
                    justifyContent="center"
                  >
                    <Checkbox
                      value={entry.id}
                      isChecked={selectedIds.has(entry.id)}
                      onChange={onSelectEntry}
                    ></Checkbox>
                    {entry.cfEntryProps && (
                      <Tooltip maxWidth={"unset"}
                        placement="top"
                        style={{ position: "absolute", right: "16px" }}
                        content="An entry already exists in Contentful, content will be overwritten on import"
                      >
                        <WarningTrimmedIcon variant="muted" size="tiny" />
                      </Tooltip>
                    )}
                  </Flex>
                  <Flex alignItems="center" gap="spacingXs">
                    <Box
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        display: "inline-block",
                        background: entry.status_color,
                      }}
                    ></Box>
                    <Text>{entry.status_name}</Text>
                  </Flex>
                  <TextLink
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                    target="_blank"
                    href={getGCItemLink(entry.id, (template as ExtendedGCTemplate).account_slug)}
                  >
                    {entry.name}
                  </TextLink>
                  {entry.cfEntryTitle ? (
                    <TextLink
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                      }}
                      target="_blank"
                      href={getCFItemLink(
                        entry.id,
                        sdk.ids.space,
                        sdk.ids.environment
                      )}
                    >
                      {entry.cfEntryTitle}
                    </TextLink>
                  ) : (
                    <Text>-</Text>
                  )}
                  <Text>{entry.lastImportedAt}</Text>
                </Grid>
              ))}
          </>
        )}
      </Box>

      <Flex justifyContent="flex-end" marginTop="spacingL">
        <Button
          variant="positive"
          endIcon={<DownloadTrimmedIcon />}
          isDisabled={importInProgress || selectedIds.size === 0}
          isLoading={importInProgress}
          onClick={handleImport}
        >
          Import selected {counterProgress}
        </Button>
      </Flex>
    </>
  );
}
