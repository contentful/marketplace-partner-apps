import { isPublished, isDraft, ContentTypeProps } from "contentful-management";
import { isArchived } from "./statusesMapping";
import { ExtendedGCTemplate, MappingConfig } from "@/type/types";
import {
  findMappedModelConfig,
  getRepeatableTextFieldIds,
  updateCFControls,
} from "./fieldMapping";
import { CMAClient, PageAppSDK } from "@contentful/app-sdk";
import { parseMapping } from "./parseMapping";

// the sidebar's default state can't be fetched via editor interface API
// the docs (https://www.contentful.com/developers/docs/extensibility/app-framework/editor-interfaces/)
// suggest to just download a JSON with default state represented below
const sidebarInterfaceDefaults = [
  {
    widgetId: "publication-widget",
    widgetNamespace: "sidebar-builtin",
  },
  {
    widgetId: "content-workflows-tasks-widget",
    widgetNamespace: "sidebar-builtin",
  },
  {
    widgetId: "content-preview-widget",
    widgetNamespace: "sidebar-builtin",
  },
  {
    widgetId: "incoming-links-widget",
    widgetNamespace: "sidebar-builtin",
  },
  {
    widgetId: "translation-widget",
    widgetNamespace: "sidebar-builtin",
  },
  {
    widgetId: "versions-widget",
    widgetNamespace: "sidebar-builtin",
  },
];

export async function publishCFEntry(
  entryId: string,
  cma: CMAClient,
  spaceId: string,
  environmentId: string
) {
  const entry = await cma.entry.get({ entryId });
  if (isPublished(entry)) return;
  if (isArchived(entry)) {
    await cma.entry.unarchive({
      spaceId: spaceId,
      environmentId: environmentId,
      entryId: entry.sys.id,
    });
  }
  await cma.entry.publish(
    {
      spaceId: spaceId,
      environmentId: environmentId,
      entryId: entry.sys.id,
    },
    entry
  );
}

export async function archiveCFEntry(
  entryId: string,
  cma: CMAClient,
  spaceId: string,
  environmentId: string
) {
  const entry = await cma.entry.get({ entryId });
  if (isArchived(entry)) return;
  if (isPublished(entry)) {
    await cma.entry.unpublish({
      spaceId: spaceId,
      environmentId: environmentId,
      entryId: entry.sys.id,
    });
  }
  await cma.entry.archive({
    spaceId: spaceId,
    environmentId: environmentId,
    entryId: entry.sys.id,
  });
}

export async function makeEntryDraft(
  entryId: string,
  cma: CMAClient,
  spaceId: string,
  environmentId: string
) {
  const entry = await cma.entry.get({ entryId });
  if (isDraft(entry)) return;
  if (isArchived(entry)) {
    await cma.entry.unarchive({
      spaceId: spaceId,
      environmentId: environmentId,
      entryId: entry.sys.id,
    });
  }
  if (isPublished(entry)) {
    await cma.entry.unpublish({
      spaceId: spaceId,
      environmentId: environmentId,
      entryId: entry.sys.id,
    });
  }
}

export async function deleteEntry(cma: CMAClient, entryId: string) {
  try {
    await cma.entry.unpublish({ entryId });
    await cma.entry.delete({ entryId });
  } catch (error) {
    // if for some reason we can't delete the entry, just skip it
  }
}

export async function setFieldControls(
  contentType: ContentTypeProps,
  sdk: PageAppSDK,
  config: MappingConfig
) {
  const contentTypeId = contentType.sys.id;
  const repeatableTextFields = getRepeatableTextFieldIds(config);
  const editorInterface = await sdk.cma.editorInterface.get({
    contentTypeId,
  });
  const appId = sdk.ids.app as string;
  await sdk.cma.editorInterface.update(
    {
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
      contentTypeId,
    },
    {
      ...editorInterface,
      controls: updateCFControls(
        editorInterface.controls,
        appId,
        repeatableTextFields
      ),
      sidebar: [
        {
          widgetNamespace: "app",
          widgetId: appId,
        },
        ...sidebarInterfaceDefaults,
      ],
    }
  );
}

export async function loadMappingData(
  template: ExtendedGCTemplate,
  sdk: PageAppSDK
) {
  let contentTypesItems =
    (
      await sdk.cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      })
    )?.items || [];
  const mappedModelConfig = findMappedModelConfig(
    contentTypesItems,
    (template as ExtendedGCTemplate).id
  );
  if (!mappedModelConfig) {
    throw new Error(
      "Template mapping data not found. Try to recreate the mapping"
    );
  }
  const parsedConfig = parseMapping(mappedModelConfig.config);
  if (!parsedConfig) {
    throw new Error(
      "Can not parse template mapping data. Try to recreate the mapping"
    );
  }
  return { config: parsedConfig, contentType: mappedModelConfig.modelId };
}
