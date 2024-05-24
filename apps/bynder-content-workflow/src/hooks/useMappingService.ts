import { CF_GC_ENTRY_NAME_FIELD, CF_HIDDEN_FIELD } from "@/consts/fieldMap";
import { TemplatesContext } from "@/context/templatesProvider";
import { CFFieldType, ExtendedGCTemplate, MappingData } from "@/type/types";
import {
  composeNewFieldsForCf,
  filterUnmappedModels,
  findMappedModelConfig,
  getFieldCfId,
  getMappedModelsTemplates,
  populateGCEntryNameField,
  populateHiddenField,
} from "@/utils/fieldMapping";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { useContext } from "react";
import useComponentsMapping from "./useComponentsMapping";
import { setFieldControls } from "@/utils/contentful";
import {
  ContentFields,
  ContentTypeProps,
  KeyValueMap,
} from "contentful-management";
import { getFieldsFromStructure } from "@/utils/entriesExport";
import {
  getSingleAccount,
  getSingleProject,
  getSingleTemplate,
  parseCredentials,
} from "@/services/api";

export default function useMappingService() {
  const sdk = useSDK<PageAppSDK>();
  const { updateSingleTemplate } = useContext(TemplatesContext);
  const { createNewComponentFields, updateComponentFields } =
    useComponentsMapping();

  async function getUnmappedModels() {
    const models = await sdk.cma.contentType.getMany({
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
    });
    return filterUnmappedModels(models.items);
  }

  async function getModelById(id: string) {
    return await sdk.cma.contentType.get({
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
      contentTypeId: id,
    });
  }

  async function deleteTemplateMapping(
    modelId: string,
    template: ExtendedGCTemplate
  ) {
    const model = await sdk.cma.contentType.get({
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
      contentTypeId: modelId,
    });
    const newFields = model.fields.filter(
      (field) => field.id !== CF_HIDDEN_FIELD
    );
    const updated = await sdk.cma.contentType.update(
      {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        contentTypeId: modelId,
      },
      {
        ...model,
        fields: newFields,
      }
    );
    await sdk.cma.contentType.publish(
      { contentTypeId: updated.sys.id },
      updated
    );
    return updateSingleTemplate({
      ...template,
      mappedCFModel: undefined,
      mappingConfig: undefined,
    });
  }

  async function createModel(
    template: ExtendedGCTemplate,
    mappingData: MappingData,
    selectedField?: string
  ) {
    const { fields, components } = composeNewFieldsForCf(mappingData, template);
    let componentFields: ContentFields[] = [];
    if (components.length) {
      componentFields = await createNewComponentFields(components);
    }
    let displayField = selectedField
      ? getFieldCfId(mappingData.fields, selectedField)
      : fields[0].id;
    if (mappingData.useGCEntryTitle) {
      fields.unshift(populateGCEntryNameField());
      displayField = CF_GC_ENTRY_NAME_FIELD;
    }
    const created = await sdk.cma.contentType.create(
      {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      },
      {
        name: mappingData.name,
        description: mappingData.description,
        fields: [...fields, ...componentFields],
        displayField,
      }
    );
    await sdk.cma.contentType.publish(
      { contentTypeId: created.sys.id },
      created
    );
    await setFieldControls(created, sdk, mappingData);
    return created;
  }

  async function updateModel(
    template: ExtendedGCTemplate,
    mappingData: MappingData,
    selectedCFModel: ContentTypeProps | null,
    selectedField?: string
  ) {
    if (!selectedCFModel) {
      throw new Error("Can't get Contentful model to map to");
    }
    const hiddenField = populateHiddenField(mappingData);
    const templateFields = getFieldsFromStructure(template.structure);
    if (!hiddenField) {
      throw new Error("Mapping data is missing");
    }
    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environment;
    const freshModelVersion = await sdk.cma.contentType.get({
      spaceId,
      environmentId,
      contentTypeId: selectedCFModel.sys.id,
    });
    let updatedFields = [...freshModelVersion.fields];
    let displayField = selectedField
      ? getFieldCfId(mappingData.fields, selectedField)
      : freshModelVersion.displayField;
    let updatedComponentFields: ContentFields[] = [];
    if (template.mappedCFModel) {
      updatedFields = updatedFields.filter(
        (field) => field.id !== CF_HIDDEN_FIELD
      );
    }
    const componentFields = (mappingData as MappingData).fields
      .filter((field) => {
        return (
          field.type === CFFieldType.Components ||
          field.type === CFFieldType.SingleComponent
        );
      })
      .map((field) => {
        return {
          cfField: updatedFields.find(
            (f) => f.id === field.cfId
          ) as ContentFields,
          gcField: templateFields[field.gcId],
        };
      })
      .filter((field) => field.cfField && field.gcField);
    if (componentFields.length > 0) {
      updatedFields = updatedFields.filter(
        (item) =>
          componentFields.findIndex((field) => field.cfField.id === item.id) ===
          -1
      );
      updatedComponentFields = await updateComponentFields(componentFields);
    }
    if (mappingData.useGCEntryTitle) {
      if (!updatedFields.find((field) => field.id === CF_GC_ENTRY_NAME_FIELD)) {
        updatedFields.unshift(populateGCEntryNameField());
      }
      displayField = CF_GC_ENTRY_NAME_FIELD;
    }
    const updated = await sdk.cma.contentType.update(
      {
        spaceId,
        environmentId,
        contentTypeId: selectedCFModel.sys.id,
      },
      {
        ...freshModelVersion,
        fields: [...updatedFields, ...updatedComponentFields, hiddenField],
        displayField,
      }
    );
    await sdk.cma.contentType.publish(
      { contentTypeId: updated.sys.id },
      updated
    );
    await setFieldControls(selectedCFModel, sdk, mappingData);
    return updated.sys.id;
  }

  async function refreshTemplateData(template: ExtendedGCTemplate | null) {
    if (!template) {
      sdk.notifier.error("Can't refresh template: template is missing");
      return;
    }
    const credentials = parseCredentials(sdk.parameters.installation);
    if (!credentials) {
      sdk.notifier.error("Can't refresh template: credentials are missing");
      return;
    }
    const freshTemplate = await getSingleTemplate(credentials, template.id);
    if (!freshTemplate || !freshTemplate.data) {
      sdk.notifier.error(
        `Can't refresh template: template with id ${template.id} not found`
      );
      return;
    }

    const fullTemplate: ExtendedGCTemplate = {
      ...template,
      ...freshTemplate.data,
      id: freshTemplate.data.id.toString(),
      project_id: freshTemplate.data.project_id.toString(),
      structure: freshTemplate.related.structure,
    };

    const result = updateSingleTemplate(fullTemplate);
    if (result) {
      sdk.notifier.success("Template data refreshed successfully");
    } else {
      sdk.notifier.error("Failed to refresh template, try to refresh the page");
    }
    return result;
  }

  async function getAllMappedTemplates() {
    const credentials = parseCredentials(sdk.parameters.installation);
    if (!credentials) {
      sdk.notifier.error("Can't fetch templates: credentials are missing");
      return null;
    }
    const models = await sdk.cma.contentType.getMany({
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
    });
    if (!models.items) {
      sdk.notifier.error("Can't fetch templates: models are missing");
      return null;
    }
    const temlateIds = getMappedModelsTemplates(models.items);
    let templatePromises: Promise<any>[] = [];
    for (let templateId of temlateIds) {
      templatePromises.push(getSingleTemplate(credentials, templateId));
    }
    const templates = await Promise.all(templatePromises);
    const adaptedTemplates = templates.map<ExtendedGCTemplate>((template) => {
      const mapping = findMappedModelConfig(
        models.items as ContentTypeProps[],
        template.data.id.toString()
      );
      return {
        ...template.data,
        id: template.data.id.toString(),
        project_id: template.data.project_id.toString(),
        structure: template.related.structure,
        mappedCFModel: mapping?.modelId,
        mappingConfig: mapping?.config,
      };
    });
    let templatesProjects: Promise<any>[] = [];
    const templateProjIds = new Set(
      adaptedTemplates.map((template) => template.project_id)
    );
    for (let projId of templateProjIds) {
      templatesProjects.push(getSingleProject(credentials, projId));
    }
    const projects = (await Promise.all(templatesProjects)).map(
      (project) => project?.data
    );
    const templatesWithProjects = adaptedTemplates.map<ExtendedGCTemplate>(
      (template) => {
        const templateProject = projects.find(
          (project) => project?.id?.toString() === template.project_id
        );
        return {
          ...template,
          project_name: templateProject?.name || "",
          account_id: templateProject?.account_id?.toString() || "",
        };
      }
    );
    let templatesAccounts: Promise<any>[] = [];
    const templateAccIds = new Set(
      templatesWithProjects.map((template) => template.account_id)
    );
    for (let accId of templateAccIds) {
      templatesAccounts.push(getSingleAccount(credentials, accId));
    }
    const accounts = (await Promise.all(templatesAccounts)).map(
      (account) => account?.data
    );
    const templatesWithAccounts = templatesWithProjects.map<ExtendedGCTemplate>(
      (template) => {
        const templateAccount = accounts.find(
          (account) => account?.id === template.account_id
        );
        return {
          ...template,
          account_slug: templateAccount?.slug || "",
        };
      }
    );
    return templatesWithAccounts as ExtendedGCTemplate[];
  }

  return {
    getUnmappedModels,
    getModelById,
    deleteTemplateMapping,
    createModel,
    updateModel,
    refreshTemplateData,
    getAllMappedTemplates,
  };
}
