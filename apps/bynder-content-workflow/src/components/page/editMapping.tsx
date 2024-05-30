import { PageAppSDK } from "@contentful/app-sdk";
import {
  Accordion,
  Note,
  Heading,
  Flex,
  Button,
  Tooltip,
  Skeleton, TextLink,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { DisplayField, displayFields } from "@/consts/displayFields";
import { useState, useRef, useEffect, ChangeEvent, useContext } from "react";
import LoadingBar from "react-top-loading-bar";
import { EditTrimmedIcon, DownloadTrimmedIcon } from "@contentful/f36-icons";
import {
  AppScreens,
  CFFieldType,
  ExtendedGCTemplate,
  Field,
  MappingData,
  StatusMapping,
} from "@/type/types";
import { MappingMainSettings } from "./mappingMainSettings";
import {
  getMappedCfField,
  initMappingSettings,
  setMappingFromModel,
  updateFieldMappingCfId,
  updateFieldMappingType,
  getConfigFromMappingData,
  areMappedFieldsPresent,
  isMappingDataUnchanged,
} from "@/utils/fieldMapping";
import { ContentTypeProps } from "contentful-management";
import { MappingFields } from "./mappingFields";
import { MappingStatuses } from "./mappingStatuses";
import { TemplatesContext } from "@/context/templatesProvider";
import { parseCredentials } from "@/services/api";
import useError from "@/hooks/useError";
import useMappingService from "@/hooks/useMappingService";
import { RefreshButton } from "../common/RefreshButton";

export function EditMapping({
  selectedTemplate,
  importEntriesForTemplate,
}: {
  selectedTemplate: ExtendedGCTemplate;
  importEntriesForTemplate: (
    template: ExtendedGCTemplate,
    currentScreen: AppScreens
  ) => void;
}) {
  const sdk = useSDK<PageAppSDK>();
  const loadingBarRef = useRef<any>(null);
  const { updateSingleTemplate, syncTemplates } = useContext(TemplatesContext);
  const [template, setTemplate] = useState<ExtendedGCTemplate | null>(
    selectedTemplate
  );
  const [creatingInProgress, setCreatingInProgress] = useState(false);
  const { error, handleError, clearError } = useError();
  const [mappingData, setMappingData] = useState<MappingData | null>(null);
  const [displayField, setDisplayField] = useState<DisplayField>(
    displayFields.init(mappingData?.fields || [])
  );
  const [availableModels, setAvailableModels] = useState<ContentTypeProps[]>(
    []
  );
  const [selectedCFModel, setSelectedCFModel] =
    useState<ContentTypeProps | null>(null);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const {
    getModelById,
    getUnmappedModels,
    deleteTemplateMapping,
    createModel,
    updateModel,
    refreshTemplateData,
  } = useMappingService();
  const [loadingData, setLoadingData] = useState(false);

  async function deleteMapping(modelId: string) {
    if (!template) return;
    try {
      const updatedTemplate = await deleteTemplateMapping(modelId, template);
      setTemplate(updatedTemplate ? { ...updatedTemplate } : null);
      loadAvailableModels();
    } catch (error: any) {
      handleError(error);
      sdk.notifier.error("Error: Failed to delete the mapping");
    }
  }

  async function loadMappedModel(modelId: string) {
    try {
      const model = await getModelById(modelId);
      setSelectedCFModel(model);
    } catch (error: any) {
      setSelectedCFModel(null);
      setTemplate((prev) => {
        if (!prev) return prev;
        return { ...prev, mappedCFModel: undefined, mappingConfig: undefined };
      })
      handleError(error);
      sdk.notifier.error("Error: Failed to load the mapped Contentful model");
    }
  }

  async function loadAvailableModels() {
    try {
      const unmappedModels = await getUnmappedModels();
      setAvailableModels(unmappedModels);
    } catch (error: any) {
      handleError(error);
      sdk.notifier.error("Error: Failed to load Contentful models");
    }
  }

  function onSelectCFType(
    evt: ChangeEvent<HTMLSelectElement>,
    fieldId: string
  ) {
    const { value } = evt.target;
    const updatedMappingFields = updateFieldMappingType(
      mappingData?.fields || [],
      fieldId,
      value as CFFieldType
    );
    setMappingData((prev) => {
      if (!prev) return prev;
      return { ...prev, fields: updatedMappingFields };
    });

    const canBeUsed = displayFields.fieldIsAllowed(value as CFFieldType);

    if (canBeUsed) displayFields.setSelect(fieldId, setDisplayField);
    else displayFields.delete(fieldId, setDisplayField);
  }

  function onSelectCFField(
    evt: ChangeEvent<HTMLSelectElement>,
    fieldId: string,
    gcField: Field
  ) {
    if (!mappingData || !selectedCFModel) return;
    let field = getMappedCfField(selectedCFModel.fields, evt.target.value);
    if (!field) {
      field = {
        id: evt.target.value,
        name: evt.target.value,
        type: CFFieldType.Ignore,
        required: false,
        localized: false,
      };
    }
    const updatedMappingFields = updateFieldMappingCfId(
      mappingData.fields,
      fieldId,
      field,
      gcField
    );
    setMappingData((prev) => {
      if (!prev) return prev;
      return { ...prev, fields: updatedMappingFields };
    });
  }

  function onChangeCheckbox(uuid: string) {
    displayFields.setCheckbox(uuid, setDisplayField);
  }

  function onUseGCEntryTitle(checked: boolean) {
    setMappingData((prev) => {
      if (!prev) return prev;
      return { ...prev, useGCEntryTitle: checked };
    });
  }

  function onSelectCFModel(modelId: string) {
    if (!template) return;
    const model =
      availableModels.find((model) => model.sys.id === modelId) || null;
    setSelectedCFModel(model);
    displayFields.setCFDisplayField(
      model?.displayField || null,
      setDisplayField
    );
    if (!model) {
      setMappingData((prev) => {
        if (!prev) return prev;
        return initMappingSettings(template);
      });
    } else {
      setMappingData((prev) => {
        if (!prev) return prev;
        return setMappingFromModel(model, template);
      });
    }
  }

  function onSetStatusMapping(statuses: StatusMapping[]) {
    setMappingData((prev) => {
      if (!prev) return prev;
      return { ...prev, statuses };
    });
  }

  function onChangeMainSettings(key: keyof MappingData, value: string) {
    setMappingData((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  }

  async function createCFModel() {
    if (!template || !mappingData) return null;
    const created = await createModel(
      template,
      mappingData,
      displayField.selected
    );
    setSelectedCFModel(created);
    return created.sys.id;
  }

  async function handleSubmit() {
    if (!template || !mappingData) return;
    clearError();
    setCreatingInProgress((p) => !p);
    loadingBarRef.current?.continuousStart();
    const isUpdating = !!template.mappedCFModel;
    try {
      let modelId;
      if (isUpdating || selectedCFModel) {
        modelId = await updateModel(
          template,
          mappingData,
          selectedCFModel,
          displayField.selected
        );
      } else {
        modelId = await createCFModel();
      }
      if (modelId) {
        const updatedTemplate = updateSingleTemplate({
          ...template,
          mappedCFModel: modelId,
          mappingConfig: JSON.stringify(getConfigFromMappingData(mappingData)),
        });
        await loadMappedModel(modelId);
        setTemplate(updatedTemplate ? { ...updatedTemplate } : null);
      } else {
        throw new Error("Failed to create/update Contentful model");
      }
      sdk.notifier.success(
        `Template mapping ${isUpdating ? "updated" : "created"} successfully`
      );
      importEntriesForTemplate(template, AppScreens.EditMapping);
    } catch (error: any) {
      handleError(error);
      sdk.notifier.error(
        `Error: Failed to ${isUpdating ? "update" : "create"} template mapping`
      );
    } finally {
      setCreatingInProgress(false);
      loadingBarRef.current?.complete();
    }
  }

  async function refreshTemplate() {
    if (!template || loadingData) return;
    setLoadingData(true);
    clearError();
    const updated = await refreshTemplateData(template);
    setTemplate(updated ? { ...updated } : null);
    if (updated?.mappedCFModel) {
      loadMappedModel(updated.mappedCFModel);
    }
    setLoadingData(false);
  }

  useEffect(() => {
    if (!template) return;
    const syncedTemplate = syncTemplates(template);
    if (!syncedTemplate) {
      sdk.notifier.error(
        "Error: Failed to sync template, please try to refresh template data"
      );
      setTemplate(null);
      return;
    }
    setTemplate(syncedTemplate);

    // check credentials first
    const credentials = parseCredentials(sdk.parameters.installation);
    if (!credentials) {
      sdk.notifier.error("Please configure the app first");
      handleError("Missing configuration");
      return;
    }
    if (syncedTemplate.mappedCFModel) {
      loadMappedModel(syncedTemplate.mappedCFModel);
    } else {
      loadAvailableModels();
    }
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
    setMappingData(initMappingSettings(template));
  }, [template]);

  useEffect(() => {
    if (!selectedCFModel || !template) return;
    setMappingData((prev) => {
      if (!prev) return prev;
      return setMappingFromModel(
        selectedCFModel,
        template,
        mappingData?.fields,
        mappingData?.statuses,
        mappingData?.useGCEntryTitle
      );
    });
  }, [selectedCFModel]);

  useEffect(() => {
    const isSubmitDisabled = template?.mappingConfig
      ? isMappingDataUnchanged(mappingData, template.mappingConfig)
      : !areMappedFieldsPresent(mappingData);
    setSubmitDisabled(isSubmitDisabled);
    if (mappingData) {
      setDisplayField(displayFields.init(mappingData.fields));
    }
  }, [mappingData]);

  if (!template) {
    return <Note variant="negative">No template selected</Note>;
  }

  return (
    <>
      <LoadingBar color="#f11946" ref={loadingBarRef} />

      {error && (
        <>
          <br />
          <Note variant="negative">{error}</Note>
        </>
      )}

      {template.mappedCFModel && (
        <>
          <br />
          <Note style={{ position: "relative" }} variant="primary">
            Template mapping already exists. You can edit the mapping
            configuration or import entries.
            <Tooltip
              style={{ position: "absolute", top: "6px", right: "12px" }}
              placement="bottom"
              content="This action will not delete the mapped content model or its items"
            >
              <Button
                onClick={() => deleteMapping(template.mappedCFModel as string)}
                variant="negative"
              >
                Delete mapping
              </Button>
            </Tooltip>
          </Note>
        </>
      )}

      <Flex gap="spacingS" justifyContent="space-between" alignItems="center">
        <Heading marginTop="spacingM">
          {template.mappedCFModel ? "Edit" : "Create"} template mapping for: {}
          <TextLink
              style={{
                fontSize: "1.25rem",
              }}
              target="_blank"
              href={`https://${template.account_slug}.gathercontent.com/projects/${template.project_id}/templates/${template.id}`}>
            {template.name}
          </TextLink>
        </Heading>
        <RefreshButton
          disabled={loadingData}
          description="Refresh template data"
          onClick={refreshTemplate}
        ></RefreshButton>
      </Flex>

      {loadingData ? (
        <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={3} />
        </Skeleton.Container>
      ) : (
        <>
          {mappingData && (
            <Accordion>
              <Accordion.Item title="Content Type Destination">
                <MappingMainSettings
                  mappingData={mappingData}
                  template={template}
                  availableModels={availableModels}
                  onSelectCFModel={onSelectCFModel}
                  disableTextInput={!!selectedCFModel}
                  modelName={selectedCFModel?.name}
                  onChangeMappingData={onChangeMainSettings}
                />
              </Accordion.Item>
              <Accordion.Item title="Field Mapping">
                <MappingFields
                  selectedCFModel={selectedCFModel}
                  groups={template.structure.groups}
                  mappingData={mappingData}
                  displayField={displayField}
                  onChangeCheckbox={onChangeCheckbox}
                  onUseGCEntryTitle={onUseGCEntryTitle}
                  onSelectCFType={onSelectCFType}
                  onSelectCFField={onSelectCFField}
                />
              </Accordion.Item>
              <Accordion.Item title="Status Mapping">
                <MappingStatuses
                  setStatusMappings={onSetStatusMapping}
                  setError={handleError}
                  template={template}
                />
              </Accordion.Item>
            </Accordion>
          )}
          <Flex gap="spacingM" justifyContent="flex-end" marginTop="spacingM">
            <Button
              variant="positive"
              endIcon={<DownloadTrimmedIcon />}
              isDisabled={!template.mappedCFModel}
              onClick={() =>
                importEntriesForTemplate(template, AppScreens.EditMapping)
              }
            >
              Import Entries
            </Button>
            <Button
              variant="primary"
              endIcon={<EditTrimmedIcon />}
              isLoading={creatingInProgress}
              isDisabled={submitDisabled || creatingInProgress}
              onClick={handleSubmit}
            >
              {template.mappedCFModel ? "Update mapping" : "Create mapping"}
            </Button>
          </Flex>
        </>
      )}
    </>
  );
}
